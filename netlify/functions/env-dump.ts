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
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.env.NODE_VERSION,
      
      // Neon Database Configuration
      db_set: !!process.env.DATABASE_URL,
      netlify_db_set: !!process.env.NETLIFY_DATABASE_URL,
      dbHost: (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || '').split('@')[1]?.split('/')[0] || 'n/a',
      
      // AIML API Configuration
      aiml_key_set: !!process.env.AIML_API_KEY,
      aiml_base_set: !!process.env.AIML_API_BASE,
      
      // JWT Configuration
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasAuthJwtSecret: !!process.env.AUTH_JWT_SECRET,
      hasJwtSecretAlt: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      authJwtSecretLength: process.env.AUTH_JWT_SECRET?.length || 0,
      jwtSecretsMatch: process.env.JWT_SECRET === process.env.AUTH_JWT_SECRET,
      
      // Supabase (should be removed)
      supabaseUrl: (process.env.SUPABASE_URL || '').replace(/.{20}$/, '********'),
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      
      // Environment Summary
      summary: {
        neon_ready: !!(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL),
        aiml_ready: !!(process.env.AIML_API_KEY && process.env.AIML_API_BASE),
        auth_ready: !!(process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET),
        supabase_removed: !process.env.SUPABASE_URL
      }
    }, null, 2),
  };
};
