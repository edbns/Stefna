import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET;
if (!SECRET)
    throw new Error("JWT_SECRET is not set");
const ISS = process.env.JWT_ISSUER ?? "stefna";
const AUD = process.env.JWT_AUDIENCE ?? "stefna-app";
export function signUserToken(user) {
    return jwt.sign({ sub: user.id, email: user.email, role: "user" }, SECRET, {
        algorithm: "HS256",
        expiresIn: "30d",
        issuer: ISS,
        audience: AUD,
    });
}
export function verifyBearer(header) {
    const token = header?.replace(/^Bearer\s+/i, "");
    if (!token)
        throw new Error("NO_BEARER");
    return jwt.verify(token, SECRET, {
        algorithms: ["HS256"],
        issuer: ISS,
        audience: AUD,
    });
}
// Small helper to use inside handlers
export function requireAuth(req) {
    return verifyBearer(req.headers?.authorization || req.headers?.Authorization);
}
export function getBearer(event) {
    const h = event.headers || {};
    const raw = h.authorization || h.Authorization || '';
    const m = String(raw).match(/^Bearer\s+(.+)$/i);
    return m ? m[1] : '';
}
export async function requireUser(event) {
    try {
        const user = verifyBearer(event.headers?.authorization || event.headers?.Authorization);
        return {
            id: user.sub,
            email: user.email || null,
            name: null,
            avatar_url: null
        };
    }
    catch (e) {
        e.status = 401;
        throw e;
    }
}
export async function getAuthedUser(event) {
    try {
        const user = await requireUser(event);
        return { user };
    }
    catch (error) {
        return { user: null, error: error.message };
    }
}
