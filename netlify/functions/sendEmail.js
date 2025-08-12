exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📧 Netlify function called with event:', JSON.stringify(event.body))
    const { to, subject, html, from = 'Stefna <hello@stefna.xyz>' } = JSON.parse(event.body);

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const apiKey = process.env.RESEND_API_KEY;
    console.log('📧 RESEND_API_KEY present:', !!apiKey)
    if (!apiKey) {
      console.log('📧 ERROR: RESEND_API_KEY not configured')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    console.log('📧 Calling Resend API with:', { from, to, subject })
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html })
    });

    console.log('📧 Resend API response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.log('📧 Resend API error:', errorText)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to send email', details: errorText })
      };
    }

    const result = await response.json()
    console.log('📧 Email sent successfully:', result)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Email sent', result })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 