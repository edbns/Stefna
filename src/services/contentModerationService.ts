// Content Moderation Service
// Handles inappropriate content detection for prompts and generated media

export interface ModerationResult {
  isAppropriate: boolean
  reason?: string
  confidence: number
  flaggedCategories: string[]
  suggestedAction: 'allow' | 'block' | 'review'
}

export interface ContentReport {
  id: string
  reporterId: string
  contentId: string
  contentType: 'prompt' | 'image' | 'video'
  reason: string
  timestamp: string
  status: 'pending' | 'reviewed' | 'resolved'
  moderatorNotes?: string
}

export enum InappropriateCategories {
  VIOLENCE = 'violence',
  HATE_SPEECH = 'hate_speech',
  SEXUAL_CONTENT = 'sexual_content',
  DRUGS = 'drugs',
  SELF_HARM = 'self_harm',
  HARASSMENT = 'harassment',
  COPYRIGHT = 'copyright',
  SPAM = 'spam'
}

class ContentModerationService {
  private static instance: ContentModerationService
  
  // Inappropriate keywords and patterns
  private inappropriateKeywords: Map<InappropriateCategories, string[]> = new Map([
    [InappropriateCategories.VIOLENCE, [
      'kill', 'murder', 'blood', 'gore', 'weapon', 'gun', 'bomb', 'explosion',
      'violence', 'fight', 'attack', 'assault', 'torture', 'death', 'dead'
    ]],
    [InappropriateCategories.HATE_SPEECH, [
      'hate', 'racist', 'discrimination', 'bigot', 'slur', 'offensive',
      'discriminatory', 'prejudice', 'bias', 'intolerance'
    ]],
    [InappropriateCategories.SEXUAL_CONTENT, [
      'nude', 'naked', 'porn', 'sexual', 'explicit', 'adult', 'mature',
      'intimate', 'provocative', 'suggestive', 'erotic'
    ]],
    [InappropriateCategories.DRUGS, [
      'drug', 'cocaine', 'heroin', 'meth', 'weed', 'marijuana', 'illegal',
      'substance', 'abuse', 'overdose', 'injection'
    ]],
    [InappropriateCategories.SELF_HARM, [
      'suicide', 'self-harm', 'cut', 'bleed', 'hurt myself', 'end life',
      'die', 'death wish', 'self injury'
    ]],
    [InappropriateCategories.HARASSMENT, [
      'harass', 'bully', 'stalk', 'threaten', 'intimidate', 'abuse',
      'cyberbully', 'troll', 'hate speech'
    ]],
    [InappropriateCategories.COPYRIGHT, [
      'copyright', 'trademark', 'brand', 'logo', 'disney', 'marvel',
      'nintendo', 'sony', 'warner', 'universal'
    ]],
    [InappropriateCategories.SPAM, [
      'buy now', 'click here', 'free money', 'get rich', 'make money fast',
      'lottery', 'prize', 'winner', 'urgent', 'limited time'
    ]]
  ])

  // Suspicious patterns that require review
  private suspiciousPatterns: RegExp[] = [
    /\b\d{3}-\d{3}-\d{4}\b/, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
    /\bhttps?:\/\/[^\s]+\b/, // URLs
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
  ]

  static getInstance(): ContentModerationService {
    if (!ContentModerationService.instance) {
      ContentModerationService.instance = new ContentModerationService()
    }
    return ContentModerationService.instance
  }

  // Check if a prompt is appropriate
  async checkPrompt(prompt: string): Promise<ModerationResult> {
    const lowerPrompt = prompt.toLowerCase()
    const flaggedCategories: string[] = []
    let confidence = 0
    let totalChecks = 0

    // Check for inappropriate keywords
    for (const [category, keywords] of this.inappropriateKeywords) {
      const matches = keywords.filter(keyword => 
        lowerPrompt.includes(keyword.toLowerCase())
      )
      
      if (matches.length > 0) {
        flaggedCategories.push(category)
        confidence += matches.length * 0.3
        totalChecks++
      }
    }

    // Check for suspicious patterns
    const suspiciousMatches = this.suspiciousPatterns.filter(pattern => 
      pattern.test(prompt)
    )
    
    if (suspiciousMatches.length > 0) {
      flaggedCategories.push('suspicious_patterns')
      confidence += suspiciousMatches.length * 0.2
      totalChecks++
    }

    // Calculate final confidence
    const finalConfidence = totalChecks > 0 ? Math.min(confidence, 1.0) : 0

    // Determine if content is appropriate
    const isAppropriate = finalConfidence < 0.5
    const suggestedAction = this.getSuggestedAction(finalConfidence, flaggedCategories)

    return {
      isAppropriate,
      confidence: finalConfidence,
      flaggedCategories,
      suggestedAction,
      reason: flaggedCategories.length > 0 
        ? `Content flagged for: ${flaggedCategories.join(', ')}`
        : undefined
    }
  }

