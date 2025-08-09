exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST'
      },
      body: ''
    };
  }

  try {
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    const envStatus = {
      SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ Missing',
      SUPABASE_SERVICE_ROLE_KEY: supabaseKey ? '✅ Set' : '❌ Missing',
      RESEND_API_KEY: resendKey ? '✅ Set' : '❌ Missing'
    };

    // Test Supabase connection
    let supabaseStatus = '❌ Not tested';
    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test a simple query
        const { data, error } = await supabase
          .from('user_otps')
          .select('count')
          .limit(1);
        
        if (error) {
          supabaseStatus = `❌ Error: ${error.message}`;
        } else {
          supabaseStatus = '✅ Connected successfully';
        }
      } catch (err) {
        supabaseStatus = `❌ Connection failed: ${err.message}`;
      }
    }

    // Test Resend connection
    let resendStatus = '❌ Not tested';
    if (resendKey) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(resendKey);
        resendStatus = '✅ Resend client created successfully';
      } catch (err) {
        resendStatus = `❌ Resend error: ${err.message}`;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'OTP Function Test Results',
        environment: envStatus,
        supabase: supabaseStatus,
        resend: resendStatus,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Test function failed',
        message: error.message,
        stack: error.stack
      })
    };
  }
}; 