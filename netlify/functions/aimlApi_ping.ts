export const handler = async (event: any) => {
  try {
    const body = event.body ? JSON.parse(event.body) : null;
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        have: {
          AIML_API_KEY: !!process.env.AIML_API_KEY,
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          NODE_VERSION: process.version,
        },
        bodyKeys: body ? Object.keys(body) : [],
      }),
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message }) };
  }
};


