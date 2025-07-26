// OTP verification function
const crypto = require('crypto');

// In-memory storage for OTP codes (use database in production)
const otpStore = new Map();

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { action, email, otp } = JSON.parse(event.body || '{}');
    
    if (!action || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Action and email are required' })
      };
    }

    switch (action) {
      case 'generate':
        return await generateOTP(email, headers);
      case 'verify':
        return await verifyOTP(email, otp, headers);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('OTP Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'OTP operation failed',
        details: error.message 
      })
    };
  }
};

async function generateOTP(email, headers) {
  try {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (5 minutes)
    const expiresAt = Date.now() + (5 * 60 * 1000);
    otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0
    });

    // In production, send OTP via email/SMS
    // For demo purposes, we'll just return it
    console.log(`OTP for ${email}: ${otp}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'OTP generated successfully',
        expiresIn: '5 minutes',
        // Remove this in production - only for demo
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      })
    };

  } catch (error) {
    console.error('Generate OTP Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate OTP' })
    };
  }
}

async function verifyOTP(email, otp, headers) {
  try {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No OTP found for this email' })
      };
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'OTP has expired' })
      };
    }

    // Check attempt limit
    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Too many failed attempts' })
      };
    }

    // Verify OTP
    if (storedData.otp === otp) {
      // OTP is correct
      otpStore.delete(email);
      
      // Generate session token
      const sessionToken = generateSessionToken(email);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'OTP verified successfully',
          sessionToken,
          user: {
            email,
            verified: true
          }
        })
      };
    } else {
      // Increment attempt counter
      storedData.attempts += 1;
      otpStore.set(email, storedData);
      
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid OTP',
          attemptsRemaining: 3 - storedData.attempts
        })
      };
    }

  } catch (error) {
    console.error('Verify OTP Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to verify OTP' })
    };
  }
}

function generateSessionToken(email) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const data = `${email}:${timestamp}:${randomBytes}`;
  
  return crypto.createHash('sha256').update(data).digest('hex');
}