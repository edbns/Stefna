// netlify/functions/getPublicFeed.ts
// 🚀 UNIFIED FEED FUNCTION - The single source of truth for all public media
// Handles: Ghibli, Emotion Mask, Presets, Custom, AND Neo Tokyo Glitch
// Provides consistent, deduplicated feed data for the main application

import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

export const handler: Handler = async (event) => {
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
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
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
    
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    console.log('🔍 [getPublicFeed] Fetching unified feed with filters:', {
      limit: limitNum,
      offset: offsetNum,
      type,
      preset,
      userId: userId === 'all' ? 'all' : userId.substring(0, 8) + '...'
    });

    const prisma = new PrismaClient();

    try {
      // 🚀 UNIFIED: Build dynamic where clauses for advanced filtering
      const mediaAssetWhere: any = { visibility: 'public' };
      const neoGlitchWhere: any = { status: 'completed' };
      
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
      
      // 🚨 CRITICAL FIX: Get ALL items from both tables with filters, then combine and paginate properly
      const [publicMedia, neoGlitchMedia] = await Promise.all([
        prisma.mediaAsset.findMany({
          where: mediaAssetWhere,
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
        prisma.neoGlitchMedia.findMany({
          where: neoGlitchWhere,
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
        })
      ]);

      console.log('✅ [getPublicFeed] Retrieved public media:', publicMedia.length);
      console.log('✅ [getPublicFeed] Retrieved Neo Tokyo Glitch media:', neoGlitchMedia.length);
      
      // 🚨 DEBUG: Check for potential duplicates
      const allImageUrls = [
        ...publicMedia.map(item => ({ url: item.url || item.finalUrl, source: 'mediaAsset', id: item.id })),
        ...neoGlitchMedia.map(item => ({ url: item.imageUrl, source: 'neoGlitchMedia', id: item.id }))
      ];
      
      const duplicateUrls = allImageUrls.filter((item, index, array) => 
        array.findIndex(other => other.url === item.url) !== index
      );
      
      if (duplicateUrls.length > 0) {
        console.log('🚨 [getPublicFeed] POTENTIAL DUPLICATES DETECTED:', duplicateUrls);
        console.log('🚨 [getPublicFeed] These URLs appear in multiple tables and may cause feed duplicates');
      }

      // Transform main media assets to feed format
      const mainFeedItems = publicMedia.map(item => {
        const finalUrl = item.url || item.finalUrl;
        console.log('🔍 [getPublicFeed] MediaAsset item:', {
          id: item.id,
          url: item.url,
          finalUrl: item.finalUrl,
          mappedFinalUrl: finalUrl,
          type: 'media-asset'
        });
        
        return {
          id: item.id,
          userId: item.userId,
          user: item.user, // Now using 'user' instead of 'owner'
          finalUrl: finalUrl,
          mediaType: item.resourceType,
          prompt: item.prompt,
          presetKey: item.presetKey, // Using the actual presetKey field
          status: item.status || 'ready',
          createdAt: item.createdAt,
          type: 'media-asset'
        };
      });

      // Transform Neo Tokyo Glitch media to feed format
      const glitchFeedItems = neoGlitchMedia.map(item => {
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

      // ✅ FIXED: Combine ALL items first, then sort, then apply pagination
      const allFeedItems = [...mainFeedItems, ...glitchFeedItems].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // 🚨 CRITICAL FIX: Deduplicate by image URL to prevent Neo Tokyo Glitch duplicates
      const uniqueFeedItems = allFeedItems.filter((item, index, array) => {
        // Skip items without valid URLs
        if (!item.finalUrl) {
          console.log('⚠️ [getPublicFeed] Skipping item without finalUrl:', item);
          return false;
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

      await prisma.$disconnect();

      // 🚀 ENHANCED: Provide detailed response metadata for debugging and optimization
      const responseMetadata = {
        success: true,
        items: feedItems,
        total: feedItems.length,
        hasMore: feedItems.length === limitNum,
        // 🆕 NEW: Detailed breakdown for debugging
        breakdown: {
          totalMediaAssets: publicMedia.length,
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
          totalAvailable: allFeedItems.length
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

  } catch (error: any) {
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
