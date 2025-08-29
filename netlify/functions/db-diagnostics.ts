// netlify/functions/db-diagnostics.ts
import type { Handler } from '@netlify/functions';
import { q } from './_db';

export const handler: Handler = async () => {
  const redact = (u: string) => (u || '').replace(/:\/\/([^:]+):([^@]+)@/,'://$1:****@');
  
  try {
    // Test connection with simple query
    const result = await q('SELECT 1 as test');
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeVersion: process.version,
        dbUrlScheme: 'postgresql',
        dbUrlRedacted: redact(process.env.DATABASE_URL || ''),
        accelerateExpected: false,
        steps: [
          {
            step: 'env-check',
            ok: true,
            DATABASE_URL: redact(process.env.DATABASE_URL || ''),
            NODE_ENV: process.env.NODE_ENV || 'not set'
          },
          {
            step: 'pg-connection',
            ok: true,
            testResult: result[0]?.test
          },
          {
            step: 'pg-query',
            ok: true,
            message: 'Successfully connected using pg Pool'
          }
        ]
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Database connection failed',
        message: error.message,
        steps: [
          {
            step: 'env-check',
            ok: !!process.env.DATABASE_URL,
            DATABASE_URL: redact(process.env.DATABASE_URL || ''),
            NODE_ENV: process.env.NODE_ENV || 'not set'
          },
          {
            step: 'pg-connection',
            ok: false,
            error: error.message
          }
        ]
      })
    };
  }
};
