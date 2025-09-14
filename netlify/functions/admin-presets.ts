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
      
      try {
        const presets = await q(`
          SELECT id, preset_key, preset_name, preset_description, preset_category, 
                 preset_prompt, preset_negative_prompt, preset_strength, 
                 preset_rotation_index, preset_week, is_active, created_at, updated_at
          FROM presets_config 
          ORDER BY preset_category ASC, preset_name ASC
        `);

        console.log(`✅ [Admin] Retrieved ${presets.length} preset configurations`)
        
        return json({
          presets,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('❌ [Admin] Error fetching presets:', error);
        return json({ 
          error: 'Failed to fetch presets',
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }

    } else if (event.httpMethod === 'POST') {
      // Create new preset configuration
      const body = JSON.parse(event.body || '{}')
      const { presetKey, presetName, presetDescription, presetCategory, presetPrompt, presetNegativePrompt, presetStrength, presetWeek } = body

      if (!presetKey || !presetName || !presetPrompt) {
        return json({ error: 'Preset key, name, and prompt are required' }, { status: 400 })
      }

      console.log(`➕ [Admin] Creating new preset: ${presetKey}`)

      const newPreset = await q(`
        INSERT INTO presets_config (preset_key, preset_name, preset_description, preset_category, 
                                   preset_prompt, preset_negative_prompt, preset_strength, 
                                   preset_rotation_index, preset_week, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `, [
        presetKey, 
        presetName, 
        presetDescription || '', 
        presetCategory || 'custom', 
        presetPrompt,
        presetNegativePrompt || '',
        presetStrength || 1.0,
        0, // preset_rotation_index - default to 0
        presetWeek || null,
        true // is_active - default to true
      ]);

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

      // Build dynamic UPDATE query - map field names to actual column names
      const fieldMapping: { [key: string]: string } = {
        'name': 'preset_name',
        'description': 'preset_description',
        'category': 'preset_category',
        'prompt': 'preset_prompt',
        'negativePrompt': 'preset_negative_prompt',
        'strength': 'preset_strength',
        'week': 'preset_week',
        'isActive': 'is_active'
      };

      const updateFields = Object.keys(updates).map((key, index) => {
        const columnName = fieldMapping[key] || key;
        return `${columnName} = $${index + 2}`;
      }).join(', ');
      
      const updateValues = Object.values(updates);
      
      const updatedPreset = await q(`
        UPDATE presets_config 
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
        DELETE FROM presets_config WHERE id = $1
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
