export const handler = async () => {
    const s = process.env.AUTH_JWT_SECRET ??
        process.env.JWT_SECRET ??
        process.env.JWT_SECRET_ALT ??
        "";
    const len = s.length;
    const tail = s.slice(-6);
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            ok: true,
            len,
            tail,
            hasAuthJwtSecret: !!process.env.AUTH_JWT_SECRET,
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasJwtSecretAlt: !!process.env.JWT_SECRET_ALT
        })
    };
};
