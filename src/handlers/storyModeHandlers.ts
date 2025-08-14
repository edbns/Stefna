import { presetsStore } from '../stores/presetsStore'
import { startGeneration } from '../services/startGeneration'
import { GenerateJob } from '../types/generation'

function pickRotation(presets: any[]): any[] {
  // Pick a rotation of presets for story mode
  const goodForStory = presets.filter(p => 
    p.id && !p.id.includes('restore') && !p.id.includes('enhance')
  )
  
  // Return first 4 or all if less than 4
  return goodForStory.slice(0, 4)
}

export async function runStory(sourceUrl: string, basePrompt?: string): Promise<void> {
  try {
    // Wait for presets to be ready
    const { ready, byId } = presetsStore.getState()
    await ready()
    
    // Get rotation of presets
    const rotation = pickRotation(Object.values(byId))
    if (!rotation.length) {
      throw new Error('No active presets available for Story Mode')
    }
    
    console.log('🎬 Starting Story Mode with rotation:', rotation.map(p => p.id))
    console.log(`Creating story with ${rotation.length} shots...`)
    
    // Generate each shot in the story
    for (const preset of rotation) {
      const job: GenerateJob = {
        mode: 'story',
        presetId: preset.id,
        prompt: basePrompt || preset.prompt,
        params: {
          ...preset.params,
          story_shot: true,
          num_variations: 1 // Each shot is one variation
        },
        source: { url: sourceUrl }
      }
      
      const result = await startGeneration(job)
      
      if (!result.success) {
        console.error('Story shot failed:', result.error)
        // Continue with other shots even if one fails
      }
    }
    
    console.log('Story Mode complete!')
  } catch (error) {
    console.error('Story Mode error:', error)
  }
}
