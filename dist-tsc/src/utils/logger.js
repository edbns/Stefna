// Structured Logger with Run ID Context
// One place for all generation logging
class Logger {
    constructor() {
        Object.defineProperty(this, "context", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
    }
    // Create child logger with additional context
    child(additionalContext) {
        const childLogger = new Logger();
        childLogger.context = { ...this.context, ...additionalContext };
        return childLogger;
    }
    // Set persistent context
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
    // Clear context
    clearContext() {
        this.context = {};
    }
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(this.context).length > 0
            ? ` [${Object.entries(this.context).map(([k, v]) => `${k}:${v}`).join(', ')}]`
            : '';
        const logMessage = `${timestamp} ${level}${contextStr} ${message}`;
        if (data) {
            console.log(logMessage, data);
        }
        else {
            console.log(logMessage);
        }
    }
    info(message, data) {
        this.formatMessage('INFO', message, data);
    }
    warn(message, data) {
        this.formatMessage('WARN', message, data);
    }
    error(message, data) {
        this.formatMessage('ERROR', message, data);
    }
    debug(message, data) {
        if (process.env.NODE_ENV === 'development') {
            this.formatMessage('DEBUG', message, data);
        }
    }
    // Special methods for generation pipeline
    generationStart(runId, mode, presetId) {
        return this.child({ runId, step: 'start', mode, presetId });
    }
    generationStep(step) {
        return this.child({ ...this.context, step });
    }
    generationComplete(success, duration) {
        this.info(`Generation ${success ? 'completed' : 'failed'}`, {
            duration: duration ? `${duration}ms` : undefined
        });
    }
}
// Export singleton logger
export const logger = new Logger();
// Export logger factory for components
export function createLogger(initialContext) {
    const componentLogger = new Logger();
    if (initialContext) {
        componentLogger.setContext(initialContext);
    }
    return componentLogger;
}
