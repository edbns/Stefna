// AIML Model Service - Manages 200+ AI models from AIML API
// Provides model discovery, categorization, and optimal configurations

export interface AIMLModel {
  id: string
  name: string
  description: string
  category: AIMLModelCategory
  subcategory?: string
  capabilities: AIMLCapability[]
  cost: number // tokens per generation
  maxResolution: string
  aspectRatios: string[]
  features: string[]
  tags: string[]
  isPremium?: boolean
  isExperimental?: boolean
  recommendedFor?: string[]
  examplePrompts?: string[]
}

export type AIMLModelCategory = 
  | 'art' 
  | 'photography' 
  | 'anime' 
  | 'realistic' 
  | 'abstract' 
  | 'portrait' 
  | 'landscape' 
  | 'concept-art' 
  | '3d' 
  | 'texture' 
  | 'logo' 
  | 'icon' 
  | 'comic' 
  | 'sketch' 
  | 'painting' 
  | 'digital-art' 
  | 'fantasy' 
  | 'sci-fi' 
  | 'nature' 
  | 'architecture' 
  | 'fashion' 
  | 'food' 
  | 'product' 
  | 'medical' 
  | 'educational'

export type AIMLCapability = 'text-to-image' | 'image-to-image' | 'video-to-video' | 'text-to-video' | 'image-to-video';

export interface ModelConfig {
  modelId: string
  prompt: string
  negativePrompt?: string
  steps?: number
  guidanceScale?: number
  width?: number
  height?: number
  seed?: number
  sampler?: string
  cfgScale?: number
  clipSkip?: number
  loraStrength?: number
  loraModel?: string
}

class AIMLModelService {
  private static instance: AIMLModelService
  private models: AIMLModel[] = []
  private modelCache: Map<string, AIMLModel> = new Map()

  static getInstance(): AIMLModelService {
    if (!AIMLModelService.instance) {
      AIMLModelService.instance = new AIMLModelService()
    }
    return AIMLModelService.instance
  }

  constructor() {
    try {
      this.initializeModels()
    } catch (error) {
      console.error('Error initializing AIMLModelService:', error)
      // Don't throw from constructor to prevent "ii is not a constructor" errors
      this.models = [] // Fallback to empty models array
    }
  }

