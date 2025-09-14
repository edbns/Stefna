// Shared health check utilities
// Used by both health-check.ts and admin-config.ts

import { q } from '../_db';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: any;
}

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test database with actual query
    const result = await q('SELECT 1 as test, NOW() as timestamp');
    const responseTime = Date.now() - startTime;
    
    if (result && result.length > 0) {
      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        details: { 
          connected: true, 
          timestamp: result[0].timestamp,
          responseTime: `${responseTime}ms`
        }
      };
    } else {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        error: 'No data returned from database'
      };
    }
  } catch (error: any) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'Database connection failed'
    };
  }
}

export async function checkFalAiHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  if (!process.env.FAL_AI_API_KEY) {
    return {
      service: 'fal_ai',
      status: 'unhealthy',
      error: 'FAL_AI_API_KEY not configured'
    };
  }
  
  try {
    // Test Fal.ai with a simple API call
    const response = await fetch('https://fal.run/fal-ai/fast-sdxl', {
      method: 'GET',
      headers: {
        'Authorization': `Key ${process.env.FAL_AI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok || response.status === 405) { // 405 is OK for GET on POST endpoint
      return {
        service: 'fal_ai',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        details: { 
          status: response.status,
          responseTime: `${responseTime}ms`
        }
      };
    } else {
      return {
        service: 'fal_ai',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error: any) {
    return {
      service: 'fal_ai',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'Fal.ai API request failed'
    };
  }
}

export async function checkBflHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  if (!process.env.BFL_API_KEY) {
    return {
      service: 'bfl',
      status: 'unhealthy',
      error: 'BFL_API_KEY not configured'
    };
  }
  
  try {
    // Test BFL with a simple API call
    const response = await fetch('https://api.bfl.ml/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BFL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        service: 'bfl',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        details: { 
          status: response.status,
          responseTime: `${responseTime}ms`
        }
      };
    } else {
      return {
        service: 'bfl',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error: any) {
    return {
      service: 'bfl',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'BFL API request failed'
    };
  }
}

export async function checkStabilityHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  if (!process.env.STABILITY_API_KEY) {
    return {
      service: 'stability_ai',
      status: 'unhealthy',
      error: 'STABILITY_API_KEY not configured'
    };
  }
  
  try {
    // Test Stability.ai with a simple API call
    const response = await fetch('https://api.stability.ai/v1/user/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        service: 'stability_ai',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        details: { 
          status: response.status,
          responseTime: `${responseTime}ms`
        }
      };
    } else {
      return {
        service: 'stability_ai',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error: any) {
    return {
      service: 'stability_ai',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'Stability.ai API request failed'
    };
  }
}

export async function checkCloudinaryHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return {
      service: 'cloudinary',
      status: 'unhealthy',
      error: 'Cloudinary credentials not configured'
    };
  }
  
  try {
    // Test Cloudinary with a simple API call
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        service: 'cloudinary',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        details: { 
          status: response.status,
          responseTime: `${responseTime}ms`
        }
      };
    } else {
      return {
        service: 'cloudinary',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error: any) {
    return {
      service: 'cloudinary',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'Cloudinary API request failed'
    };
  }
}

export async function checkEmailHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  if (!process.env.RESEND_API_KEY) {
    return {
      service: 'email',
      status: 'unhealthy',
      error: 'RESEND_API_KEY not configured'
    };
  }
  
  try {
    // Test Resend with a simple API call
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        service: 'email',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        details: { 
          status: response.status,
          responseTime: `${responseTime}ms`
        }
      };
    } else {
      return {
        service: 'email',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error: any) {
    return {
      service: 'email',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message || 'Email API request failed'
    };
  }
}

export async function performHealthChecks(): Promise<{
  results: HealthCheckResult[];
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    total: number;
  };
}> {
  const startTime = Date.now();
  
  console.log('🔍 [Health Check] Starting comprehensive health checks...');
  
  // Run all health checks in parallel
  const [
    databaseResult,
    falAiResult,
    bflResult,
    stabilityResult,
    cloudinaryResult,
    emailResult
  ] = await Promise.all([
    checkDatabaseHealth(),
    checkFalAiHealth(),
    checkBflHealth(),
    checkStabilityHealth(),
    checkCloudinaryHealth(),
    checkEmailHealth()
  ]);
  
  const results = [
    databaseResult,
    falAiResult,
    bflResult,
    stabilityResult,
    cloudinaryResult,
    emailResult
  ];
  
  const totalTime = Date.now() - startTime;
  
  // Calculate overall system health
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const degradedCount = results.filter(r => r.status === 'degraded').length;
  const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyCount === 0 && degradedCount === 0) {
    overallStatus = 'healthy';
  } else if (unhealthyCount === 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'unhealthy';
  }
  
  console.log(`✅ [Health Check] Completed in ${totalTime}ms - Overall: ${overallStatus}`);
  
  return {
    results,
    overallStatus,
    summary: {
      healthy: healthyCount,
      degraded: degradedCount,
      unhealthy: unhealthyCount,
      total: results.length
    }
  };
}
