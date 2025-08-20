import { Handler } from '@netlify/functions'
import { withAuth } from './_withAuth'
import { neon } from '@neondatabase/serverless'

const handler: Handler = withAuth(async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { id } = JSON.parse(event.body || '{}')
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Media ID is required' })
      }
    }

    const user = context.user
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }

    // Delete the media from the database
    const result = await neon`
      DELETE FROM assets 
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Media not found or access denied' })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Media deleted successfully',
        deletedId: id
      })
    }

  } catch (error) {
    console.error('Delete media error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
})

export { handler }
