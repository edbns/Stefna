import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';
import { withAdminSecurity } from './_lib/adminSecurity';
import { handleCORS, getAdminCORSHeaders } from './_lib/cors';

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced Prisma with direct SQL queries
// - Uses q, qOne, qCount for database operations
// - Manages preset configurations
// ============================================================================

const adminPresetsHandler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event, true); // true for admin
  if (corsResponse) return corsResponse;

  try {

    if (event.httpMethod === 'GET') {
      // Get all preset configurations
      console.log('🔍 [Admin] Fetching preset configurations...')
      
      const presets = await q(`
        SELECT * FROM preset_config 
        ORDER BY category ASC, name ASC
      `);

      console.log(`✅ [Admin] Retrieved ${presets.length} preset configurations`)
      
      return json({
        presets,
        timestamp: new Date().toISOString()
      })

    } else if (event.httpMethod === 'POST') {
      // Create new preset configuration
      const body = JSON.parse(event.body || '{}')
      const { presetKey, name, description, strength, category, metadata } = body

      if (!presetKey || !name) {
        return json({ error: 'Preset key and name are required' }, { status: 400 })
      }

      console.log(`➕ [Admin] Creating new preset: ${presetKey}`)

      const newPreset = await q(`
        INSERT INTO preset_config (preset_key, name, description, strength, category, is_enabled, is_custom, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW(), NOW())
        RETURNING *
      `, [presetKey, name, description || '', strength || 1.0, category || 'custom', true, true, JSON.stringify(metadata || {})]);

      if (!newPreset || newPreset.length === 0) {
        throw new Error('Failed to create preset');
      }

      console.log(`✅ [Admin] Created preset: ${newPreset[0].preset_key}`)
      
      return json({
        success: true,
        preset: newPreset[0],
        message: 'Preset created successfully'
      })

    } else if (event.httpMethod === 'PUT') {
      // Update existing preset configuration
      const body = JSON.parse(event.body || '{}')
      const { id, updates } = body

      if (!id || !updates) {
        return json({ error: 'Preset ID and updates are required' }, { status: 400 })
      }

      console.log(`✏️ [Admin] Updating preset: ${id}`)

      // Build dynamic UPDATE query with proper JSONB handling
      const updateFields = Object.keys(updates).map((key, index) => {
        const value = updates[key];
        if (key === 'metadata' && typeof value === 'object') {
          return `${key} = $${index + 2}::jsonb`;
        }
        return `${key} = $${index + 2}`;
      }).join(', ');
      
      const updateValues = Object.values(updates).map(value => {
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return value;
      });
      
      const updatedPreset = await q(`
        UPDATE preset_config 
        SET ${updateFields}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id, ...updateValues]);

      if (!updatedPreset || updatedPreset.length === 0) {
        throw new Error('Failed to update preset');
      }

      console.log(`✅ [Admin] Updated preset: ${updatedPreset[0].preset_key}`)
      
      return json({
        success: true,
        preset: updatedPreset[0],
        message: 'Preset updated successfully'
      })

    } else if (event.httpMethod === 'DELETE') {
      // Delete preset configuration
      const body = JSON.parse(event.body || '{}')
      const { id } = body

      if (!id) {
        return json({ error: 'Preset ID is required' }, { status: 400 })
      }

      console.log(`🗑️ [Admin] Deleting preset: ${id}`)

      const result = await q(`
        DELETE FROM preset_config WHERE id = $1
      `, [id]);

      console.log(`✅ [Admin] Deleted preset: ${id}`)
      
      return json({
        success: true,
        message: 'Preset deleted successfully'
      })

    } else {
      return json({ error: 'Method not allowed' }, { status: 405 })
    }

  } catch (error) {
    console.error('💥 [Admin] Error:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};

const handler = withAdminSecurity(adminPresetsHandler);

export { handler };
