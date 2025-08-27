// netlify/functions/getPublicFeed.ts
// 🚀 UNIFIED FEED FUNCTION - The single source of truth for all public media
// Handles: Ghibli, Emotion Mask, Presets, Custom, AND Neo Tokyo Glitch
// Provides consistent, deduplicated feed data for the main application

const { PrismaClient } = require('@prisma/client');

exports.handler = async (event) => {
  // 🚨 ENHANCED: Better request logging and validation
  console.log('🔍 [getPublicFeed] Request received:', {
    method: event.httpMethod,
    path: event.path,
    queryString: event.queryStringParameters,
    headers: Object.keys(event.headers || {}),
    timestamp: new Date().toISOString()
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'GET') {
    console.error('❌ [getPublicFeed] Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Method not allowed',
        received: event.httpMethod,
        allowed: 'GET'
      })
    };
  }

  try {
    // 🚀 ENHANCED: Support for filtering and advanced querying
    const { 
      limit = '20', 
      offset = '0',
      type = 'all',           // 'all', 'media-asset', 'neo-glitch'
      preset = 'all',         // 'all', 'ghibli', 'emotionmask', 'neotokyoglitch', etc.
      userId = 'all'          // 'all' or specific user ID
    } = event.queryStringParameters || {};
    
    // 🚨 ENHANCED: Validate query parameters
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      console.error('❌ [getPublicFeed] Invalid limit parameter:', limit);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Invalid limit parameter',
          received: limit,
          expected: '1-100'
        })
      };
    }
    
    if (isNaN(offsetNum) || offsetNum < 0) {
      console.error('❌ [getPublicFeed] Invalid offset parameter:', offset);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Invalid offset parameter',
          received: offset,
          expected: '0 or positive integer'
        })
      };
    }
    
    console.log('✅ [getPublicFeed] Query parameters validated:', {
      limit: limitNum,
      offset: offsetNum,
      type,
      preset,
      userId: userId === 'all' ? 'all' : userId.substring(0, 8) + '...'
    });

    console.log('🔍 [getPublicFeed] Fetching unified feed with filters:', {
      limit: limitNum,
      offset: offsetNum,
      type,
      preset,
      userId: userId === 'all' ? 'all' : userId.substring(0, 8) + '...'
    });

    const prisma = new PrismaClient();

    try {
      // 🔒 PRIVACY FIRST: Get all users who have shareToFeed enabled
      console.log('🔒 [getPublicFeed] Fetching users with shareToFeed enabled...');
      const usersWithPublicFeed = await prisma.userSettings.findMany({
        where: {
          shareToFeed: true
        },
        select: {
          userId: true
        }
      });
      
      const publicUserIds = usersWithPublicFeed.map((u: any) => u.userId);
      console.log('🔒 [getPublicFeed] Found', publicUserIds.length, 'users with public feed enabled');
      
      if (publicUserIds.length === 0) {
        console.log('🔒 [getPublicFeed] No users have public feed enabled, returning empty feed');
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            media: [],
            total: 0,
            hasMore: false,
            privacy: 'enforced',
            message: 'No public media available'
          })
        };
      }

      // 🚀 UNIFIED: Build dynamic where clauses for advanced filtering
      const mediaAssetWhere = { visibility: 'public' };
      const neoGlitchWhere: any = { 
        status: 'completed',
        userId: { in: publicUserIds } // 🔒 Only show media from users with public feed enabled
      };
      
      // Apply preset filtering
      if (preset !== 'all') {
        if (preset === 'neotokyoglitch') {
          // Only get Neo Tokyo Glitch items
          mediaAssetWhere.id = 'nonexistent'; // Force empty result
        } else {
          // Only get specific preset items
          mediaAssetWhere.presetKey = preset;
          neoGlitchWhere.id = 'nonexistent'; // Force empty result
        }
      }
      
      // Apply user filtering
      if (userId !== 'all') {
        mediaAssetWhere.userId = userId;
        neoGlitchWhere.userId = userId;
      }
      
      // Apply type filtering
      if (type === 'media-asset') {
        neoGlitchWhere.id = 'nonexistent'; // Force empty result
      } else if (type === 'neo-glitch') {
        mediaAssetWhere.id = 'nonexistent'; // Force empty result
      }
      
      // 🚨 CRITICAL FIX: Exclude source images used for Neo Tokyo Glitch generation
      // This prevents showing both the source image AND the generated result
      let sourceUrlsToExclude: string[] = [];
      
      if (type === 'all' || type === 'media-asset') {
        try {
          const glitchSourceUrls = await prisma.neoGlitchMedia.findMany({
            select: { sourceUrl: true },
            where: { 
              status: 'completed',
              sourceUrl: { not: '' }
            }
          });
          
          sourceUrlsToExclude = glitchSourceUrls
            .map(item => item.sourceUrl)
            .filter(Boolean) as string[];
          
          console.log('🔍 [getPublicFeed] Excluding source images used for Neo Tokyo Glitch:', {
            totalSourceUrls: sourceUrlsToExclude.length,
            sourceUrls: sourceUrlsToExclude.slice(0, 3) // Log first 3 for debugging
          });
          
          // Add exclusion filter to mediaAsset query - exclude by URL
          if (sourceUrlsToExclude.length > 0) {
            mediaAssetWhere.OR = [
              { url: { notIn: sourceUrlsToExclude } },
              { finalUrl: { notIn: sourceUrlsToExclude } }
            ];
          }
        } catch (error) {
          console.warn('⚠️ [getPublicFeed] Could not fetch Neo Tokyo Glitch source URLs:', error);
          // Continue without exclusion if there's an error
        }
      }

      // 🚨 UPDATED: Get ALL items from new dedicated tables with filters, then combine and paginate properly
      const [ghibliReactionMedia, emotionMaskMedia, presetsMedia, customPromptMedia, neoGlitchMedia, storyMedia] = await Promise.all([
        prisma.ghibliReactionMedia.findMany({
          where: { 
            status: 'completed',
            userId: { in: publicUserIds } // 🔒 Only show media from users with public feed enabled
          },
          select: {
            id: true,
            user_id: true,
            image_url: true,
            prompt: true,
            preset: true,
            status: true,
            created_at: true,
            users: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }),
        prisma.emotionMaskMedia.findMany({
          where: { 
            status: 'completed',
            userId: { in: publicUserIds } // 🔒 Only show media from users with public feed enabled
          },
          select: {
            id: true,
            user_id: true,
            image_url: true,
            prompt: true,
            preset: true,
            status: true,
            created_at: true,
            users: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }),
        prisma.presetsMedia.findMany({
          where: { 
            status: 'completed',
            userId: { in: publicUserIds } // 🔒 Only show media from users with public feed enabled
          },
          select: {
            id: true,
            user_id: true,
            image_url: true,
            prompt: true,
            preset: true,
            status: true,
            created_at: true,
            users: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }),
        prisma.customPromptMedia.findMany({
          where: { 
            status: 'completed',
            userId: { in: publicUserIds } // 🔒 Only show media from users with public feed enabled
          },
          select: {
            id: true,
            user_id: true,
            image_url: true,
            prompt: true,
            preset: true,
            status: true,
            created_at: true,
            users: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }),
        prisma.neoGlitchMedia.findMany({
          where: {
            ...neoGlitchWhere,
            userId: { in: publicUserIds } // 🔒 Only show media from users with public feed enabled
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.story.findMany({
          where: {
            status: 'completed',
            userId: { in: publicUserIds } // 🔒 Only show media from users with public feed enabled
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            },
            photos: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      ]);

      console.log('✅ [getPublicFeed] Retrieved Ghibli Reaction media:', ghibliReactionMedia.length);
      console.log('✅ [getPublicFeed] Retrieved Emotion Mask media:', emotionMaskMedia.length);
      console.log('✅ [getPublicFeed] Retrieved Presets media:', presetsMedia.length);
      console.log('✅ [getPublicFeed] Retrieved Custom Prompt media:', customPromptMedia.length);
      console.log('✅ [getPublicFeed] Retrieved Neo Tokyo Glitch media:', neoGlitchMedia.length);
      console.log('✅ [getPublicFeed] Retrieved Story media:', storyMedia.length);
      
      // 🚨 DEBUG: Check for potential duplicates
      const allImageUrls = [
        ...ghibliReactionMedia.map((item: any) => ({ url: item.image_url, source: 'ghibliReactionMedia', id: item.id })),
        ...emotionMaskMedia.map((item: any) => ({ url: item.image_url, source: 'emotionMaskMedia', id: item.id })),
        ...presetsMedia.map((item: any) => ({ url: item.image_url, source: 'presetsMedia', id: item.id })),
        ...customPromptMedia.map((item: any) => ({ url: item.image_url, source: 'customPromptMedia', id: item.id })),
        ...neoGlitchMedia.map((item: any) => ({ url: item.imageUrl, source: 'neoGlitchMedia', id: item.id })),
        ...storyMedia.map((item: any) => ({ url: item.photos?.[0]?.imageUrl || '', source: 'storyMedia', id: item.id }))
      ];
      
      const duplicateUrls = allImageUrls.filter((item, index, array) => 
        array.findIndex(other => other.url === item.url) !== index
      );
      
      if (duplicateUrls.length > 0) {
        console.log('🚨 [getPublicFeed] POTENTIAL DUPLICATES DETECTED:', duplicateUrls);
        console.log('🚨 [getPublicFeed] These URLs appear in multiple tables and may cause feed duplicates');
      }

      // Transform all media from new dedicated tables to feed format
      const ghibliReactionItems = ghibliReactionMedia.map(item => ({
        id: item.id,
        userId: item.user_id,
        user: item.users,
        finalUrl: item.image_url,
        prompt: item.prompt,
        presetKey: item.preset,
        type: 'ghibli-reaction',
        createdAt: item.created_at
      }));

      const emotionMaskItems = emotionMaskMedia.map(item => ({
        id: item.id,
        userId: item.userId,
        user: item.user,
        finalUrl: item.imageUrl,
        prompt: item.prompt,
        presetKey: item.preset,
        type: 'emotion-mask',
        createdAt: item.createdAt
      }));

      const presetsItems = presetsMedia.map(item => ({
        id: item.id,
        userId: item.user_id,
        user: item.users,
        finalUrl: item.image_url,
        prompt: item.prompt,
        presetKey: item.preset,
        type: 'presets',
        createdAt: item.created_at
      }));

      const customPromptItems = customPromptMedia.map(item => ({
        id: item.id,
        userId: item.user_id,
        user: item.users,
        finalUrl: item.image_url,
        prompt: item.prompt,
        presetKey: item.preset,
        type: 'custom-prompt',
        createdAt: item.created_at
      }));

      // Transform Neo Tokyo Glitch media to feed format
      const glitchFeedItems = neoGlitchMedia.map((item: any) => {
        console.log('🔍 [getPublicFeed] NeoGlitchMedia item:', {
          id: item.id,
          imageUrl: item.imageUrl,
          mappedFinalUrl: item.imageUrl,
          type: 'neo-glitch'
        });
        
        return {
          id: item.id,
          userId: item.userId,
          user: item.user,
          finalUrl: item.imageUrl, // Neo Tokyo Glitch uses imageUrl
          mediaType: 'image',
          prompt: item.prompt,
          presetKey: item.preset,
          status: item.status,
          createdAt: item.createdAt,
          type: 'neo-glitch' // Identify as Neo Tokyo Glitch
        };
      });

      // Transform Story Time media to feed format
      const storyFeedItems = storyMedia.map((item: any) => {
        console.log('🔍 [getPublicFeed] Story item:', {
          id: item.id,
          preset: item.preset,
          photoCount: item.photos?.length || 0,
          type: 'story-time'
        });
        
        return {
          id: item.id,
          userId: item.userId,
          user: item.user,
          finalUrl: item.photos?.[0]?.imageUrl || '', // Use first photo as main image
          mediaType: 'image',
          prompt: item.storyText || item.description || 'AI-generated story',
          presetKey: item.preset,
          status: item.status,
          createdAt: item.createdAt,
          type: 'story-time', // Identify as Story Time
          metadata: {
            presetKey: item.preset,
            presetType: 'story-time',
            storyText: item.storyText,
            photoCount: item.photos?.length || 0
          }
        };
      });

      // ✅ FIXED: Combine ALL items first, then sort, then apply pagination
      const allFeedItems = [
        ...ghibliReactionItems, 
        ...emotionMaskItems, 
        ...presetsItems, 
        ...customPromptItems, 
        ...glitchFeedItems,
        ...storyFeedItems
      ].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // 🚨 CRITICAL FIX: Deduplicate by image URL to prevent Neo Tokyo Glitch duplicates
      const uniqueFeedItems = allFeedItems.filter((item, index, array) => {
        // Skip items without valid URLs
        if (!item.finalUrl) {
          console.log('⚠️ [getPublicFeed] Skipping item without finalUrl:', item);
          return false;
        }
        
        // 🚨 NEW: Validate Cloudinary URLs to prevent 404 errors
        if (item.finalUrl.includes('cloudinary.com')) {
          if (!item.finalUrl.includes('/upload/')) {
            console.log('🚨 [getPublicFeed] Skipping item with incomplete Cloudinary URL:', {
              id: item.id,
              type: item.type,
              url: item.finalUrl
            });
            return false;
          }
          
          // Check if URL has a valid file extension
          const hasValidExtension = /\.(jpg|jpeg|png|webp|mp4|mov|avi)$/i.test(item.finalUrl);
          if (!hasValidExtension) {
            console.log('🚨 [getPublicFeed] Skipping item with invalid Cloudinary URL extension:', {
              id: item.id,
              type: item.type,
              url: item.finalUrl
            });
            return false;
          }
        }
        
        // Find the first occurrence of this image URL
        const firstIndex = array.findIndex(otherItem => 
          otherItem.finalUrl && otherItem.finalUrl === item.finalUrl
        );
        
        // Keep only the first occurrence (most recent)
        const isFirst = index === firstIndex;
        
        if (!isFirst) {
          console.log('🚨 [getPublicFeed] Removing duplicate:', {
            duplicateUrl: item.finalUrl,
            duplicateIndex: index,
            firstIndex: firstIndex,
            duplicateType: item.type,
            firstType: array[firstIndex]?.type
          });
        }
        
        return isFirst;
      });

      console.log('🔍 [getPublicFeed] Deduplication results:', {
        before: allFeedItems.length,
        after: uniqueFeedItems.length,
        duplicatesRemoved: allFeedItems.length - uniqueFeedItems.length
      });

      // ✅ FIXED: Apply pagination to the deduplicated, sorted results
      const feedItems = uniqueFeedItems.slice(offsetNum, offsetNum + limitNum);

      // 🚨 DEBUG: Log pagination details to verify it's working
      console.log('🔍 [getPublicFeed] Pagination details:', {
        totalAvailable: uniqueFeedItems.length,
        offset: offsetNum,
        limit: limitNum,
        startIndex: offsetNum,
        endIndex: offsetNum + limitNum,
        itemsReturned: feedItems.length,
        hasMore: (offsetNum + feedItems.length) < uniqueFeedItems.length
      });

      await prisma.$disconnect();

      // 🚀 ENHANCED: Provide detailed response metadata for debugging and optimization
      const responseMetadata = {
        success: true,
        items: feedItems,
        total: feedItems.length,
        hasMore: (offsetNum + feedItems.length) < uniqueFeedItems.length,
        // 🆕 NEW: Total count for frontend display
        totalCount: uniqueFeedItems.length,
        // 🆕 NEW: Detailed breakdown for debugging
        breakdown: {
          totalMediaAssets: ghibliReactionMedia.length + emotionMaskMedia.length + presetsMedia.length + customPromptMedia.length + neoGlitchMedia.length,
          totalNeoGlitch: neoGlitchMedia.length,
          combinedBeforePagination: allFeedItems.length,
          paginatedResult: feedItems.length,
          filters: {
            type,
            preset,
            userId: userId === 'all' ? 'all' : userId.substring(0, 8) + '...'
          }
        },
        // 🆕 NEW: Pagination info
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          totalAvailable: uniqueFeedItems.length
        }
      };

      console.log('✅ [getPublicFeed] Unified feed response:', {
        totalItems: feedItems.length,
        hasMore: responseMetadata.hasMore,
        breakdown: responseMetadata.breakdown
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(responseMetadata)
      };

    } catch (dbError) {
      console.error('💥 [getPublicFeed] Database error:', dbError);
      await prisma.$disconnect();
      
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'FEED_FETCH_FAILED',
          message: dbError instanceof Error ? dbError.message : String(dbError),
          status: 'failed'
        })
      };
    }

      } catch (error) {
    console.error('💥 [getPublicFeed] Feed error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'FEED_FETCH_FAILED',
        message: error.message,
        status: 'failed'
      })
    };
  }
};
