// Structured Logger with Run ID Context
// One place for all generation logging

interface LogContext {
  runId?: string
  step?: string
  userId?: string
  presetId?: string
  mode?: string
  [key: string]: any
}

class Logger {
  private context: LogContext = {}

  // Create child logger with additional context
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger()
    childLogger.context = { ...this.context, ...additionalContext }
    return childLogger
  }

  // Set persistent context
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }

  // Clear context
  clearContext(): void {
    this.context = {}
  }

  private formatMessage(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const contextStr = Object.keys(this.context).length > 0 
      ? ` [${Object.entries(this.context).map(([k, v]) => `${k}:${v}`).join(', ')}]`
      : ''
    
    const logMessage = `${timestamp} ${level}${contextStr} ${message}`
    
    if (data) {
      console.log(logMessage, data)
    } else {
      console.log(logMessage)
    }
  }

  info(message: string, data?: any): void {
    this.formatMessage('INFO', message, data)
  }

  warn(message: string, data?: any): void {
    this.formatMessage('WARN', message, data)
  }

  error(message: string, data?: any): void {
    this.formatMessage('ERROR', message, data)
  }

  debug(message: string, data?: any): void {
    if (import.meta.env.DEV) {
      this.formatMessage('DEBUG', message, data)
    }
  }

  // Special methods for generation pipeline
  generationStart(runId: string, mode: string, presetId: string): Logger {
    return this.child({ runId, step: 'start', mode, presetId })
  }

  generationStep(step: string): Logger {
    return this.child({ ...this.context, step })
  }

  generationComplete(success: boolean, duration?: number): void {
    this.info(`Generation ${success ? 'completed' : 'failed'}`, { 
      duration: duration ? `${duration}ms` : undefined 
    })
  }
}

// Export singleton logger
export const logger = new Logger()

// Export logger factory for components
export function createLogger(initialContext?: LogContext): Logger {
  const componentLogger = new Logger()
  if (initialContext) {
    componentLogger.setContext(initialContext)
  }
  return componentLogger
}
