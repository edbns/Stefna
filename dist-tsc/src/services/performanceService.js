// Performance Monitoring Service for Stefna
// Tracks app performance, errors, and user analytics
class PerformanceService {
    constructor() {
        Object.defineProperty(this, "sessionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sessionStart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "metrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "errors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "events", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "isInitialized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.initialize();
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    initialize() {
        if (this.isInitialized)
            return;
        // Track page load performance
        this.trackPageLoad();
        // Track user interactions
        this.trackUserInteractions();
        // Track errors
        this.trackErrors();
        // Track memory usage
        this.trackMemoryUsage();
        // Track network performance
        this.trackNetworkPerformance();
        this.isInitialized = true;
    }
    trackPageLoad() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, 'ms', 'load');
                    this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms', 'load');
                    this.recordMetric('first_paint', performance.getEntriesByName('first-paint')[0]?.startTime || 0, 'ms', 'render');
                    this.recordMetric('first_contentful_paint', performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0, 'ms', 'render');
                }
            });
        }
    }
    trackUserInteractions() {
        // Track button clicks
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON' || target.closest('button')) {
                this.trackEvent('button_click', {
                    buttonText: target.textContent?.trim() || 'Unknown',
                    buttonType: target.getAttribute('type') || 'button',
                    location: window.location.pathname
                });
            }
        });
        // Track navigation
        let lastUrl = window.location.href;
        const observer = new MutationObserver(() => {
            if (window.location.href !== lastUrl) {
                this.trackEvent('navigation', {
                    from: lastUrl,
                    to: window.location.href
                });
                lastUrl = window.location.href;
            }
        });
        observer.observe(document, { subtree: true, childList: true });
    }
    trackErrors() {
        // Track JavaScript errors
        window.addEventListener('error', (e) => {
            this.recordError({
                message: e.message,
                stack: e.error?.stack,
                component: this.getComponentFromStack(e.error?.stack),
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });
        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.recordError({
                message: e.reason?.message || 'Unhandled Promise Rejection',
                stack: e.reason?.stack,
                component: this.getComponentFromStack(e.reason?.stack),
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });
    }
    trackMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            setInterval(() => {
                this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, 'MB', 'load');
                this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024, 'MB', 'load');
                this.recordMetric('memory_limit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB', 'load');
            }, 30000); // Every 30 seconds
        }
    }
    trackNetworkPerformance() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection) {
                this.recordMetric('network_effective_type', connection.effectiveType === '4g' ? 4 : 3, 'level', 'load');
                this.recordMetric('network_downlink', connection.downlink, 'Mbps', 'load');
                this.recordMetric('network_rtt', connection.rtt, 'ms', 'load');
            }
        }
    }
    getComponentFromStack(stack) {
        if (!stack)
            return 'Unknown';
        const lines = stack.split('\n');
        for (const line of lines) {
            if (line.includes('src/components/') || line.includes('src/screens/')) {
                const match = line.match(/src\/(components|screens)\/([^/]+)/);
                return match ? match[2] : 'Unknown';
            }
        }
        return 'Unknown';
    }
    recordMetric(name, value, unit, category) {
        const metric = {
            name,
            value,
            unit,
            timestamp: Date.now(),
            category
        };
        this.metrics.push(metric);
        // Keep only last 1000 metrics
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Metric: ${name} = ${value}${unit}`);
        }
    }
    recordError(error) {
        this.errors.push(error);
        // Keep only last 100 errors
        if (this.errors.length > 100) {
            this.errors = this.errors.slice(-100);
        }
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('🚨 Error:', error.message, error.stack);
        }
    }
    trackEvent(event, properties = {}) {
        const userEvent = {
            event,
            properties,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };
        this.events.push(userEvent);
        // Keep only last 1000 events
        if (this.events.length > 1000) {
            this.events = this.events.slice(-1000);
        }
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`📈 Event: ${event}`, properties);
        }
    }
    getPerformanceData() {
        return {
            metrics: [...this.metrics],
            errors: [...this.errors],
            events: [...this.events],
            sessionStart: this.sessionStart,
            sessionId: this.sessionId
        };
    }
    getSessionDuration() {
        return Date.now() - this.sessionStart;
    }
    getErrorRate() {
        const sessionDuration = this.getSessionDuration() / 1000 / 60; // minutes
        return this.errors.length / sessionDuration;
    }
    getAverageMetric(name) {
        const relevantMetrics = this.metrics.filter(m => m.name === name);
        if (relevantMetrics.length === 0)
            return 0;
        const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
        return sum / relevantMetrics.length;
    }
    getMetricTrend(name) {
        const relevantMetrics = this.metrics.filter(m => m.name === name);
        if (relevantMetrics.length < 10)
            return 'stable';
        const recent = relevantMetrics.slice(-5);
        const older = relevantMetrics.slice(-10, -5);
        const recentAvg = recent.reduce((acc, m) => acc + m.value, 0) / recent.length;
        const olderAvg = older.reduce((acc, m) => acc + m.value, 0) / older.length;
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (change < -10)
            return 'improving';
        if (change > 10)
            return 'degrading';
        return 'stable';
    }
    async sendToAnalytics() {
        const data = this.getPerformanceData();
        try {
            // In a real app, you'd send this to your analytics service
            // For now, we'll just log it
            console.log('📊 Performance Data:', data);
            // Clear old data after sending
            this.metrics = this.metrics.slice(-100);
            this.errors = this.errors.slice(-10);
            this.events = this.events.slice(-100);
        }
        catch (error) {
            console.error('Failed to send performance data:', error);
        }
    }
    startTimer(name) {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.recordMetric(`${name}_duration`, duration, 'ms', 'interaction');
        };
    }
    measureAsync(name, fn) {
        const stopTimer = this.startTimer(name);
        return fn().finally(stopTimer);
    }
}
export const performanceService = new PerformanceService();
export default performanceService;
