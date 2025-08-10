// AI Generation Service - Integrates with AIML API and token system
import tokenService, { UserTier } from './tokenService'
import environmentConfig from '../config/environment'
import contentModerationService from './contentModerationService'
import aimlModelService, { AIMLModel, ModelConfig } from './aimlModelService'
import fileUploadService, { UploadResult, UploadProgress } from './fileUploadService'
import { signedFetch } from '../utils/apiClient'

export interface GenerationRequest {
  prompt: string
  type: 'photo' | 'video'
  quality: 'standard' | 'high'
  style?: string
  userId: string
  userTier: UserTier
  modelId?: string // New: specific model selection
  imageFile?: File // New: for I2I
  videoFile?: File // New: for V2V
  imageUrl?: string // New: for I2I (if already uploaded)
  videoUrl?: string // New: for V2V (if already uploaded)
  samples?: number // New: number of variations to generate (1-2)
}

export interface GenerationResult {
  id: string
  url: string
  prompt: string
  type: 'photo' | 'video'
  quality: 'standard' | 'high'
  style?: string
  createdAt: string
  tokensUsed: number
  liked?: boolean
  saved?: boolean
  modelId?: string // New: track which model was used
  sourceFile?: string // New: track source file for I2I/V2V
}

export interface GenerationStatus {
  isGenerating: boolean
  progress: number
  status: 'idle' | 'processing' | 'completed' | 'error'
  error?: string
  modelId?: string // New: track model in status
  uploadProgress?: UploadProgress // New: track upload progress
}

class AIGenerationService {
  private static instance: AIGenerationService
  private generationQueue: Map<string, GenerationStatus> = new Map()

  static getInstance(): AIGenerationService {
    if (!AIGenerationService.instance) {
      AIGenerationService.instance = new AIGenerationService()
    }
    return AIGenerationService.instance
  }

  constructor() {
    // Initialize AIML client with API key (try both possible names)
    const apiKey = import.meta.env.VITE_AIML_API_KEY
    
    // Environment check for debugging
    const availableVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).join(', ');
    console.log('🔍 Environment check:', {
      VITE_AIML_API_KEY: import.meta.env.VITE_AIML_API_KEY ? '✅ Found' : '❌ Missing',
      allEnvVars: availableVars
    });

    if (!apiKey) {
      console.error('Missing AIML API key!')
      console.error('Expected: VITE_AIML_API_KEY')
      console.error('Available VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))
      return null
    }
  }

  // Check if user can generate content
  async canGenerate(request: GenerationRequest): Promise<{ canGenerate: boolean; reason?: string; remainingTokens?: number }> {
    return await tokenService.canGenerate(request.userId, request.userTier, request.type, request.quality)
  }

  // Generate AI content
  async generateContent(request: GenerationRequest): Promise<{ success: boolean; result?: GenerationResult; error?: string }> {
    const generationId = this.generateId()
    
    // Initialize generation status
    this.updateGenerationStatus(generationId, { 
      isGenerating: true, 
      progress: 0, 
      status: 'processing'
    })

    try {
      // Check if service is configured
      if (!environmentConfig.isConfigured()) {
        return { success: false, error: 'AI service not configured. Please contact support.' }
      }

      // Handle file uploads for I2I/V2V
      let imageUrl = request.imageUrl
      let videoUrl = request.videoUrl

      if (request.imageFile) {
        if (!fileUploadService.validateFileForI2I(request.imageFile)) {
          return { success: false, error: 'Invalid image file type. Supported: JPEG, PNG, WebP' }
        }

        this.updateGenerationStatus(generationId, { 
          progress: 10, 
          status: 'processing',
          uploadProgress: { progress: 0, status: 'uploading' }
        })

        const uploadResult = await fileUploadService.uploadFile(
          request.imageFile,
          (progress) => {
            this.updateGenerationStatus(generationId, { 
              uploadProgress: progress,
              progress: 10 + (progress.progress * 0.3) // Upload is 30% of total progress
            })
          }
        )
        imageUrl = uploadResult.url
      }

      if (request.videoFile) {
        if (!fileUploadService.validateFileForV2V(request.videoFile)) {
          return { success: false, error: 'Invalid video file type. Supported: MP4, WebM, AVI, MOV' }
        }

        this.updateGenerationStatus(generationId, { 
          progress: 10, 
          status: 'processing',
          uploadProgress: { progress: 0, status: 'uploading' }
        })

        const uploadResult = await fileUploadService.uploadFile(
          request.videoFile,
          (progress) => {
            this.updateGenerationStatus(generationId, { 
              uploadProgress: progress,
              progress: 10 + (progress.progress * 0.3) // Upload is 30% of total progress
            })
          }
        )
        videoUrl = uploadResult.url
      }

      // Select model based on request
      const selectedModelId = request.modelId || this.selectBestModel(request, imageUrl, videoUrl)
      
      // Update status with model info
      this.updateGenerationStatus(generationId, { 
        progress: 40,
        status: 'processing',
        modelId: selectedModelId
      })

      // Use real AIML API - model selection happens on server
      console.log(`🚀 AIML: Starting generation (server will choose model)`)
      const result = await this.callAimlApi(request, generationId, selectedModelId, imageUrl, videoUrl)

      // Get token cost using tokenService
      const cost = tokenService.getTokenCost(request.type, request.quality)
      
      // Get current usage and update
      const currentUsage = await tokenService.getUserUsage(request.userId)
      currentUsage.dailyUsage += cost
      currentUsage.totalUsage += cost
      await tokenService.saveUserUsage(request.userId, currentUsage)

      // Update final status
      this.updateGenerationStatus(generationId, { 
        isGenerating: false, 
        progress: 100, 
        status: 'completed',
        modelId: selectedModelId
      })

      return { success: true, result }
    } catch (error) {
      console.error('AI Generation error:', error)
      this.updateGenerationStatus(generationId, { 
        isGenerating: false, 
        status: 'error',
        error: error.message
      })
      return { success: false, error: 'Generation failed' }
    }
  }

