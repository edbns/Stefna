"use strict";

// netlify/functions/cleanup-otps.js
var { createClient } = require("@supabase/supabase-js");
exports.handler = async () => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const { error } = await supabase.from("user_otps").delete().lt("expires_at", now).or("used.eq.true");
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
//# sourceMappingURL=cleanup-otps.js.map
