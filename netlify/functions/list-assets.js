const { createClient } = require("@supabase/supabase-js");
const { verifyAuth } = require("./_auth");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };

    const { userId } = verifyAuth(event);
    console.log(`✅ list-assets: Auth OK for user: ${userId}`);

    const url = new URL(event.rawUrl);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10), 100);
    const from = 0, to = limit - 1;

    const { data, error } = await supabase
      .from("assets")
      .select("id, url, resource_type, created_at, public_id, width, height, duration, meta")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ items: data }) };
  } catch (err) {
    console.error("list-assets error:", err);
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }
};
