import { Handler } from '@netlify/functions'
import { q, qOne } from './_db'

// ============================================================================
// SYSTEM MONITOR - Internal Alert System
// ============================================================================
// Monitors all system components and sends alerts to admin
// Runs every 15 minutes via Netlify scheduled functions
// ============================================================================

interface SystemStatus {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  error?: string
}

interface AlertData {
  type: 'CRITICAL' | 'WARNING' | 'INFO'
  service: string
  message: string
  details: string
  action?: string
}

export const handler: Handler = async (event) => {
  console.log('🔍 [System Monitor] Starting system health check...')

  try {
    // Check all services
    const services = await Promise.allSettled([
      checkFalAI(),
      checkBFL(),
      checkStability(),
      checkCloudinary(),
      checkDatabase(),
      checkEmailService(),
      checkCreditReset()
    ])

    const results: SystemStatus[] = services.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          service: ['fal_ai', 'bfl', 'stability', 'cloudinary', 'database', 'email', 'credit_reset'][index],
          status: 'unhealthy',
          error: result.reason?.message || 'Unknown error'
        }
      }
    })

    // Generate alerts for any issues
    const alerts = generateAlerts(results)
    
    if (alerts.length > 0) {
      console.log(`🚨 [System Monitor] Found ${alerts.length} issues, sending alerts...`)
      await sendAlerts(alerts)
    } else {
      console.log('✅ [System Monitor] All systems healthy')
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        alerts_sent: alerts.length,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ [System Monitor] Failed:', error)
    
    // Send critical alert about monitor failure
    await sendAlerts([{
      type: 'CRITICAL',
      service: 'system_monitor',
      message: 'System monitor failed',
      details: `Monitor function crashed: ${error.message}`,
      action: 'Check Netlify function logs'
    }])

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}

// Service check functions
async function checkFalAI(): Promise<SystemStatus> {
  try {
    const start = Date.now()
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: 'test' })
    })
    const responseTime = Date.now() - start

    if (response.ok) {
      return { service: 'fal_ai', status: 'healthy', responseTime }
    } else {
      return { service: 'fal_ai', status: 'unhealthy', error: `HTTP ${response.status}` }
    }
  } catch (error) {
    return { service: 'fal_ai', status: 'unhealthy', error: error.message }
  }
}

async function checkBFL(): Promise<SystemStatus> {
  try {
    const start = Date.now()
    const response = await fetch('https://api.bfl.ml/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.BFL_API_KEY}`
      }
    })
    const responseTime = Date.now() - start

    if (response.ok) {
      return { service: 'bfl', status: 'healthy', responseTime }
    } else {
      return { service: 'bfl', status: 'unhealthy', error: `HTTP ${response.status}` }
    }
  } catch (error) {
    return { service: 'bfl', status: 'unhealthy', error: error.message }
  }
}

