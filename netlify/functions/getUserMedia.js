import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

const ok = (b) => ({ statusCode: 200, body: JSON.stringify(b) });
const bad = (s, m) => ({ statusCode: s, body: JSON.stringify({ error: m }) });

// Simple JWT decode function (for user_id extraction)
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const handler = async (event) => {
  try {
    const auth = event.headers.authorization || event.headers.Authorization;
    const jwt = auth?.replace(/^Bearer\s+/i, '');

    if (!jwt) return bad(401, 'Missing user token');

    // Decode JWT to get user_id
    const decoded = decodeJWT(jwt);
    if (!decoded || !decoded.sub) {
      return bad(401, 'Invalid token format');
    }

    const userId = decoded.sub;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const { data: generated, error: generatedError } = await supabase
      .from('media_assets')
      .select('id, result_url as url, resource_type, created_at, prompt, parent_asset_id, result_url, source_url, visibility, allow_remix')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (generatedError) {
      console.error('Error fetching generated:', generatedError);
      return bad(500, `Generated error: ${generatedError.message}`);
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
