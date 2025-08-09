const { createClient } = require("@supabase/supabase-js");
const { verifyAuth } = require("./_auth");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // server-only, bypasses RLS
  { auth: { persistSession: false } }
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const { userId } = verifyAuth(event);
    console.log(`✅ record-asset: Auth OK for user: ${userId}`);

    const body = JSON.parse(event.body || "{}");
    
    // Normalize resource_type (accept photo/image, video)
    let resource_type = body.resource_type || body.type || "image";
    if (resource_type === "photo") resource_type = "image";

    if (!["image", "video"].includes(resource_type)) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          message: `resource_type must be "image" or "video", got "${resource_type}"` 
        }) 
      };
    }

    const {
      url, public_id, folder,
      bytes, width, height, duration, meta
    } = body;

    if (!url) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required field: url" }) };
    }

    // Insert with normalized resource_type, make optional fields truly optional
    const { error, data } = await supabase
      .from("media_assets")  // Updated table name
      .insert({ 
        user_id: userId, 
        url, 
        public_id: public_id || null,  // Allow null
        resource_type, 
        folder: folder || null,        // Allow null
        bytes, 
        width, 
        height, 
        duration, 
        meta: meta || null 
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          message: `Database error: ${error.message}`,
          details: error
        }) 
      };
    }
    
    console.log(`✅ Asset recorded: ${data.id} for user ${userId}`);
    return { statusCode: 200, body: JSON.stringify({ id: data.id, message: "Asset saved successfully" }) };
  } catch (err) {
    console.error("record-asset error:", err);
    
    // Return specific error messages based on error type
    if (err.message?.includes("Unauthorized") || err.message?.includes("no_bearer")) {
      return { statusCode: 401, body: JSON.stringify({ message: "Authentication required" }) };
    }
    
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        message: err.message || "Internal server error",
        details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
      }) 
    };
  }
};
