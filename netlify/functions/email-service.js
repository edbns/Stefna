const fetch = require('node-fetch');

// Cache for API responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

async function sendEmail(to, subject, content) {
  try {
    // This is a placeholder for email service integration
    // In production, you would integrate with services like SendGrid, Mailgun, etc.
    console.log('Email service called:', { to, subject, content });
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      messageId: `email_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send email');
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };
  }

  try {
    const { to, subject, content, type = 'notification' } = JSON.parse(event.body);

    if (!to || !subject || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: to, subject, content'
        })
      };
    }

    const result = await sendEmail(to, subject, content);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to send email',
        details: error.message
      })
    };
  }
}; 