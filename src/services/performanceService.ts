// Performance Monitoring Service for Stefna
// Tracks app performance, errors, and user analytics

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  category: 'load' | 'render' | 'interaction' | 'error'
}

export interface ErrorReport {
  message: string
  stack?: string
  component?: string
  timestamp: number
  userAgent: string
  url: string
}

export interface UserEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
  sessionId: string
}

export interface PerformanceData {
  metrics: PerformanceMetric[]
  errors: ErrorReport[]
  events: UserEvent[]
  sessionStart: number
  sessionId: string
}

class PerformanceService {
  private sessionId: string
  private sessionStart: number
  private metrics: PerformanceMetric[] = []
  private errors: ErrorReport[] = []
  private events: UserEvent[] = []
  private isInitialized = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStart = Date.now()
    this.initialize()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initialize() {
    if (this.isInitialized) return

    // Track page load performance
    this.trackPageLoad()
    
    // Track user interactions
    this.trackUserInteractions()
    
    // Track errors
    this.trackErrors()
    
    // Track memory usage
    this.trackMemoryUsage()
    
    // Track network performance
    this.trackNetworkPerformance()

    this.isInitialized = true
  }

  private trackPageLoad() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, 'ms', 'load')
          this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms', 'load')
          this.recordMetric('first_paint', performance.getEntriesByName('first-paint')[0]?.startTime || 0, 'ms', 'render')
          this.recordMetric('first_contentful_paint', performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0, 'ms', 'render')
        }
      })
    }
  }

  private trackUserInteractions() {
    // Track button clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        this.trackEvent('button_click', {
          buttonText: target.textContent?.trim() || 'Unknown',
          buttonType: target.getAttribute('type') || 'button',
          location: window.location.pathname
        })
      }
    })

    // Track navigation
    let lastUrl = window.location.href
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        this.trackEvent('navigation', {
          from: lastUrl,
          to: window.location.href
        })
        lastUrl = window.location.href
      }
    })
    observer.observe(document, { subtree: true, childList: true })
  }

  private trackErrors() {
    // Track JavaScript errors
    window.addEventListener('error', (e) => {
      this.recordError({
        message: e.message,
        stack: e.error?.stack,
        component: this.getComponentFromStack(e.error?.stack),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.recordError({
        message: e.reason?.message || 'Unhandled Promise Rejection',
        stack: e.reason?.stack,
        component: this.getComponentFromStack(e.reason?.stack),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    })
  }

  private trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      setInterval(() => {
        this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, 'MB', 'load')
        this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024, 'MB', 'load')
        this.recordMetric('memory_limit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB', 'load')
      }, 30000) // Every 30 seconds
    }
  }

  private trackNetworkPerformance() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        this.recordMetric('network_effective_type', connection.effectiveType === '4g' ? 4 : 3, 'level', 'load')
        this.recordMetric('network_downlink', connection.downlink, 'Mbps', 'load')
        this.recordMetric('network_rtt', connection.rtt, 'ms', 'load')
      }
    }
  }

  private getComponentFromStack(stack?: string): string {
    if (!stack) return 'Unknown'
    
    const lines = stack.split('\n')
    for (const line of lines) {
      if (line.includes('src/components/') || line.includes('src/screens/')) {
        const match = line.match(/src\/(components|screens)\/([^/]+)/)
        return match ? match[2] : 'Unknown'
      }
    }
    return 'Unknown'
  }

  public recordMetric(name: string, value: number, unit: string, category: PerformanceMetric['category']) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      category
    }
    
    this.metrics.push(metric)
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Metric: ${name} = ${value}${unit}`)
    }
  }

  public recordError(error: ErrorReport) {
    this.errors.push(error)
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100)
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error:', error.message, error.stack)
    }
  }

  public trackEvent(event: string, properties: Record<string, any> = {}) {
    const userEvent: UserEvent = {
      event,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId
    }
    
    this.events.push(userEvent)
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Event: ${event}`, properties)
    }
  }

  public getPerformanceData(): PerformanceData {
    return {
      metrics: [...this.metrics],
      errors: [...this.errors],
      events: [...this.events],
      sessionStart: this.sessionStart,
      sessionId: this.sessionId
    }
  }

  public getSessionDuration(): number {
    return Date.now() - this.sessionStart
  }

  public getErrorRate(): number {
    const sessionDuration = this.getSessionDuration() / 1000 / 60 // minutes
    return this.errors.length / sessionDuration
  }

  public getAverageMetric(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name)
    if (relevantMetrics.length === 0) return 0
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0)
    return sum / relevantMetrics.length
  }

  public getMetricTrend(name: string): 'improving' | 'stable' | 'degrading' {
    const relevantMetrics = this.metrics.filter(m => m.name === name)
    if (relevantMetrics.length < 10) return 'stable'
    
    const recent = relevantMetrics.slice(-5)
    const older = relevantMetrics.slice(-10, -5)
    
    const recentAvg = recent.reduce((acc, m) => acc + m.value, 0) / recent.length
    const olderAvg = older.reduce((acc, m) => acc + m.value, 0) / older.length
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100
    
    if (change < -10) return 'improving'
    if (change > 10) return 'degrading'
    return 'stable'
  }

  public async sendToAnalytics() {
    const data = this.getPerformanceData()
    
    try {
      // In a real app, you'd send this to your analytics service
      // For now, we'll just log it
      console.log('📊 Performance Data:', data)
      
      // Clear old data after sending
      this.metrics = this.metrics.slice(-100)
      this.errors = this.errors.slice(-10)
      this.events = this.events.slice(-100)
    } catch (error) {
      console.error('Failed to send performance data:', error)
    }
  }

  public startTimer(name: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(`${name}_duration`, duration, 'ms', 'interaction')
    }
  }

  public measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const stopTimer = this.startTimer(name)
    return fn().finally(stopTimer)
  }
}

export const performanceService = new PerformanceService()
export default performanceService 