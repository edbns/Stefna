import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET!;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check environment variables
    const envCheck = {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      jwtSecret: !!jwtSecret,
      supabaseUrlValue: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'missing',
    };

    // Check JWT token if provided
    const authHeader = event.headers.authorization;
    let jwtCheck = { hasAuth: false, decoded: null, error: null };
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, jwtSecret);
        jwtCheck = { hasAuth: true, decoded, error: null };
      } catch (err) {
        jwtCheck = { hasAuth: true, decoded: null, error: err.message };
      }
    }

    // Test Supabase connection
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let dbCheck = { connected: false, error: null, profilesTable: false };
    
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        dbCheck = { connected: false, error: error.message, profilesTable: false };
      } else {
        dbCheck = { connected: true, error: null, profilesTable: true };
      }
    } catch (err) {
      dbCheck = { connected: false, error: err.message, profilesTable: false };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'Profile connection test',
        environment: envCheck,
        jwt: jwtCheck,
        database: dbCheck,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Test failed',
        details: error.message
      })
    };
  }
};
