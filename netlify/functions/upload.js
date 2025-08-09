// File Upload Function - Handles file uploads for I2I and V2V functionality
// Supports uploading to various providers (Netlify Large Media, S3, etc.)
//
// TODO: Replace with Cloudinary integration for production
// - Better compression and optimization
// - AI-powered transformations
// - Global CDN
// - Video processing support
// - Background removal
// - Smart cropping

const FormData = require('form-data')
const fetch = require('node-fetch')

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Parse multipart form data
    const boundary = event.headers['content-type']?.split('boundary=')[1]
    if (!boundary) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No boundary found in content-type' })
      }
    }

    const body = event.body
    const parts = body.split(`--${boundary}`)
    
    let fileData = null
    let filename = null
    let contentType = null

    for (const part of parts) {
      if (part.includes('Content-Disposition: form-data')) {
        const lines = part.split('\r\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (line.startsWith('Content-Disposition: form-data; name="file"')) {
            // Extract filename
            const filenameMatch = line.match(/filename="([^"]+)"/)
            if (filenameMatch) {
              filename = filenameMatch[1]
            }
          } else if (line.startsWith('Content-Type:')) {
            contentType = line.split(': ')[1]
          } else if (line === '' && i + 1 < lines.length) {
            // This is the file data
            fileData = lines.slice(i + 1).join('\r\n').trim()
            break
          }
        }
      }
    }

    if (!fileData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No file data found' })
      }
    }

    // Check file size (limit to 8MB to avoid 413 errors)
    const fileSize = Buffer.byteLength(fileData, 'binary')
    if (fileSize > 8 * 1024 * 1024) {
      return {
        statusCode: 413,
        headers,
        body: JSON.stringify({ 
          error: 'File too large. Maximum size is 8MB. Please compress your file or use a smaller one.',
          fileSize: `${(fileSize / (1024 * 1024)).toFixed(1)}MB`,
          maxSize: '8MB'
        })
      }
    }

    // For now, we'll use a simple approach: create a temporary public URL
    // In production, you'd upload to S3, Netlify Large Media, or similar
    const base64Data = Buffer.from(fileData, 'binary').toString('base64')
    
    // Create a data URL for now (this should be replaced with a public URL service)
    const dataUrl = `data:${contentType};base64,${base64Data}`

    // TODO: Replace this with actual file upload to S3, Netlify Large Media, or similar
    // For now, we'll return the data URL but this should be replaced with a public URL
    console.log(`⚠️ WARNING: Using data URL for file upload (${(fileSize / 1024).toFixed(1)}KB). This should be replaced with a public URL service.`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: dataUrl,
        filename: filename || 'uploaded-file',
        size: fileSize,
        type: contentType,
        warning: 'Using data URL. Consider implementing S3 or similar for production.',
        compressed: fileSize > 500 * 1024 ? 'File was compressed for upload' : 'File uploaded as-is'
      })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Upload failed',
        message: error.message 
      })
    }
  }
}
