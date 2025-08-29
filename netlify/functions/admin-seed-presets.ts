import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';



export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    // Verify admin access
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (event.httpMethod === 'POST') {
      console.log('🌱 [Admin] Seeding preset configurations...')
      
      // Sample preset data
      const samplePresets = [
        {
          presetKey: 'neo-tokyo-glitch',
          name: 'Neo Tokyo Glitch',
          description: 'Cyberpunk aesthetic with digital glitch effects',
          strength: 0.8,
          category: 'cyberpunk',
          isEnabled: true,
          isCustom: false,
          metadata: { style: 'cyberpunk', effects: ['glitch', 'digital'] }
        },
        {
          presetKey: 'ghibli-reaction',
          name: 'Ghibli Reaction',
          description: 'Studio Ghibli inspired artistic style',
          strength: 0.9,
          category: 'artistic',
          isEnabled: true,
          isCustom: false,
          metadata: { style: 'ghibli', mood: 'whimsical' }
        },
        {
          presetKey: 'emotion-mask',
          name: 'Emotion Mask',
          description: 'Emotional expression enhancement',
          strength: 0.7,
          category: 'portrait',
          isEnabled: true,
          isCustom: false,
          metadata: { style: 'portrait', focus: 'emotion' }
        },
        {
          presetKey: 'story-time',
          name: 'Story Time',
          description: 'AI-powered story generation from photos',
          strength: 0.85,
          category: 'creative',
          isEnabled: true,
          isCustom: false,
          metadata: { style: 'narrative', type: 'story' }
        },
        {
          presetKey: 'custom-prompt',
          name: 'Custom Prompt',
          description: 'User-defined custom generation',
          strength: 1.0,
          category: 'custom',
          isEnabled: true,
          isCustom: false,
          metadata: { style: 'custom', flexibility: 'high' }
        }
      ]

      // Create presets
      const createdPresets = []
      for (const preset of samplePresets) {
        try {
          const created = await q(preset_config.upsert({
            where: { preset_key: preset.presetKey },
            update: {
              name: preset.name,
              description: preset.description,
              strength: preset.strength,
              category: preset.category,
              is_enabled: preset.isEnabled,
              is_custom: preset.isCustom,
              metadata: preset.metadata,
              updated_at: new Date()
            },
            create: {
              preset_key: preset.presetKey,
              name: preset.name,
              description: preset.description,
              strength: preset.strength,
              category: preset.category,
              is_enabled: preset.isEnabled,
              is_custom: preset.isCustom,
              metadata: preset.metadata,
              created_at: new Date(),
              updated_at: new Date()
            }
          })
          createdPresets.push(created)
        } catch (error) {
          console.log(`⚠️ [Admin] Preset ${preset.presetKey} already exists or failed to create`)
        }
      }

      console.log(`✅ [Admin] Seeded ${createdPresets.length} preset configurations`)
      
      return json({
        success: true,
        message: `Seeded ${createdPresets.length} preset configurations`,
        presets: createdPresets,
        timestamp: new Date().toISOString()
      })

    } else {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

  } catch (e) {
    console.error('❌ [Admin] Error seeding presets:', e)
    return json({ error: 'Failed to seed presets' }, { status: 500 })
  } finally {
    
  }
}
