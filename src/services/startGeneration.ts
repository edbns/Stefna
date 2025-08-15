import { GenerateJob, GenerationResult } from '../types/generation'
import { nanoid } from 'nanoid'
import { authHeaders } from '../lib/api'

export async function startGeneration(job: GenerateJob): Promise<GenerationResult> {
  // Validate required fields
  if (!job.mode) throw new Error('mode is required')
  if (!job.presetId) throw new Error('presetId is required') 
  if (!job.prompt) throw new Error('prompt is required')
  
  const runId = job.runId || nanoid()
  console.log('▶ startGeneration', { runId, job })
  
  try {
    // Call the existing aimlApi function
    const response = await fetch('/.netlify/functions/aimlApi', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ...job.params,
        prompt: job.prompt,
        image_url: job.source?.url,
        mode: job.mode,
        presetId: job.presetId,
        runId
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Generation failed: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('⏹ generation done', { runId, success: true })
    
    return {
      success: true,
      resultUrl: result.result_url || result.output_url,
      runId
    }
  } catch (error) {
    console.error('❌ Generation error:', { runId, error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      runId
    }
  }
}

export function resolveMode(m?: string): 'i2i' | 't2i' | 'story' | 'time_machine' | 'restore' {
  if (m === 'i2i' || m === 't2i' || m === 'story' || m === 'time_machine' || m === 'restore') {
    return m
  }
  throw new Error('Mode is required and must be valid')
}
