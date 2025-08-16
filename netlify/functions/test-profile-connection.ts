import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { sanitizeDatabaseUrl } from './_auth';

const jwtSecret = process.env.JWT_SECRET!;

// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
  throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);

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
      neonDatabaseUrl: !!cleanDbUrl,
      jwtSecret: !!jwtSecret,
      neonUrlValue: cleanDbUrl ? cleanDbUrl.substring(0, 20) + '...' : 'missing',
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

    // Test Neon connection
    let dbCheck = { connected: false, error: null, usersTable: false, mediaAssetsTable: false };
    
    try {
      // Test basic connection with users table
      const usersResult = await sql`
        SELECT COUNT(*) as count
        FROM users 
        LIMIT 1
      `;
      
      if (usersResult && usersResult.length > 0) {
        dbCheck.usersTable = true;
      }
      
      // Test media_assets table
      const mediaResult = await sql`
        SELECT COUNT(*) as count
        FROM media_assets 
        LIMIT 1
      `;
      
      if (mediaResult && mediaResult.length > 0) {
        dbCheck.mediaAssetsTable = true;
      }
      
      dbCheck.connected = true;
      dbCheck.error = null;
      
    } catch (err) {
      dbCheck = { 
        connected: false, 
        error: err.message, 
        usersTable: false, 
        mediaAssetsTable: false 
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'Neon database connection test',
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
