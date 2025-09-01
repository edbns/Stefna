import { Handler } from '@netlify/functions';
import { fal } from '@fal-ai/client';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const q = (text: string, params?: any[]) => pool.query(text, params);
const qOne = (text: string, params?: any[]) => pool.query(text, params).then(res => res.rows[0]);

// Test input for health checks (minimal, doesn't cost much)
const HEALTH_CHECK_INPUT = {
  image_url: "https://upload.wikimedia.org/wikipedia/commons/7/77/Delete_key1.jpg", // Public test image
  prompt: "Test prompt for health check",
  image_strength: 0.5,
  guidance_scale: 7.0,
  num_inference_steps: 1, // Minimal steps to reduce cost
  seed: 12345
};

// Health check function
async function checkModelHealth(modelId: string, mode: string): Promise<{ healthy: boolean; error?: string }> {
  try {
    console.log(`🔍 [Health Check] Testing ${modelId} for ${mode} mode`);
    
    // Different input based on mode
    let input: any;
    if (mode === 'video') {
      input = {
        image_url: HEALTH_CHECK_INPUT.image_url,
        prompt: HEALTH_CHECK_INPUT.prompt,
        num_frames: 2, // Minimal frames for health check
        fps: 8
      };
    } else {
      input = {
        ...HEALTH_CHECK_INPUT,
        prompt: mode === 'ghibli' 
          ? `${HEALTH_CHECK_INPUT.prompt}, subtle ghibli-inspired lighting`
          : HEALTH_CHECK_INPUT.prompt
      };
    }

    // Quick health check (timeout after 30 seconds)
    const result = await Promise.race([
      fal.subscribe(modelId, { input, logs: false }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 30000)
      )
    ]);

    // Check if we got a valid response
    const hasValidResponse = mode === 'video' 
      ? result?.data?.video?.url 
      : result?.data?.image?.url;

    if (hasValidResponse) {
      console.log(`✅ [Health Check] ${modelId} is healthy`);
      return { healthy: true };
    } else {
      console.log(`❌ [Health Check] ${modelId} returned no valid response`);
      return { healthy: false, error: 'No valid response' };
    }

  } catch (error: any) {
    const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error';
    console.log(`❌ [Health Check] ${modelId} failed: ${errorMessage}`);
    return { healthy: false, error: errorMessage };
  }
}

// Update model status in database
async function updateModelStatus(modelId: string, mode: string, healthy: boolean, error?: string): Promise<void> {
  try {
    if (healthy) {
      // Model is healthy - increment success count, reset failure count
      await q(`
        UPDATE fal_models 
        SET 
          status = CASE 
            WHEN success_count >= 2 THEN 'active' 
            ELSE 'testing' 
          END,
          success_count = success_count + 1,
          failure_count = 0,
          last_check = NOW(),
          updated_at = NOW()
        WHERE model_id = $1 AND mode = $2
      `, [modelId, mode]);
    } else {
      // Model failed - increment failure count, disable if too many failures
      await q(`
        UPDATE fal_models 
        SET 
          status = CASE 
            WHEN failure_count >= 2 THEN 'disabled' 
            ELSE 'testing' 
          END,
          failure_count = failure_count + 1,
          success_count = 0,
          last_check = NOW(),
          updated_at = NOW()
        WHERE model_id = $1 AND mode = $2
      `, [modelId, mode]);
    }
  } catch (error) {
    console.error(`❌ [Health Check] Failed to update model status for ${modelId}:`, error);
  }
}

// Main health check function
async function runHealthChecks(): Promise<void> {
  try {
    console.log(`🚀 [Health Check] Starting Fal.ai model health checks`);

    // Get all models that need checking (not checked in last 24 hours or disabled models)
    const models = await q(`
      SELECT model_id, model_name, mode, status, failure_count, success_count
      FROM fal_models 
      WHERE 
        last_check < NOW() - INTERVAL '24 hours' 
        OR status = 'disabled'
      ORDER BY mode, priority
    `);

    console.log(`📊 [Health Check] Found ${models.rows.length} models to check`);

    // Check each model
    for (const model of models.rows) {
      const { healthy, error } = await checkModelHealth(model.model_id, model.mode);
      await updateModelStatus(model.model_id, model.mode, healthy, error);
      
      // Small delay between checks to be nice to Fal.ai
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Get summary
    const summary = await q(`
      SELECT 
        mode,
        status,
        COUNT(*) as count
      FROM fal_models 
      GROUP BY mode, status
      ORDER BY mode, status
    `);

    console.log(`📈 [Health Check] Summary:`, summary.rows);

  } catch (error) {
    console.error(`❌ [Health Check] Health check failed:`, error);
  }
}

// Netlify function handler
const handler: Handler = async (event, context) => {
  // Configure Fal.ai
  fal.config({
    credentials: process.env.FAL_KEY || ''
  });

  try {
    await runHealthChecks();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Fal.ai model health checks completed' 
      })
    };
  } catch (error) {
    console.error('Health check handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Health check failed' 
      })
    };
  } finally {
    await pool.end();
  }
};

export { handler };