  // Initialize with popular AIML models
  private initializeModels(): void {
    this.models = [
      // Realistic & Photography Models
      {
        id: 'sdxl',
        name: 'Stable Diffusion XL',
        description: 'High-quality realistic and artistic images with exceptional detail',
        category: 'realistic',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 2,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2', '16:9', '9:16'],
        features: ['photorealistic', 'artistic', 'detailed', 'high-quality'],
        tags: ['realistic', 'photography', 'detailed', 'professional'],
        recommendedFor: ['portraits', 'landscapes', 'product photography'],
        examplePrompts: ['Professional portrait of a business person', 'Stunning landscape photography']
      },
      {
        id: 'sdxl-turbo',
        name: 'SDXL Turbo',
        description: 'Fast generation with good quality for rapid prototyping',
        category: 'realistic',
        capabilities: ['text-to-image'],
        cost: 1,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2'],
        features: ['fast', 'realistic', 'prototyping'],
        tags: ['fast', 'realistic', 'prototype'],
        recommendedFor: ['quick concepts', 'iterations', 'prototyping']
      },
      {
        id: 'realistic-vision',
        name: 'Realistic Vision',
        description: 'Ultra-realistic photography with natural lighting',
        category: 'photography',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 2,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2', '16:9'],
        features: ['photorealistic', 'natural-lighting', 'professional'],
        tags: ['realistic', 'photography', 'natural'],
        recommendedFor: ['portraits', 'product shots', 'real estate']
      },

      // Image-to-Image Models
      {
        id: 'i2i-dev',
        name: 'Flux Dev I2I',
        description: 'Free development model for image-to-image transformations',
        category: 'art',
        capabilities: ['image-to-image'],
        cost: 2,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2', '16:9', '9:16'],
        features: ['image-transformation', 'style-transfer', 'free-tier'],
        tags: ['i2i', 'transformation', 'free', 'development'],
        recommendedFor: ['style transfers', 'image editing', 'prototyping'],
        examplePrompts: ['Transform this photo into a painting', 'Apply anime style to this image']
      },
      {
        id: 'i2i-pro',
        name: 'Flux Pro I2I',
        description: 'Professional image-to-image model with advanced capabilities',
        category: 'art',
        capabilities: ['image-to-image'],
        cost: 3,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2', '16:9', '9:16'],
        features: ['high-quality', 'advanced-transformation', 'professional'],
        tags: ['i2i', 'transformation', 'professional', 'high-quality'],
        recommendedFor: ['professional editing', 'high-quality transformations'],
        examplePrompts: ['Professional photo enhancement', 'Artistic style transfer']
      },
      {
        id: 'i2i-max',
        name: 'Flux Max I2I',
        description: 'Maximum quality image-to-image model for premium results',
        category: 'art',
        capabilities: ['image-to-image'],
        cost: 4,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2', '16:9', '9:16'],
        features: ['maximum-quality', 'premium', 'advanced'],
        tags: ['i2i', 'transformation', 'premium', 'maximum-quality'],
        recommendedFor: ['premium projects', 'maximum quality results'],
        examplePrompts: ['Ultra-high quality transformation', 'Premium artistic style']
      },

      // Video-to-Video Models
      {
        id: 'v2v-dev',
        name: 'Flux Dev V2V',
        description: 'Free development model for video-to-video transformations',
        category: 'art',
        capabilities: ['video-to-video'],
        cost: 5,
        maxResolution: '1920x1080',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3'],
        features: ['video-transformation', 'style-transfer', 'free-tier'],
        tags: ['v2v', 'video', 'transformation', 'free', 'development'],
        recommendedFor: ['video style transfers', 'video editing', 'prototyping'],
        examplePrompts: ['Transform this video into anime style', 'Apply cinematic filter to video']
      },
      {
        id: 'v2v-pro',
        name: 'Flux Pro V2V',
        description: 'Professional video-to-video model with advanced capabilities',
        category: 'art',
        capabilities: ['video-to-video'],
        cost: 8,
        maxResolution: '1920x1080',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3'],
        features: ['high-quality', 'advanced-video-transformation', 'professional'],
        tags: ['v2v', 'video', 'transformation', 'professional', 'high-quality'],
        recommendedFor: ['professional video editing', 'high-quality video transformations'],
        examplePrompts: ['Professional video enhancement', 'Cinematic style transfer']
      },
      {
        id: 'v2v-max',
        name: 'Flux Max V2V',
        description: 'Maximum quality video-to-video model for premium results',
        category: 'art',
        capabilities: ['video-to-video'],
        cost: 12,
        maxResolution: '1920x1080',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3'],
        features: ['maximum-quality', 'premium', 'advanced-video'],
        tags: ['v2v', 'video', 'transformation', 'premium', 'maximum-quality'],
        recommendedFor: ['premium video projects', 'maximum quality video results'],
        examplePrompts: ['Ultra-high quality video transformation', 'Premium cinematic style']
      },

      // Anime & Manga Models
      {
        id: 'anything-v5',
        name: 'Anything V5',
        description: 'Versatile anime and manga style generation',
        category: 'anime',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 1,
        maxResolution: '768x768',
        aspectRatios: ['1:1', '4:3', '3:2'],
        features: ['anime', 'manga', 'versatile', 'colorful'],
        tags: ['anime', 'manga', 'colorful', 'versatile'],
        recommendedFor: ['anime characters', 'manga scenes', 'colorful art']
      },
      {
        id: 'counterfeit-v3',
        name: 'Counterfeit V3',
        description: 'High-quality anime style with detailed characters',
        category: 'anime',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 2,
        maxResolution: '768x768',
        aspectRatios: ['1:1', '4:3', '3:2'],
        features: ['anime', 'detailed', 'characters', 'high-quality'],
        tags: ['anime', 'detailed', 'characters'],
        recommendedFor: ['anime portraits', 'character design', 'detailed scenes']
      },

      // Artistic & Creative Models
      {
        id: 'dreamshaper',
        name: 'DreamShaper',
        description: 'Creative and artistic interpretations with dreamy aesthetics',
        category: 'art',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 1,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2'],
        features: ['artistic', 'creative', 'dreamy', 'imaginative'],
        tags: ['artistic', 'creative', 'dreamy'],
        recommendedFor: ['concept art', 'fantasy scenes', 'creative projects']
      },
      {
        id: 'deliberate',
        name: 'Deliberate',
        description: 'Intentional and controlled artistic generation',
        category: 'art',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 1,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2'],
        features: ['controlled', 'artistic', 'intentional', 'precise'],
        tags: ['controlled', 'artistic', 'precise'],
        recommendedFor: ['controlled art', 'specific styles', 'precise generation']
      },

      // Portrait Models
      {
        id: 'portraitplus',
        name: 'PortraitPlus',
        description: 'Specialized for high-quality portrait generation',
        category: 'portrait',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 2,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2'],
        features: ['portrait', 'detailed', 'professional', 'high-quality'],
        tags: ['portrait', 'detailed', 'professional'],
        recommendedFor: ['professional portraits', 'headshots', 'character portraits']
      },

      // Landscape Models
      {
        id: 'landscape-pro',
        name: 'Landscape Pro',
        description: 'Specialized for stunning landscape and nature photography',
        category: 'landscape',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 2,
        maxResolution: '1024x1024',
        aspectRatios: ['16:9', '4:3', '3:2'],
        features: ['landscape', 'nature', 'photography', 'wide'],
        tags: ['landscape', 'nature', 'photography'],
        recommendedFor: ['landscape photography', 'nature scenes', 'wide shots']
      },

      // Abstract & Conceptual Models
      {
        id: 'abstract-vision',
        name: 'Abstract Vision',
        description: 'Modern abstract and conceptual art generation',
        category: 'abstract',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 1,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2'],
        features: ['abstract', 'conceptual', 'modern', 'artistic'],
        tags: ['abstract', 'conceptual', 'modern'],
        recommendedFor: ['abstract art', 'conceptual pieces', 'modern design']
      },

      // 3D & CGI Models
      {
        id: '3d-render',
        name: '3D Render',
        description: '3D rendering and CGI-style generation',
        category: '3d',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 2,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2'],
        features: ['3d', 'cgi', 'rendering', 'realistic'],
        tags: ['3d', 'cgi', 'rendering'],
        recommendedFor: ['3D scenes', 'CGI art', 'product renders']
      },

      // Fantasy & Sci-Fi Models
      {
        id: 'fantasy-art',
        name: 'Fantasy Art',
        description: 'Fantasy and magical art generation',
        category: 'fantasy',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 1,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2'],
        features: ['fantasy', 'magical', 'artistic', 'imaginative'],
        tags: ['fantasy', 'magical', 'artistic'],
        recommendedFor: ['fantasy scenes', 'magical art', 'imaginative worlds']
      },
      {
        id: 'sci-fi-pro',
        name: 'Sci-Fi Pro',
        description: 'Science fiction and futuristic art generation',
        category: 'sci-fi',
        capabilities: ['text-to-image', 'image-to-image'],
        cost: 2,
        maxResolution: '1024x1024',
        aspectRatios: ['1:1', '4:3', '3:2', '16:9'],
        features: ['sci-fi', 'futuristic', 'technology', 'space'],
        tags: ['sci-fi', 'futuristic', 'technology'],
        recommendedFor: ['sci-fi scenes', 'futuristic art', 'technology concepts']
      }
    ]

    // Cache models for quick lookup
    this.models.forEach(model => {
      this.modelCache.set(model.id, model)
    })
  }

