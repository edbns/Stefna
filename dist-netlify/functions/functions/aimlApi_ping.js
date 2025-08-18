export const handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : null;
        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                have: {
                    AIML_API_KEY: !!process.env.AIML_API_KEY,
                    DATABASE_URL: !!process.env.DATABASE_URL,
                    NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
                    AUTH_JWT_SECRET: !!process.env.AUTH_JWT_SECRET,
                    NODE_VERSION: process.version,
                },
                bodyKeys: body ? Object.keys(body) : [],
            }),
        };
    }
    catch (e) {
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message }) };
    }
};
