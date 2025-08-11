exports.handler = async (event) => {
  try {
    const ok = {
      ok: true,
      env: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        AIML_API_KEY: !!process.env.AIML_API_KEY,
      }
    };
    return { statusCode: 200, body: JSON.stringify(ok) };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
