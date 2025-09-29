import { Handler } from '@netlify/functions'
import { q, qOne } from './_db'

const ALLOWED_USER_ID = '49b15f0e-6a2d-445d-9d32-d0a9bd859bfb'

export const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const { queryStringParameters, httpMethod, body } = event

    switch (httpMethod) {
      case 'GET':
        return await handleGet(headers, queryStringParameters)
      
      case 'POST':
        return await handlePost(JSON.parse(body || '{}'), headers)
      
      case 'PUT':
        return await handlePut(JSON.parse(body || '{}'), headers, queryStringParameters?.id)
      
      case 'DELETE':
        return await handleDelete(headers, queryStringParameters?.id)
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    console.error('Story API Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function handleGet(headers: Record<string, string>, queryStringParameters?: any) {
  try {
    const { slug } = queryStringParameters || {}
    
    if (slug) {
      // Get single story by slug
      const story = await qOne(`
        SELECT 
          id,
          title,
          slug,
          teaser_text,
          full_story_content,
          hero_image_url,
          story_images,
          story_category,
          status,
          featured,
          created_at,
          updated_at
        FROM stories 
        WHERE slug = $1
      `, [slug])

      if (!story) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Story not found' })
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(story)
      }
    } else {
      // Get all stories
      const stories = await q(`
        SELECT 
          id,
          title,
          slug,
          teaser_text,
          hero_image_url,
          story_images,
          story_category,
          status,
          featured,
          created_at,
          updated_at
        FROM stories 
        ORDER BY created_at DESC
      `)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stories)
      }
    }
  } catch (error) {
    console.error('Error fetching stories:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch stories' })
    }
  }
}

async function handlePost(data: any, headers: Record<string, string>) {
  try {
    const {
      title,
      teaser_text,
      hero_image_url,
      full_story_content,
      story_images,
      story_category = 'fantasy',
      status = 'draft',
      featured = false
    } = data

    if (!title || !teaser_text || !full_story_content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    // Calculate word count and estimated read time
    const words = full_story_content.split(/\s+/).length
    const estimatedReadTime = Math.ceil(words / 200)

    const story = await qOne(`
      INSERT INTO stories (
        title, slug, teaser_text, full_story_content, 
        hero_image_url, story_images, story_category, status, featured,
        word_count, estimated_read_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      title,
      slug,
      teaser_text,
      full_story_content,
      hero_image_url,
      JSON.stringify(story_images || []),
      story_category,
      status,
      featured,
      words,
      estimatedReadTime
    ])

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(story)
    }
  } catch (error) {
    console.error('Error creating story:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create story' })
    }
  }
}

async function handlePut(data: any, headers: Record<string, string>, id?: string) {
  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Story ID required' })
    }
  }

  try {
    const {
      title,
      teaser_text,
      hero_image_url,
      full_story_content,
      story_images,
      story_category,
      status,
      featured
    } = data

    const updateData: any = { ...data, updated_at: new Date() }

    if (title) {
      updateData.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    if (full_story_content) {
      const words = full_story_content.split(/\s+/).length
      updateData.word_count = words
      updateData.estimated_read_time = Math.ceil(words / 200)
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Build dynamic UPDATE query
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    
    const story = await qOne(`
      UPDATE stories 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `, [id, ...Object.values(updateData)])

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(story)
    }
  } catch (error) {
    console.error('Error updating story:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update story' })
    }
  }
}

async function handleDelete(headers: Record<string, string>, id?: string) {
  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Story ID required' })
    }
  }

  try {
    await q(`
      DELETE FROM stories 
      WHERE id = $1
    `, [id])

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Story deleted successfully' })
    }
  } catch (error) {
    console.error('Error deleting story:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete story' })
    }
  }
}
