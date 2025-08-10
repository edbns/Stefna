const { createClient } = require('@supabase/supabase-js');
const { verifyAuth } = require('./_auth');

const ok = (b) => ({ statusCode: 200, body: JSON.stringify(b) });
const bad = (s, m) => ({ statusCode: s, body: JSON.stringify({ error: m }) });

exports.handler = async (event) => {
  try {
    // Use the same auth path as other functions so token formats are consistent
    const { userId } = verifyAuth(event);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // server key to bypass RLS and avoid policy edge cases
      { auth: { persistSession: false } }
    );

    // Query both tables separately and combine results
    // This avoids RLS issues and gives us full control over filtering
    
    // Get uploads from assets table
    const { data: uploads, error: uploadsError } = await supabase
      .from('assets')
      .select('id, url, resource_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (uploadsError) {
      console.error('Error fetching uploads:', uploadsError);
      return bad(500, `Uploads error: ${uploadsError.message}`);
    }

    // Get generated content from media_assets table
    let generated = null;
    let generatedError = null;
    try {
      const r1 = await supabase
        .from('media_assets')
        .select('id, result_url as url, resource_type, created_at, prompt, parent_asset_id, result_url, source_url, visibility, allow_remix')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      generated = r1.data;
      generatedError = r1.error;
      if (generatedError) throw generatedError;
    } catch (err) {
      // Fallback for older schema without result_url/source_url/visibility
      console.warn('Falling back to legacy media_assets select due to:', err?.message || err);
      const r2 = await supabase
        .from('media_assets')
        .select('id, url, resource_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (r2.error) {
        console.error('Error fetching generated (both attempts failed):', r2.error);
        return bad(500, `Generated error: ${r2.error.message}`);
      }
      generated = (r2.data || []).map(item => ({
        id: item.id,
        url: item.url,
        resource_type: item.resource_type,
        created_at: item.created_at,
        prompt: null,
        parent_asset_id: null,
        result_url: item.url,
        source_url: null,
        visibility: 'private',
        allow_remix: false,
      }));
    }

    // Combine and format results
    const uploadItems = (uploads || []).map(item => ({
      ...item,
      kind: 'upload',
      visibility: 'private',
      allow_remix: false,
      prompt: null,
      parent_asset_id: null,
      result_url: null,
      source_url: null
    }));

    const generatedItems = (generated || []).map(item => ({
      ...item,
      kind: 'generated'
    }));

    // Combine and sort by created_at
    const allItems = [...uploadItems, ...generatedItems]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 100);

    return ok({ items: allItems });
  } catch (e) {
    console.error('getUserMedia error:', e);
    return bad(500, e?.message || 'Unknown getUserMedia error');
  }
};
