// Advanced AI Service for Stefna
// Supports multiple models, style mixing, and batch processing

export interface AIModel {
  id: string
  name: string
  description: string
  category: 'art' | 'photography' | 'anime' | 'realistic' | 'abstract'
  cost: number // tokens per generation
  maxResolution: string
  features: string[]
}

export interface StyleMix {
  primaryStyle: string
  secondaryStyle: string
  mixRatio: number // 0-1, where 0 = all primary, 1 = all secondary
}

export interface BatchRequest {
  images: string[]
  prompt: string
  model: string
  styleMix?: StyleMix
  batchSize: number
}

export interface AIProcessingResult {
  id: string
  originalImage: string
  processedImage: string
  prompt: string
  model: string
  processingTime: number
  cost: number
  metadata: {
    resolution: string
    styleMix?: StyleMix
    enhancements: string[]
  }
}

class AdvancedAIService {
  private models: AIModel[] = [
    {
      id: 'sdxl',
      name: 'Stable Diffusion XL',
      description: 'High-quality realistic and artistic images',
      category: 'realistic',
      cost: 2,
      maxResolution: '1024x1024',
      features: ['photorealistic', 'artistic', 'detailed']
    },
    {
      id: 'anime',
      name: 'Anime Diffusion',
      description: 'Specialized for anime and manga style',
      category: 'anime',
      cost: 2,
      maxResolution: '768x768',
      features: ['anime', 'manga', 'cartoon']
    },
    {
      id: 'artistic',
      name: 'Artistic Style',
      description: 'Oil painting, watercolor, and artistic styles',
      category: 'art',
      cost: 2,
      maxResolution: '1024x1024',
      features: ['oil-painting', 'watercolor', 'impressionist']
    },
    {
      id: 'photography',
      name: 'Photo Enhancement',
      description: 'Professional photography enhancements',
      category: 'photography',
      cost: 2,
      maxResolution: '2048x2048',
      features: ['portrait', 'landscape', 'professional']
    },
    {
      id: 'abstract',
      name: 'Abstract Art',
      description: 'Modern abstract and conceptual art',
      category: 'abstract',
      cost: 2,
      maxResolution: '1024x1024',
      features: ['abstract', 'conceptual', 'modern']
    }
  ]

  private stylePresets = {
    'anime': ['Studio Ghibli', 'Cyberpunk Anime', 'Vintage Anime', 'Modern Anime'],
    'art': ['Oil Painting', 'Watercolor', 'Impressionist', 'Cubist', 'Surrealist'],
    'photography': ['Portrait', 'Landscape', 'Street', 'Architecture', 'Macro'],
    'realistic': ['Photorealistic', 'Cinematic', 'Documentary', 'Fashion', 'Product'],
    'abstract': ['Geometric', 'Organic', 'Minimalist', 'Expressionist', 'Conceptual']
  }

  public getModels(): AIModel[] {
    return this.models
  }

  public getModelById(id: string): AIModel | undefined {
    return this.models.find(model => model.id === id)
  }

  public getModelsByCategory(category: 'art' | 'photography' | 'anime' | 'realistic' | 'abstract'): AIModel[] {
    return this.models.filter(model => model.category === category)
  }

  public getStylePresets(category: 'anime' | 'art' | 'photography' | 'realistic' | 'abstract'): string[] {
    return this.stylePresets[category] || []
  }

