import { Handler } from '@netlify/functions'
import { qOne } from './_db'

export const handler: Handler = async (event, context) => {
  try {
    console.log('=== STORY PAGE FUNCTION CALLED ===')
    
    // Get the original path from multiple sources
    let originalPath = '/story'
    
    // Method 1: Try clientContext
    if (context.clientContext?.custom?.purge_api_token) {
      try {
        const token = context.clientContext.custom.purge_api_token
        if (token && /^[A-Za-z0-9+/=]+$/.test(token)) {
          const decoded = atob(token)
          const tokenData = JSON.parse(decoded)
          originalPath = tokenData.request_path || '/story'
          console.log('Original path from clientContext:', originalPath)
        } else {
          console.log('purge_api_token is not a valid base64 string, skipping')
        }
      } catch (e) {
        console.log('Error parsing purge_api_token:', e.message)
      }
    }
    
    // Method 2: Try event.path
    if (originalPath === '/story' && event.path) {
      // Remove /story-page/ prefix if present
      originalPath = event.path.replace('/story-page/', '/story/')
      console.log('Using event.path:', originalPath)
    }
    
    // Method 3: Try rawUrl
    if (originalPath === '/story' && event.rawUrl) {
      try {
        const url = new URL(event.rawUrl)
        originalPath = url.pathname
        console.log('Using rawUrl pathname:', originalPath)
      } catch (e) {
        console.log('Error parsing rawUrl:', e.message)
      }
    }
    
    // Check if this is the story index page (/story) or a specific story (/story/slug)
    const slugMatch = originalPath.match(/^\/story\/([^\/]+)$/)
    
    if (!slugMatch) {
      // This is the story index page (/story) - let React handle it
      console.log('Story index page requested, redirecting to React app')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stefna Stories</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index-1411a05b.js"></script>
</body>
</html>`
      }
    }
    
    const slug = slugMatch[1].split('?')[0] // Strip query params
    console.log('Story slug extracted:', slug)

    // Fetch story data from database
    const story = await qOne(`
      SELECT 
        id,
        title,
        slug,
        teaser_text,
        full_story_content,
        hero_image_url,
        hero_image_social,
        hero_image_thumbnail,
        story_images,
        meta_title,
        meta_description,
        keywords,
        story_category,
        status,
        featured,
        word_count,
        estimated_read_time,
        view_count,
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

    // Generate HTML with proper meta tags using database fields
    const pageTitle = story.meta_title || story.title
    const pageDescription = story.meta_description || story.teaser_text
    const ogImage = story.hero_image_social || story.hero_image_url || 'https://stefna.xyz/og-image.jpg'
    const keywords = story.keywords ? `<meta name="keywords" content="${story.keywords}">` : ''
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}">
  ${keywords}
  
  <!-- Open Graph Tags -->
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${pageDescription}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://stefna.xyz/story/${story.slug}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Stefna Stories">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${pageDescription}">
  <meta name="twitter:image" content="${ogImage}">
  
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
  <script type="module" src="/assets/index-1411a05b.js"></script>
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
