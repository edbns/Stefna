import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    },
    body: JSON.stringify({
      context: process.env.CONTEXT,                   // production | deploy-preview | branch-deploy
      siteUrl: process.env.URL,
      supabaseUrl: (process.env.SUPABASE_URL || '').replace(/.{20}$/, '********'),
      dbHost: (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || '').split('@').at(1)?.split('/').at(0) || 'n/a',
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNetlifyDatabaseUrl: !!process.env.NETLIFY_DATABASE_URL,
      hasJwtSecret: !!process.env.AUTH_JWT_SECRET,
      hasJwtSecretAlt: !!process.env.JWT_SECRET,
    }, null, 2),
  };
};
