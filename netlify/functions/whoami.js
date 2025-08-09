// Simple JWT authentication test function
// Use this to debug auth issues by calling /.netlify/functions/whoami with Authorization header

const { verifyAuth } = require("./_auth");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
    }

    const { claims, userId, token } = verifyAuth(event);
    
    return { 
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ok: true, 
        userId: userId,
        email: claims.email || 'not provided',
        exp: claims.exp,
        expiresAt: new Date(claims.exp * 1000).toISOString(),
        isExpired: claims.exp < Date.now() / 1000,
        tokenLength: token.length,
        claims: Object.keys(claims),
        message: "Authentication successful"
      }) 
    };
    
  } catch (error) {
    console.error("whoami auth error:", error.message);
    
    if (error.message === "no_bearer") {
      return { 
        statusCode: 401, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ok: false, 
          error: "No authorization token provided",
          help: "Add 'Authorization: Bearer <your_jwt>' header"
        }) 
      };
    }
    
    if (error.message === "no_user_id_claim") {
      return { 
        statusCode: 401, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ok: false, 
          error: "Token missing user ID claim",
          help: "Token must contain one of: sub, user_id, uid, id, userId"
        }) 
      };
    }
    
    let errorType = "unknown";
    if (error.name === "TokenExpiredError") {
      errorType = "expired";
    } else if (error.name === "JsonWebTokenError") {
      errorType = "invalid";
    } else if (error.name === "NotBeforeError") {
      errorType = "not_before";
    }
    
    return { 
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ok: false, 
        error: error.message,
        errorType,
        jwtName: error.name,
        help: "Check JWT_SECRET environment variable and token format"
      }) 
    };
  }
};