  public async processImage(
    imageData: string,
    prompt: string,
    modelId: string = 'sdxl',
    styleMix?: StyleMix
  ): Promise<AIProcessingResult> {
    const model = this.getModelById(modelId)
    if (!model) {
      throw new Error(`Model ${modelId} not found`)
    }

    const startTime = Date.now()
    
    // Simulate AI processing with different models
    await this.simulateProcessing(model)
    
    const processingTime = Date.now() - startTime
    
    // Generate enhanced prompt based on style mix
    const enhancedPrompt = styleMix 
      ? this.generateStyleMixPrompt(prompt, styleMix)
      : prompt

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalImage: imageData,
      processedImage: imageData, // In real app, this would be the AI-processed image
      prompt: enhancedPrompt,
      model: model.name,
      processingTime,
      cost: model.cost,
      metadata: {
        resolution: model.maxResolution,
        styleMix,
        enhancements: model.features
      }
    }
  }

  public async processBatch(request: BatchRequest): Promise<AIProcessingResult[]> {
    const results: AIProcessingResult[] = []
    
    // Process images in batches
    for (let i = 0; i < request.images.length; i += request.batchSize) {
      const batch = request.images.slice(i, i + request.batchSize)
      
      const batchPromises = batch.map(image => 
        this.processImage(image, request.prompt, request.model, request.styleMix)
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Add delay between batches to avoid rate limiting
      if (i + request.batchSize < request.images.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }

  public generateStyleMixPrompt(basePrompt: string, styleMix: StyleMix): string {
    const { primaryStyle, secondaryStyle, mixRatio } = styleMix
    
    if (mixRatio <= 0.3) {
      return `${basePrompt}, ${primaryStyle} style`
    } else if (mixRatio >= 0.7) {
      return `${basePrompt}, ${secondaryStyle} style`
    } else {
      return `${basePrompt}, ${primaryStyle} and ${secondaryStyle} style mix`
    }
  }

  public suggestPrompts(imageDescription: string, modelId: string): string[] {
    const model = this.getModelById(modelId)
    if (!model) return []

    const suggestions: string[] = []
    
    switch (model.category) {
      case 'anime':
        suggestions.push(
          `${imageDescription}, anime style, vibrant colors`,
          `${imageDescription}, Studio Ghibli style, soft lighting`,
          `${imageDescription}, cyberpunk anime, neon lights`
        )
        break
      case 'art':
        suggestions.push(
          `${imageDescription}, oil painting style, textured`,
          `${imageDescription}, watercolor style, flowing colors`,
          `${imageDescription}, impressionist style, brushstrokes`
        )
        break
      case 'photography':
        suggestions.push(
          `${imageDescription}, professional photography, sharp focus`,
          `${imageDescription}, cinematic lighting, dramatic shadows`,
          `${imageDescription}, portrait style, shallow depth of field`
        )
        break
      case 'realistic':
        suggestions.push(
          `${imageDescription}, photorealistic, high detail`,
          `${imageDescription}, cinematic style, movie quality`,
          `${imageDescription}, documentary style, natural lighting`
        )
        break
      case 'abstract':
        suggestions.push(
          `${imageDescription}, abstract art, geometric shapes`,
          `${imageDescription}, minimalist style, clean lines`,
          `${imageDescription}, expressionist style, bold colors`
        )
        break
    }
    
    return suggestions
  }

  public estimateCost(modelId: string, batchSize: number = 1): number {
    const model = this.getModelById(modelId)
    return model ? model.cost * batchSize : 0
  }

  public getProcessingTime(modelId: string): number {
    const model = this.getModelById(modelId)
    if (!model) return 3000

    // Simulate different processing times based on model complexity
    switch (model.id) {
      case 'sdxl':
        return 5000 // 5 seconds for SDXL
      case 'anime':
        return 3000 // 3 seconds for anime
      case 'artistic':
        return 4000 // 4 seconds for artistic
      case 'photography':
        return 3500 // 3.5 seconds for photography
      case 'abstract':
        return 2500 // 2.5 seconds for abstract
      default:
        return 3000
    }
  }

  private async simulateProcessing(model: AIModel): Promise<void> {
    const processingTime = this.getProcessingTime(model.id)
    await new Promise(resolve => setTimeout(resolve, processingTime))
  }

  public async enhancePrompt(basePrompt: string, modelId: string): Promise<string> {
    const model = this.getModelById(modelId)
    if (!model) return basePrompt

    // Add model-specific enhancements
    const enhancements = model.features.join(', ')
    return `${basePrompt}, ${enhancements}`
  }

  public getRecommendedModel(imageType: string): AIModel | null {
    const type = imageType.toLowerCase()
    
    if (type.includes('anime') || type.includes('cartoon')) {
      return this.getModelById('anime') || null
    } else if (type.includes('art') || type.includes('painting')) {
      return this.getModelById('artistic') || null
    } else if (type.includes('photo') || type.includes('portrait')) {
      return this.getModelById('photography') || null
    } else if (type.includes('abstract') || type.includes('concept')) {
      return this.getModelById('abstract') || null
    } else {
      return this.getModelById('sdxl') || null // Default to SDXL
    }
  }
}

export const advancedAiService = new AdvancedAIService()
export default advancedAiService 