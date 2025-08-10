const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    // required
    const { user_id, result_url } = body;
    if (!user_id || !result_url) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'user_id and result_url are required' }) 
      };
    }

    // optional metadata
    const row = {
      user_id,
      result_url,
      source_url: body.source_url ?? null,
      job_id: body.job_id ?? null,
      model: body.model ?? null,
      mode: body.mode ?? null,                // 't2i' | 'i2i' | 'preset' | 'remix'
      prompt: body.prompt ?? null,
      negative_prompt: body.negative_prompt ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
      strength: body.strength ?? null,
      // privacy/remix
      visibility: body.visibility ?? 'private',   // default private per DB
      env: body.env ?? 'prod',
      allow_remix: !!body.allow_remix,            // will be validated by DB check
      parent_asset_id: body.parent_asset_id ?? null
    };

    const { data, error } = await supabase
      .from('media_assets')
      .insert([row])
      .select()
      .single();

    if (error) {
      // bubble up DB remix/visibility checks (e.g., "Remixes are not allowed by the owner.")
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: error.message }) 
      };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify(data) 
    };
  } catch (error) {
    console.error('saveMedia error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};