async function checkStability(): Promise<SystemStatus> {
  try {
    const start = Date.now()
    const response = await fetch('https://api.stability.ai/v1/user/account', {
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`
      }
    })
    const responseTime = Date.now() - start

    if (response.ok) {
      return { service: 'stability', status: 'healthy', responseTime }
    } else {
      return { service: 'stability', status: 'unhealthy', error: `HTTP ${response.status}` }
    }
  } catch (error) {
    return { service: 'stability', status: 'unhealthy', error: error.message }
  }
}

async function checkCloudinary(): Promise<SystemStatus> {
  try {
    const start = Date.now()
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image/upload?max_results=1`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}`
      }
    })
    const responseTime = Date.now() - start

    if (response.ok) {
      return { service: 'cloudinary', status: 'healthy', responseTime }
    } else {
      return { service: 'cloudinary', status: 'unhealthy', error: `HTTP ${response.status}` }
    }
  } catch (error) {
    return { service: 'cloudinary', status: 'unhealthy', error: error.message }
  }
}

async function checkDatabase(): Promise<SystemStatus> {
  try {
    const start = Date.now()
    await qOne('SELECT 1')
    const responseTime = Date.now() - start

    return { service: 'database', status: 'healthy', responseTime }
  } catch (error) {
    return { service: 'database', status: 'unhealthy', error: error.message }
  }
}

async function checkEmailService(): Promise<SystemStatus> {
  try {
    const start = Date.now()
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      }
    })
    const responseTime = Date.now() - start

    if (response.ok) {
      return { service: 'email', status: 'healthy', responseTime }
    } else {
      return { service: 'email', status: 'unhealthy', error: `HTTP ${response.status}` }
    }
  } catch (error) {
    return { service: 'email', status: 'unhealthy', error: error.message }
  }
}

async function checkCreditReset(): Promise<SystemStatus> {
  try {
    const lastReset = await qOne(`SELECT value FROM app_config WHERE key = 'last_credit_reset'`)
    
    if (!lastReset) {
      return { service: 'credit_reset', status: 'unhealthy', error: 'No reset record found' }
    }

    const lastResetTime = new Date(lastReset.value)
    const hoursSinceReset = (Date.now() - lastResetTime.getTime()) / (1000 * 60 * 60)

    if (hoursSinceReset > 25) {
      return { service: 'credit_reset', status: 'unhealthy', error: `${Math.round(hoursSinceReset)} hours overdue` }
    } else if (hoursSinceReset > 20) {
      return { service: 'credit_reset', status: 'degraded', error: `${Math.round(hoursSinceReset)} hours since reset` }
    } else {
      return { service: 'credit_reset', status: 'healthy' }
    }
  } catch (error) {
    return { service: 'credit_reset', status: 'unhealthy', error: error.message }
  }
}

// Generate alerts based on service status
function generateAlerts(results: SystemStatus[]): AlertData[] {
  const alerts: AlertData[] = []

  for (const result of results) {
    if (result.status === 'unhealthy') {
      alerts.push({
        type: result.service === 'database' ? 'CRITICAL' : 'WARNING',
        service: result.service,
        message: `${result.service.toUpperCase()} is down`,
        details: result.error || 'Service unavailable',
        action: getActionForService(result.service)
      })
    } else if (result.status === 'degraded') {
      alerts.push({
        type: 'WARNING',
        service: result.service,
        message: `${result.service.toUpperCase()} is slow`,
        details: result.error || 'Performance degraded',
        action: getActionForService(result.service)
      })
    }
  }

  return alerts
}

function getActionForService(service: string): string {
  const actions: Record<string, string> = {
    fal_ai: 'Check Fal.ai status page and API key',
    bfl: 'Check BFL API status and credentials',
    stability: 'Check Stability.ai status and API key',
    cloudinary: 'Check Cloudinary dashboard and credentials',
    database: 'Check database connection and logs',
    email: 'Check Resend API status and key',
    credit_reset: 'Go to admin dashboard and click Reset Daily Credits'
  }
  return actions[service] || 'Check service logs'
}

// Send alerts via email
async function sendAlerts(alerts: AlertData[]): Promise<void> {
  for (const alert of alerts) {
    try {
      const subject = `[${alert.type}] Stefna Alert: ${alert.message}`
      const body = `
Service: ${alert.service.toUpperCase()}
Status: ${alert.type}
Message: ${alert.message}
Details: ${alert.details}
Action: ${alert.action || 'Check logs'}

Time: ${new Date().toLocaleString()}
Dashboard: https://stefna.xyz/dashboard/management/control
`

      await fetch('/.netlify/functions/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'hello@stefna.xyz',
          from: 'hello@stefna.xyz',
          subject,
          text: body,
          type: 'system_alert'
        })
      })

      console.log(`📧 [System Monitor] Alert sent: ${alert.service} - ${alert.message}`)
    } catch (error) {
      console.error(`❌ [System Monitor] Failed to send alert for ${alert.service}:`, error)
    }
  }
}
