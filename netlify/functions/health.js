exports.handler = async (event) => {
  try {
    const ok = {
      ok: true,
      env: {
          DATABASE_URL: !!process.env.DATABASE_URL,
  NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
  AUTH_JWT_SECRET: !!process.env.AUTH_JWT_SECRET,
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
