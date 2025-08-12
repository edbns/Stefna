const jwt = require("jsonwebtoken");

function getUserId(claims) {
  return (
    claims.sub ||
    claims.user_id ||
    claims.uid ||
    claims.id ||
    claims.userId ||
    null
  );
}

function verifyAuth(event) {
  const auth = event.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  
  // Feature flag: Guest mode (explicit opt-in). Default OFF.
  const GUEST_MODE_ENABLED = process.env.GUEST_MODE_ENABLED === 'true';
  
  if (!token) {
    if (GUEST_MODE_ENABLED) {
      return {
        claims: {},
        userId: `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        token: null,
      };
    }
    // Guests disabled: require auth token
    throw new Error("no_bearer");
  }
  
  const claims = jwt.verify(token, process.env.JWT_SECRET, { clockTolerance: 5 });
  const userId = getUserId(claims);
  if (!userId) throw new Error("no_user_id_claim");
  return { claims, userId, token };
}

module.exports = { verifyAuth };