  // Get all available models
  getModels(): AIMLModel[] {
    return [...this.models]
  }

  // Get models by category
  getModelsByCategory(category: AIMLModelCategory): AIMLModel[] {
    return this.models.filter(model => model.category === category)
  }

  // Get model by ID
  getModelById(id: string): AIMLModel | null {
    return this.modelCache.get(id) || null
  }

  // Get models by capability
  getModelsByCapability(capability: AIMLCapability): AIMLModel[] {
    return this.models.filter(model => model.capabilities.includes(capability))
  }

  // Get recommended models for a prompt
  getRecommendedModels(prompt: string, category?: AIMLModelCategory): AIMLModel[] {
    const lowerPrompt = prompt.toLowerCase()
    const recommendations: { model: AIMLModel; score: number }[] = []

    for (const model of this.models) {
      if (category && model.category !== category) continue

      let score = 0

      // Check tags
      for (const tag of model.tags) {
        if (lowerPrompt.includes(tag.toLowerCase())) {
          score += 2
        }
      }

      // Check features
      for (const feature of model.features) {
        if (lowerPrompt.includes(feature.toLowerCase())) {
          score += 1.5
        }
      }

      // Check recommended for
      for (const recommendation of model.recommendedFor || []) {
        if (lowerPrompt.includes(recommendation.toLowerCase())) {
          score += 3
        }
      }

      if (score > 0) {
        recommendations.push({ model, score })
      }
    }

    // Sort by score and return top models
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => r.model)
  }

  // Get optimal configuration for a model
  getOptimalConfig(modelId: string, prompt: string, quality: 'standard' | 'high' = 'standard'): ModelConfig {
    const model = this.getModelById(modelId)
    if (!model) {
      throw new Error(`Model ${modelId} not found`)
    }

    const baseConfig: ModelConfig = {
      modelId,
      prompt,
      steps: quality === 'high' ? 30 : 20,
      guidanceScale: 7.5,
      width: 1024,
      height: 1024,
      sampler: 'DPM++ 2M Karras'
    }

    // Model-specific optimizations
    switch (modelId) {
      case 'sdxl':
        return {
          ...baseConfig,
          steps: quality === 'high' ? 40 : 25,
          guidanceScale: 7.5,
          width: 1024,
          height: 1024
        }
      case 'sdxl-turbo':
        return {
          ...baseConfig,
          steps: 1,
          guidanceScale: 1,
          width: 1024,
          height: 1024
        }
      case 'anything-v5':
        return {
          ...baseConfig,
          steps: quality === 'high' ? 28 : 20,
          guidanceScale: 7,
          width: 768,
          height: 768
        }
      case 'realistic-vision':
        return {
          ...baseConfig,
          steps: quality === 'high' ? 35 : 25,
          guidanceScale: 8,
          width: 1024,
          height: 1024
        }
      default:
        return baseConfig
    }
  }

  // Get model categories
  getCategories(): AIMLModelCategory[] {
    const categories = new Set<AIMLModelCategory>()
    this.models.forEach(model => categories.add(model.category))
    return Array.from(categories).sort()
  }

  // Search models by name, description, or tags
  searchModels(query: string): AIMLModel[] {
    const lowerQuery = query.toLowerCase()
    return this.models.filter(model => 
      model.name.toLowerCase().includes(lowerQuery) ||
      model.description.toLowerCase().includes(lowerQuery) ||
      model.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      model.features.some(feature => feature.toLowerCase().includes(lowerQuery))
    )
  }

  // Get trending models (based on usage or popularity)
  getTrendingModels(limit: number = 10): AIMLModel[] {
    // For now, return popular models. In production, this could be based on actual usage data
    const popularModelIds = ['sdxl', 'anything-v5', 'realistic-vision', 'dreamshaper', 'portraitplus']
    return popularModelIds
      .map(id => this.getModelById(id))
      .filter(Boolean)
      .slice(0, limit) as AIMLModel[]
  }

  // Get models suitable for a specific use case
  getModelsForUseCase(useCase: string): AIMLModel[] {
    const useCaseMap: { [key: string]: string[] } = {
      'portrait': ['portraitplus', 'realistic-vision', 'sdxl'],
      'landscape': ['landscape-pro', 'realistic-vision', 'sdxl'],
      'anime': ['anything-v5', 'counterfeit-v3'],
      'artistic': ['dreamshaper', 'deliberate', 'abstract-vision'],
      '3d': ['3d-render', 'sdxl'],
      'fantasy': ['fantasy-art', 'dreamshaper'],
      'sci-fi': ['sci-fi-pro', '3d-render'],
      'fast': ['sdxl-turbo', 'anything-v5'],
      'high-quality': ['sdxl', 'realistic-vision', 'portraitplus']
    }

    const modelIds = useCaseMap[useCase.toLowerCase()] || []
    return modelIds
      .map(id => this.getModelById(id))
      .filter(Boolean) as AIMLModel[]
  }
}

// Export the class, not the instance to prevent immediate instantiation
export default AIMLModelService
