exports.handler = async (event) => {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      checks: {}
    };

    // Check required environment variables
    const requiredEnvVars = [
      'AIML_API_URL',
      'AIML_API_KEY', 
      'JWT_SECRET',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      checks.checks[envVar] = !!process.env[envVar] ? 'ok' : 'missing';
      if (!process.env[envVar]) {
        checks.status = "unhealthy";
      }
    }

    // Test AIML API connectivity (whoami verify)
    try {
      const whoamiResponse = await fetch(`${process.env.AIML_API_URL}/v1/auth/whoami`, {
        headers: { Authorization: `Bearer ${process.env.AIML_API_KEY}` }
      });
      checks.checks.aiml_connectivity = whoamiResponse.ok ? 'ok' : `error_${whoamiResponse.status}`;
      if (!whoamiResponse.ok) {
        checks.status = "degraded";
      }
    } catch (error) {
      checks.checks.aiml_connectivity = `error: ${error.message}`;
      checks.status = "degraded";
    }

    // Memory and basic Node.js health
    const memUsage = process.memoryUsage();
    checks.checks.memory_mb = Math.round(memUsage.heapUsed / 1024 / 1024);
    checks.checks.uptime_seconds = Math.round(process.uptime());

    const statusCode = checks.status === "healthy" ? 200 : 
                      checks.status === "degraded" ? 200 : 503;

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(checks, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        status: "unhealthy",
        error: error.message
      })
    };
  }
};