  // Get generation status
  getGenerationStatus(generationId: string): GenerationStatus | null {
    return this.generationQueue.get(generationId) || null
  }

  // Update generation status
  private updateGenerationStatus(generationId: string, status: Partial<GenerationStatus>): void {
    const currentStatus = this.generationQueue.get(generationId) || {
      isGenerating: false,
      progress: 0,
      status: 'idle'
    }
    
    this.generationQueue.set(generationId, { ...currentStatus, ...status })
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Save generation to user's history
  async saveToHistory(result: GenerationResult, userId: string): Promise<void> {
    try {
      const history = JSON.parse(localStorage.getItem(`generation_history_${userId}`) || '[]')
      history.unshift({
        ...result,
        userId,
        savedAt: new Date().toISOString()
      })
      
      // Keep only last 50 generations
      if (history.length > 50) {
        history.splice(50)
      }
      
      localStorage.setItem(`generation_history_${userId}`, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save to history:', error)
    }
  }

  // Get user's generation history
  async getGenerationHistory(userId: string): Promise<GenerationResult[]> {
    try {
      const history = JSON.parse(localStorage.getItem(`generation_history_${userId}`) || '[]')
      return history
    } catch (error) {
      console.error('Failed to load history:', error)
      return []
    }
  }

  // Clear generation status
  clearGenerationStatus(generationId: string): void {
    this.generationQueue.delete(generationId)
  }

  // Note: Model selection moved to server-side based on request content
  // Client no longer forces model selection - let server choose
  private selectBestModel(request: GenerationRequest, imageUrl?: string, videoUrl?: string): string | undefined {
    // Server automatically chooses:
    // - I2I model when image_url is present
    // - V2V model when video_url is present  
    // - T2I model when neither is present
    return undefined
  }

  // Call real AIML API
  private async callAimlApi(
    request: GenerationRequest, 
    generationId: string, 
    modelId: string, 
    imageUrl?: string, 
    videoUrl?: string
  ): Promise<GenerationResult> {
    try {
      console.log('Calling AIML API with:', {
        prompt: request.prompt,
        type: request.type,
        quality: request.quality,
        style: request.style,
        imageUrl,
        videoUrl
      })

      // Prepare the request body
      const requestBody: any = {
        prompt: request.prompt,
        type: request.type,
        quality: request.quality,
        style: request.style || 'default',
        num_outputs: request.samples || 1 // Number of variations to generate (1-2)
        // Note: modelId removed - let server choose model based on presence of image_url
      }

      // Add file URLs if provided
      if (imageUrl) {
        requestBody.image_url = imageUrl
        requestBody.width = 1024 // Default for I2I
        requestBody.height = 1024
        requestBody.strength = 0.85 // Strong stylization
        requestBody.steps = 40
        requestBody.guidance_scale = 7.5
        requestBody.negative_prompt = "photorealistic, realistic skin, film grain, frame, border, watermark, text, caption, vignette"
      }
      if (videoUrl) {
        requestBody.video_url = videoUrl
        requestBody.strength = 0.6 // Video needs different strength
      }

      // Call our Netlify Function instead of AIML API directly
      const response = await signedFetch('/.netlify/functions/aimlApi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('🚨 AIML API error response:', response.status, response.statusText)
        console.error('🚨 AIML API error data:', errorData)
        console.error('🚨 Original request body was:', JSON.stringify(requestBody, null, 2))
        
        // Handle specific error cases
        if (errorData.error?.includes('API key not configured') || errorData.error?.includes('API key not configured')) {
          throw new Error('AI service not configured. Please contact support.')
        } else if (errorData.error?.includes('API request failed')) {
          throw new Error('AI service temporarily unavailable. Please try again.')
        } else {
          throw new Error(errorData.error || 'AI generation failed')
        }
      }

      const result = await response.json()
      console.log('AIML API response:', result)
      console.log('Available keys in response:', Object.keys(result))
      
      // Log the server-selected model
      if (result.echo?.model) {
        console.log(`✅ AIML: Server selected model "${result.echo.model}" for generation`)
      }

      // Update progress during generation
      this.updateGenerationStatus(generationId, { progress: 80, status: 'processing', modelId })

      // Wait for generation to complete (simulate processing time)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Extract the image/video URL from the response (updated format from backend)
      const generatedUrl = result.result_url || result.image_url || result.video_url || result.url || result.output

      if (!generatedUrl) {
        console.error('No URL found in response. Full response:', result)
        throw new Error(`No image/video URL returned from AI service. Available keys: ${Object.keys(result).join(', ')}`)
      }

      // Check if the media was auto-saved by the server
      if (result.saved?.id) {
        console.log('✅ Media auto-saved by server:', result.saved.id)
      } else {
        console.log('⚠️ Media not auto-saved by server')
      }

      // Return the generated result
      return {
        id: result.saved?.id || this.generateId(), // Use server-generated ID if available
        url: generatedUrl,
        prompt: request.prompt,
        type: request.type,
        quality: request.quality,
        style: request.style,
        createdAt: new Date().toISOString(),
        tokensUsed: tokenService.getTokenCost(request.type, request.quality),
        modelId: modelId,
        sourceFile: imageUrl || videoUrl
      }
    } catch (error) {
      console.error('AIML API call failed:', error)
      throw error
    }
  }
}

export default AIGenerationService.getInstance() 