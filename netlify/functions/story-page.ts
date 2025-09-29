import { Handler } from '@netlify/functions'
import { qOne } from './_db'

export const handler: Handler = async (event, context) => {
  try {
    console.log('=== STORY PAGE FUNCTION CALLED ===')
    console.log('Event:', JSON.stringify(event, null, 2))
    console.log('Context:', JSON.stringify(context, null, 2))
    
    // Netlify passes the original path in different ways
    let slug = ''
    
    // Method 1: Check if path is directly available
    if (event.path) {
      slug = event.path.replace('/story-page/', '').replace('/story/', '')
      console.log('Method 1 - Using event.path:', slug)
    }
    
    // Method 1.5: Check clientContext for original path
    if (!slug && context.clientContext?.custom?.netlify) {
      try {
        const netlifyData = JSON.parse(atob(context.clientContext.custom.netlify))
        if (netlifyData.site_url) {
          const originalPath = context.clientContext.custom.purge_api_token ? 
            JSON.parse(atob(context.clientContext.custom.purge_api_token)).request_path : null
          if (originalPath) {
            slug = originalPath.replace('/story/', '')
            console.log('Method 1.5 - Using clientContext path:', slug)
          }
        }
      } catch (e) {
        console.log('Error parsing clientContext:', e)
      }
    }
    
    // Method 2: Check rawUrl
    if (!slug && event.rawUrl) {
      const url = new URL(event.rawUrl)
      slug = url.pathname.replace('/story/', '')
      console.log('Method 2 - Using rawUrl:', slug)
    }
    
    // Method 3: Check headers
    if (!slug && event.headers) {
      const forwardedUri = event.headers['x-forwarded-uri'] || event.headers['X-Forwarded-Uri']
      if (forwardedUri) {
        slug = forwardedUri.replace('/story/', '')
        console.log('Method 3 - Using x-forwarded-uri:', slug)
      }
    }
    
    // Method 4: Check query parameters
    if (!slug && event.queryStringParameters) {
      const pathParam = event.queryStringParameters.path
      if (pathParam) {
        slug = pathParam.replace('/story/', '')
        console.log('Method 4 - Using query path:', slug)
      }
    }
    
    console.log('Final slug extracted:', slug)
    
    if (!slug) {
      console.log('ERROR: No slug found in any method')
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html' },
        body: '<html><body><h1>404 - Story not found</h1><p>No slug could be extracted from the request.</p></body></html>'
      }
    }

    // Fetch story data from database
    const story = await qOne(`
      SELECT 
        id,
        title,
        slug,
        teaser_text,
        hero_image_url,
        story_category,
        status,
        created_at,
        updated_at
      FROM stories 
      WHERE slug = $1 AND status = 'published'
    `, [slug])

    if (!story) {
      console.log('Story not found in database for slug:', slug)
      return {
        statusCode: 404,
        body: 'Story not found'
      }
    }
    
    console.log('Found story:', story.title)

    // Generate HTML with proper meta tags
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${story.title} | Stefna Stories</title>
  <meta name="description" content="${story.teaser_text}">
  
  <!-- Open Graph Tags -->
  <meta property="og:title" content="${story.title}">
  <meta property="og:description" content="${story.teaser_text}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://stefna.xyz/story/${story.slug}">
  <meta property="og:image" content="${story.hero_image_url}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Stefna Stories">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${story.title}">
  <meta name="twitter:description" content="${story.teaser_text}">
  <meta name="twitter:image" content="${story.hero_image_url}">
  
  <!-- Additional Meta Tags -->
  <meta name="author" content="Stefna">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://stefna.xyz/story/${story.slug}">
  
  <!-- Favicon and other head elements -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
  
  <!-- Load the main app -->
  <script>
    // Store story data for the React app
    window.__STORY_DATA__ = ${JSON.stringify(story)};
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: html
    }
  } catch (error) {
    console.error('Error generating story page:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `<html><body><h1>Error</h1><p>${error.message}</p></body></html>`
    }
  }
}
