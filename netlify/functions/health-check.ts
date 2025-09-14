import type { Handler } from "@netlify/functions";
import { json } from './_lib/http';
import { performHealthChecks } from './_lib/healthCheck';

// ============================================================================
// REAL SYSTEM HEALTH CHECK
// ============================================================================
// This function performs actual health checks on all services
// - Tests database connectivity with real queries
// - Tests API endpoints with actual requests
// - Measures response times
// - Returns detailed health status
// ============================================================================

const healthCheckHandler: Handler = async (event) => {
  const startTime = Date.now();
  
  console.log('🔍 [Health Check] Starting comprehensive health checks...');
  
  try {
    // Use shared health check logic
    const healthData = await performHealthChecks();
    const totalTime = Date.now() - startTime;
    
    return json({
      overallStatus: healthData.overallStatus,
      timestamp: new Date().toISOString(),
      totalCheckTime: totalTime,
      summary: healthData.summary,
      services: healthData.results
    });
  } catch (error: any) {
    console.error('❌ [Health Check] Failed:', error);
    
    return json({ 
      overallStatus: 'unhealthy',
      timestamp: new Date().toISOString(),
      totalCheckTime: Date.now() - startTime,
      summary: {
        healthy: 0,
        degraded: 0,
        unhealthy: 1,
        total: 1
      },
      services: [{
        service: 'health_check',
        status: 'unhealthy',
        error: error.message || 'Health check failed'
      }],
      error: error.message || 'Health check system failed'
    }, 500);
  }
};

export { healthCheckHandler as handler };