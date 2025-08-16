"use strict";

// netlify/functions/admin-upgrade-user.js
var { createClient } = require("@supabase/supabase-js");
exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST"
      },
      body: ""
    };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  try {
    const { email, newTier, adminSecret } = JSON.parse(event.body);
    const expectedSecret = process.env.ADMIN_SECRET || "stefna-admin-2024";
    if (adminSecret !== expectedSecret) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }
    if (!email || !newTier) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Email and newTier are required" })
      };
    }
    const validTiers = ["registered", "verified", "contributor"];
    if (!validTiers.includes(newTier)) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Invalid tier. Must be one of: registered, verified, contributor" })
      };
    }
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Database configuration error" })
      };
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("email", email).single();
    if (userError) {
      if (userError.code === "PGRST116") {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ error: "User not found" })
        };
      }
      throw userError;
    }
    const { data: updatedUser, error: updateError } = await supabase.from("users").update({
      tier: newTier
    }).eq("email", email).select().single();
    if (updateError) {
      throw updateError;
    }
    console.log(`\u2705 Successfully upgraded user ${email} to ${newTier} tier`);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        message: `User ${email} successfully upgraded to ${newTier} tier`,
        user: updatedUser
      })
    };
  } catch (error) {
    console.error("Admin upgrade error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: error.message || "Internal server error"
      })
    };
  }
};
//# sourceMappingURL=admin-upgrade-user.js.map
