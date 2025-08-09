// Caption Service for AI-powered social media captions
// This service generates engaging captions and hashtags for photos

export interface CaptionData {
  caption: string
  hashtags: string[]
  platform: 'instagram' | 'x' | 'whatsapp' | 'telegram' | 'tiktok'
  style: 'casual' | 'professional' | 'trendy' | 'artistic'
}

export interface CaptionRequest {
  prompt: string
  imageDescription?: string
  platform: 'instagram' | 'x' | 'whatsapp' | 'telegram' | 'tiktok'
  style: 'casual' | 'professional' | 'trendy' | 'artistic'
}

class CaptionService {
  private readonly hashtagTemplates = {
    instagram: [
      '#AIArt', '#DigitalArt', '#CreativeAI', '#StefnaApp', '#AIPhotography',
      '#ArtisticAI', '#CreativeProcess', '#DigitalCreation', '#AIGenerated',
      '#ModernArt', '#TechArt', '#Innovation', '#Creativity', '#ArtCommunity'
    ],
    x: [
      '#AIArt', '#DigitalArt', '#CreativeAI', '#StefnaApp', '#AIPhotography',
      '#ArtisticAI', '#CreativeProcess', '#DigitalCreation', '#AIGenerated'
    ],
    whatsapp: [
      '#AIArt', '#DigitalArt', '#CreativeAI', '#StefnaApp', '#AIPhotography'
    ],
    telegram: [
      '#AIArt', '#DigitalArt', '#CreativeAI', '#StefnaApp', '#AIPhotography'
    ],
    tiktok: [
      '#AIArt', '#DigitalArt', '#CreativeAI', '#StefnaApp', '#AIPhotography',
      '#ArtisticAI', '#CreativeProcess', '#DigitalCreation', '#AIGenerated',
      '#FYP', '#Trending', '#Viral', '#Creative', '#Art'
    ]
  }

  private readonly captionTemplates = {
    casual: [
      "Just created this with AI!",
      "AI magic at work! What do you think?",
      "Stefna made this possible! AI art is incredible",
      "From photo to art in seconds! AI is wild",
      "This AI filter is everything!"
    ],
    professional: [
      "Exploring the intersection of photography and AI-generated art.",
      "AI-enhanced photography: pushing creative boundaries.",
      "Digital transformation through AI-powered artistic filters.",
      "Innovative approach to visual storytelling with AI.",
      "Bridging traditional photography with AI-generated aesthetics."
    ],
    trendy: [
      "This AI filter is giving main character energy",
      "Stefna really said 'let's make art' and I'm here for it",
      "AI art is the future and the future is now!",
      "This prompt is everything! AI creativity is unmatched",
      "Who else is obsessed with AI-generated art?"
    ],
    artistic: [
      "Where technology meets creativity",
      "AI as a brush, imagination as the canvas",
      "Digital alchemy: transforming reality through AI",
      "The future of artistic expression is here",
      "AI-generated art: a new form of human creativity"
    ]
  }

  public generateCaption(request: CaptionRequest): CaptionData {
    const { prompt, platform, style } = request
    
    // Generate base caption
    const baseCaption = this.generateBaseCaption(prompt, style)
    
    // Generate relevant hashtags
    const hashtags = this.generateHashtags(prompt, platform)
    
    // Combine caption with hashtags
    const fullCaption = this.formatCaption(baseCaption, hashtags, platform)
    
    return {
      caption: fullCaption,
      hashtags,
      platform,
      style
    }
  }

  private generateBaseCaption(prompt: string, style: string): string {
    const templates = this.captionTemplates[style as keyof typeof this.captionTemplates] || this.captionTemplates.casual
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
    
    // Extract style keywords from prompt
    const styleKeywords = this.extractStyleKeywords(prompt)
    
    if (styleKeywords.length > 0) {
      return `${randomTemplate}\n\nApplied: ${styleKeywords.join(', ')}`
    }
    
    return randomTemplate
  }

  private extractStyleKeywords(prompt: string): string[] {
    const keywords = []
    const promptLower = prompt.toLowerCase()
    
    if (promptLower.includes('anime')) keywords.push('Anime Style')
    if (promptLower.includes('oil painting')) keywords.push('Oil Painting')
    if (promptLower.includes('watercolor')) keywords.push('Watercolor')
    if (promptLower.includes('cyberpunk')) keywords.push('Cyberpunk')
    if (promptLower.includes('vintage')) keywords.push('Vintage')
    if (promptLower.includes('fantasy')) keywords.push('Fantasy')
    if (promptLower.includes('artistic')) keywords.push('Artistic')
    if (promptLower.includes('sci-fi')) keywords.push('Sci-Fi')
    
    return keywords
  }

  private generateHashtags(prompt: string, platform: string): string[] {
    const baseHashtags = this.hashtagTemplates[platform as keyof typeof this.hashtagTemplates] || this.hashtagTemplates.instagram
    const styleHashtags = this.getStyleHashtags(prompt)
    
    // Combine and limit hashtags based on platform
    const allHashtags = [...baseHashtags, ...styleHashtags]
    const maxHashtags = platform === 'instagram' ? 15 : platform === 'twitter' ? 8 : 10
    
    return allHashtags.slice(0, maxHashtags)
  }

  private getStyleHashtags(prompt: string): string[] {
    const promptLower = prompt.toLowerCase()
    const hashtags = []
    
    if (promptLower.includes('anime')) hashtags.push('#AnimeArt', '#AnimeStyle')
    if (promptLower.includes('oil painting')) hashtags.push('#OilPainting', '#ClassicalArt')
    if (promptLower.includes('watercolor')) hashtags.push('#Watercolor', '#SoftArt')
    if (promptLower.includes('cyberpunk')) hashtags.push('#Cyberpunk', '#Futuristic')
    if (promptLower.includes('vintage')) hashtags.push('#Vintage', '#Retro')
    if (promptLower.includes('fantasy')) hashtags.push('#Fantasy', '#Magical')
    if (promptLower.includes('artistic')) hashtags.push('#Artistic', '#Creative')
    if (promptLower.includes('sci-fi')) hashtags.push('#SciFi', '#Futuristic')
    
    return hashtags
  }

  private formatCaption(caption: string, hashtags: string[], platform: string): string {
    const hashtagString = hashtags.join(' ')
    
    switch (platform) {
      case 'instagram':
        return `${caption}\n\n${hashtagString}`
      case 'twitter':
        // Twitter has character limit, be more concise
        return `${caption}\n\n${hashtags.slice(0, 5).join(' ')}`
      case 'tiktok':
        return `${caption}\n\n${hashtagString}`
      default:
        return `${caption}\n\n${hashtagString}`
    }
  }

  public generateMultipleCaptions(request: CaptionRequest): CaptionData[] {
    const styles: Array<'casual' | 'professional' | 'trendy' | 'artistic'> = ['casual', 'professional', 'trendy', 'artistic']
    
    return styles.map(style => 
      this.generateCaption({ ...request, style })
    )
  }
}

export const captionService = new CaptionService()
export default captionService 