  // Check if generated content is appropriate (for future AI integration)
  async checkGeneratedContent(contentUrl: string, contentType: 'image' | 'video'): Promise<ModerationResult> {
    // TODO: Integrate with AI content moderation API (e.g., Google Cloud Vision API, AWS Rekognition)
    // For now, return a basic check
    
    try {
      // Simulate AI content analysis
      const analysis = await this.simulateAIContentAnalysis(contentUrl, contentType)
      
      return {
        isAppropriate: analysis.isAppropriate,
        confidence: analysis.confidence,
        flaggedCategories: analysis.flaggedCategories,
        suggestedAction: analysis.suggestedAction,
        reason: analysis.reason
      }
    } catch (error) {
      console.error('Content moderation error:', error)
      return {
        isAppropriate: true, // Default to allow if analysis fails
        confidence: 0.1,
        flaggedCategories: [],
        suggestedAction: 'review',
        reason: 'Content analysis failed, manual review recommended'
      }
    }
  }



  // Get suggested action based on confidence and categories
  private getSuggestedAction(confidence: number, categories: string[]): 'allow' | 'block' | 'review' {
    if (confidence >= 0.8) {
      return 'block'
    } else if (confidence >= 0.5) {
      return 'review'
    } else {
      return 'allow'
    }
  }

  // Report inappropriate content
  async reportContent(report: Omit<ContentReport, 'id' | 'timestamp' | 'status'>): Promise<{ success: boolean; reportId?: string }> {
    try {
      const fullReport: ContentReport = {
        ...report,
        id: this.generateReportId(),
        timestamp: new Date().toISOString(),
        status: 'pending'
      }

      // Save report to storage (in production, save to database)
      this.saveReport(fullReport)

      // Notify moderators (in production, send to moderation queue)
      this.notifyModerators(fullReport)

      return { success: true, reportId: fullReport.id }
    } catch (error) {
      console.error('Failed to report content:', error)
      return { success: false }
    }
  }

  // Get reports for moderation
  async getReports(status?: 'pending' | 'reviewed' | 'resolved'): Promise<ContentReport[]> {
    const reports = this.loadReports()
    return status ? reports.filter(r => r.status === status) : reports
  }

  // Update report status
  async updateReportStatus(reportId: string, status: 'reviewed' | 'resolved', notes?: string): Promise<boolean> {
    try {
      const reports = this.loadReports()
      const reportIndex = reports.findIndex(r => r.id === reportId)
      
      if (reportIndex === -1) {
        return false
      }

      reports[reportIndex].status = status
      reports[reportIndex].moderatorNotes = notes
      
      this.saveReports(reports)
      return true
    } catch (error) {
      console.error('Failed to update report status:', error)
      return false
    }
  }

  // Generate unique report ID
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Save report to localStorage (in production, save to database)
  private saveReport(report: ContentReport): void {
    const reports = this.loadReports()
    reports.push(report)
    localStorage.setItem('content_reports', JSON.stringify(reports))
  }

  // Load reports from localStorage
  private loadReports(): ContentReport[] {
    const saved = localStorage.getItem('content_reports')
    return saved ? JSON.parse(saved) : []
  }

  // Save all reports
  private saveReports(reports: ContentReport[]): void {
    localStorage.setItem('content_reports', JSON.stringify(reports))
  }

  // Notify moderators (in production, send to moderation queue)
  private notifyModerators(report: ContentReport): void {
    console.log('New content report:', report)
    // TODO: Send to moderation queue or notification system
  }

  // Get moderation statistics
  getModerationStats(): {
    totalReports: number
    pendingReports: number
    resolvedReports: number
    blockedContent: number
  } {
    const reports = this.loadReports()
    const pending = reports.filter(r => r.status === 'pending').length
    const resolved = reports.filter(r => r.status === 'resolved').length
    
    return {
      totalReports: reports.length,
      pendingReports: pending,
      resolvedReports: resolved,
      blockedContent: reports.filter(r => r.status === 'resolved').length
    }
  }
}

export default ContentModerationService.getInstance() 