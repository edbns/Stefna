// src/services/aiml.ts
import { authHeaders } from '../lib/api'

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 250,
  maxDelay: 1000,
  timeout: 60000, // 60s model timeout
}

// Exponential backoff with jitter
function getBackoffDelay(attempt: number): number {
  const delay = Math.min(RETRY_CONFIG.baseDelay * Math.pow(2, attempt), RETRY_CONFIG.maxDelay)
  const jitter = Math.random() * delay * 0.1 // 10% jitter
  return delay + jitter
}

// Structured logging
function logAimlCall(phase: string, data: any) {
  const logData = {
    timestamp: new Date().toISOString(),
    phase,
    runId: data.runId || 'unknown',
    presetId: data.presetId || 'unknown',
    userId: data.userId || 'unknown',
    mode: data.mode || 'unknown',
    ...data
  }
  console.log(`🎯 AIML API [${phase}]:`, logData)
}

export async function callAimlApi(payload: any) {
  const startTime = Date.now()
  const runId = payload.runId || crypto.randomUUID()
  
  // Add runId to payload if not present
  const enrichedPayload = { ...payload, runId }
  
  logAimlCall('start', { runId, presetId: payload.presetId, mode: payload.mode })
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.timeout)
      
      const response = await fetch('/.netlify/functions/aimlApi', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(enrichedPayload),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        const errorData = { status: response.status, statusText: response.statusText, body: errorText }
        
        // Handle specific error cases
        if (response.status === 401) {
          logAimlCall('auth_error', { runId, error: errorData })
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
        }
        
        if (response.status === 429) {
          logAimlCall('rate_limited', { runId, attempt, error: errorData })
          if (attempt < RETRY_CONFIG.maxRetries) {
            const delay = getBackoffDelay(attempt)
            logAimlCall('retry_scheduled', { runId, attempt, delay })
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        
        if (response.status >= 500) {
          logAimlCall('server_error', { runId, attempt, error: errorData })
          if (attempt < RETRY_CONFIG.maxRetries) {
            const delay = getBackoffDelay(attempt)
            logAimlCall('retry_scheduled', { runId, attempt, delay })
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        
        throw new Error(`AIML API failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      const duration = Date.now() - startTime
      
      logAimlCall('success', { 
        runId, 
        duration, 
        hasImages: !!result.images,
        hasData: !!result.data 
      })
      
      return result
      
    } catch (error: any) {
      lastError = error
      const duration = Date.now() - startTime
      
      if (error.name === 'AbortError') {
        logAimlCall('timeout', { runId, attempt, duration })
        throw new Error(`AIML API call timed out after ${RETRY_CONFIG.timeout}ms`)
      }
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        logAimlCall('retry_attempt', { runId, attempt, error: error.message, duration })
        const delay = getBackoffDelay(attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        logAimlCall('final_failure', { runId, attempts: attempt + 1, error: error.message, duration })
        throw new Error(`AIML API failed after ${attempt + 1} attempts: ${error.message}`)
      }
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error('AIML API failed with unknown error')
}
