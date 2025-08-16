"use strict";

// netlify/functions/debug-feed.js
var { createClient } = require("@supabase/supabase-js");
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log("\u{1F50D} Debug: Checking media_assets table...");
    const { count: totalCount, error: countError } = await supabase.from("media_assets").select("*", { count: "exact", head: true });
    if (countError) {
      console.error("\u274C Count error:", countError);
      return { statusCode: 500, body: JSON.stringify({ error: countError.message }) };
    }
    const { data: publicMedia, error: publicError } = await supabase.from("media_assets").select("id,visibility,env,created_at,user_id").eq("visibility", "public").limit(10);
    if (publicError) {
      console.error("\u274C Public media error:", publicError);
      return { statusCode: 500, body: JSON.stringify({ error: publicError.message }) };
    }
    const { data: prodMedia, error: prodError } = await supabase.from("media_assets").select("id,visibility,env,created_at,user_id").eq("env", "prod").limit(10);
    if (prodError) {
      console.error("\u274C Prod media error:", prodError);
      return { statusCode: 500, body: JSON.stringify({ error: prodError.message }) };
    }
    const { data: userMedia, error: userError } = await supabase.from("media_assets").select("id,visibility,env,created_at,user_id,prompt").order("created_at", { ascending: false }).limit(20);
    if (userError) {
      console.error("\u274C User media error:", userError);
      return { statusCode: 500, body: JSON.stringify({ error: userError.message }) };
    }
    const debugInfo = {
      totalCount,
      publicCount: publicMedia?.length || 0,
      prodCount: prodMedia?.length || 0,
      publicMedia: publicMedia?.slice(0, 5) || [],
      prodMedia: prodMedia?.slice(0, 5) || [],
      recentMedia: userMedia?.slice(0, 10) || [],
      environment: {
        PUBLIC_APP_ENV: process.env.PUBLIC_APP_ENV,
        NODE_ENV: process.env.NODE_ENV
      }
    };
    console.log("\u{1F50D} Debug info:", debugInfo);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(debugInfo)
    };
  } catch (e) {
    console.error("\u274C Debug function error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e?.message || "Debug function crashed" })
    };
  }
};
//# sourceMappingURL=debug-feed.js.map
