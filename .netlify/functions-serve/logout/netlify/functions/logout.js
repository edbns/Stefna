"use strict";

// netlify/functions/logout.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const cookie = `stefna_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`;
  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": cookie,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ success: true })
  };
};
//# sourceMappingURL=logout.js.map
