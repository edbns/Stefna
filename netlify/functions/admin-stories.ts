import type { Handler } from "@netlify/functions";
import { q, qOne } from './_db';
import { json } from './_lib/http';
import { withAdminSecurity } from './_lib/adminSecurity';
import { handleCORS, getAdminCORSHeaders } from './_lib/cors';

// ============================================================================
// ADMIN STORY MANAGEMENT
// ============================================================================
// This function provides admin access to story management
// - Create/Read/Update/Delete fantasy stories
// - Manage story images and SEO content
// - Publish/unpublish stories
// ============================================================================

interface Story {
  id: string;
  title: string;
  slug: string;
  teaser_text: string;
  full_story_content: string;
  hero_image_url: string;
  hero_image_social?: string;
  hero_image_thumbnail?: string;
  story_images: any[];
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  estimated_read_time?: number;
  story_category?: string;
  word_count?: number;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const adminStoriesHandler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event, true); // true for admin
  if (corsResponse) return corsResponse;

  try {
    const method = event.httpMethod;

    if (method === 'GET') {
      // List stories with pagination
      const page = parseInt(event.queryStringParameters?.page || '1');
      const limit = parseInt(event.queryStringParameters?.limit || '20');
      const status = event.queryStringParameters?.status; // filter by status
      const offset = (page - 1) * limit;

      // Build dynamic query based on filters
      let stories;
      if (status) {
        stories = await q(`
          SELECT 
            id, title, slug, teaser_text, hero_image_url, hero_image_thumbnail,
            story_category, estimated_read_time, word_count, status, featured,
            view_count, created_at, updated_at, published_at
          FROM stories 
          WHERE status = $1
          ORDER BY created_at DESC 
          LIMIT $2 OFFSET $3
        `, [status, limit, offset]);
      } else {
        stories = await q(`
          SELECT 
            id, title, slug, teaser_text, hero_image_url, hero_image_thumbnail,
            story_category, estimated_read_time, word_count, status, featured,
            view_count, created_at, updated_at, published_at
          FROM stories 
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
      }

      let totalCount;
      if (status) {
        totalCount = await q(`
          SELECT COUNT(*) as count FROM stories WHERE status = $1
        `, [status]);
      } else {
        totalCount = await q(`
          SELECT COUNT(*) as count FROM stories
        `);
      }

      return json({
        success: true,
        stories,
        pagination: {
          page,
          limit,
          total: parseInt(totalCount[0].count),
          pages: Math.ceil(parseInt(totalCount[0].count) / limit)
        }
      }, { headers: getAdminCORSHeaders() });

    } else if (method === 'POST') {
      // Create new story
      const storyData = JSON.parse(event.body || '{}');

      if (!storyData.title || !storyData.teaser_text || !storyData.full_story_content) {
        return json({
          success: false,
          error: 'Missing required fields: title, teaser_text, full_story_content'
        }, { headers: getAdminCORSHeaders() });
      }

      // Generate slug from title
      const slug = storyData.slug || storyData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists
      const existingStory = await qOne('SELECT id FROM stories WHERE slug = $1', [slug]);
      if (existingStory) {
        return json({
          success: false,
          error: 'Slug already exists. Please use a different title or provide a custom slug.'
        }, { headers: getAdminCORSHeaders() });
      }

      // Calculate estimated read time (avg 200 words per minute)
      const wordCount = storyData.full_story_content.split(/\s+/).length;
      const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

      const newStory = await qOne(`
        INSERT INTO stories (
          title, slug, teaser_text, full_story_content, hero_image_url,
          hero_image_social, hero_image_thumbnail, story_images,
          meta_title, meta_description, keywords, estimated_read_time,
          story_category, word_count, status, featured
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `, [
        storyData.title,
        slug,
        storyData.teaser_text,
        storyData.full_story_content,
        storyData.hero_image_url || '',
        storyData.hero_image_social || null,
        storyData.hero_image_thumbnail || null,
        JSON.stringify(storyData.story_images || []),
        storyData.meta_title || null,
        storyData.meta_description || null,
        storyData.keywords || null,
        estimatedReadTime,
        storyData.story_category || null,
        wordCount,
        storyData.status || 'draft',
        storyData.featured || false
      ]);

      return json({
        success: true,
        story: newStory
      }, { headers: getAdminCORSHeaders() });

    } else if (method === 'PUT') {
      // Update existing story
      const storyData = JSON.parse(event.body || '{}');
      const storyId = event.queryStringParameters?.id;

      if (!storyId) {
        return json({
          success: false,
          error: 'Story ID is required for updates'
        }, { headers: getAdminCORSHeaders() });
      }

      // Check if story exists
      const existingStory = await qOne('SELECT id FROM stories WHERE id = $1', [storyId]);
      if (!existingStory) {
        return json({
          success: false,
          error: 'Story not found'
        }, { headers: getAdminCORSHeaders() });
      }

      // Calculate word count and read time if content changed
      let wordCount = existingStory.word_count;
      let estimatedReadTime = existingStory.estimated_read_time;
      
      if (storyData.full_story_content) {
        wordCount = storyData.full_story_content.split(/\s+/).length;
        estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
      }

      const updatedStory = await qOne(`
        UPDATE stories SET
          title = COALESCE($2, title),
          slug = COALESCE($3, slug),
          teaser_text = COALESCE($4, teaser_text),
          full_story_content = COALESCE($5, full_story_content),
          hero_image_url = COALESCE($6, hero_image_url),
          hero_image_social = COALESCE($7, hero_image_social),
          hero_image_thumbnail = COALESCE($8, hero_image_thumbnail),
          story_images = COALESCE($9, story_images),
          meta_title = COALESCE($10, meta_title),
          meta_description = COALESCE($11, meta_description),
          keywords = COALESCE($12, keywords),
          estimated_read_time = $13,
          story_category = COALESCE($14, story_category),
          word_count = $15,
          status = COALESCE($16, status),
          featured = COALESCE($17, featured),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [
        storyId,
        storyData.title,
        storyData.slug,
        storyData.teaser_text,
        storyData.full_story_content,
        storyData.hero_image_url,
        storyData.hero_image_social,
        storyData.hero_image_thumbnail,
        storyData.story_images ? JSON.stringify(storyData.story_images) : null,
        storyData.meta_title,
        storyData.meta_description,
        storyData.keywords,
        estimatedReadTime,
        storyData.story_category,
        wordCount,
        storyData.status,
        storyData.featured
      ]);

      return json({
        success: true,
        story: updatedStory
      }, { headers: getAdminCORSHeaders() });

    } else if (method === 'DELETE') {
      // Delete story
      const storyId = event.queryStringParameters?.id;

      if (!storyId) {
        return json({
          success: false,
          error: 'Story ID is required'
        }, { headers: getAdminCORSHeaders() });
      }

      const deletedStory = await qOne('DELETE FROM stories WHERE id = $1 RETURNING id, title', [storyId]);

      if (!deletedStory) {
        return json({
          success: false,
          error: 'Story not found'
        }, { headers: getAdminCORSHeaders() });
      }

      return json({
        success: true,
        message: `Story "${deletedStory.title}" deleted successfully`
      }, { headers: getAdminCORSHeaders() });

    }

    return json({
      success: false,
      error: 'Method not allowed'
    }, { headers: getAdminCORSHeaders() });

  } catch (error: any) {
    console.error('Admin stories error:', error);
    return json({
      success: false,
      error: error.message || 'Server error'
    }, { headers: getAdminCORSHeaders() });
  }
};

// Export with admin security middleware
export const handler = withAdminSecurity(adminStoriesHandler);
