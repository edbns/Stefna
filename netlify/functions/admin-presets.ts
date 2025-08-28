import type { Handler } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';
import { json } from './_lib/http';

const prisma = new PrismaClient();

interface PresetConfig {
  id: string;
  presetKey: string;
  name: string;
  description: string;
  strength: number;
  category: string;
  isEnabled: boolean;
  isCustom: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  try {
    // Verify admin access
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (event.httpMethod === 'GET') {
      // Get all preset configurations
      console.log('🔍 [Admin] Fetching preset configurations...')
      
      const presets = await prisma.presetConfig.findMany({
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      })

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

      const newPreset = await prisma.presetConfig.create({
        data: {
          presetKey,
          name,
          description: description || '',
          strength: strength || 1.0,
          category: category || 'custom',
          isEnabled: true,
          isCustom: true,
          metadata: metadata || {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log(`✅ [Admin] Created preset: ${newPreset.presetKey}`)
      
      return json({
        success: true,
        preset: newPreset,
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

      const updatedPreset = await prisma.presetConfig.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      })

      console.log(`✅ [Admin] Updated preset: ${updatedPreset.presetKey}`)
      
      return json({
        success: true,
        preset: updatedPreset,
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

      await prisma.presetConfig.delete({
        where: { id }
      })

      console.log(`✅ [Admin] Deleted preset: ${id}`)
      
      return json({
        success: true,
        message: 'Preset deleted successfully'
      })

    } else {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

  } catch (e) {
    console.error('❌ [Admin] Error managing presets:', e)
    return json({ error: 'Failed to manage presets' }, { status: 500 })
  } finally {
    await prisma.$disconnect();
  }
}
