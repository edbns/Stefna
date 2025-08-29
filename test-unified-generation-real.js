// Test Unified Generation with Real User ID
// Copy and paste this into browser console

async function testRealUnifiedGeneration() {
  console.log('🎯 Testing REAL Unified Generation System...\n');

  const userId = '07d00b18-ade7-4928-ba13-f465f90d83cb'; // Your real user ID

  try {
    console.log('🚀 Step 1: Testing Neo Glitch Generation...');
    const response = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer test-token` // Use test auth for now
      },
      body: JSON.stringify({
        type: 'neo-glitch',
        prompt: 'A beautiful cyberpunk city at sunset',
        presetKey: 'cyberpunk',
        sourceAssetId: 'test-image.jpg',
        userId: userId // Use your real user ID
      })
    });

    console.log(`Generation Status: ${response.status}`);
    const result = await response.json();
    console.log('Generation Result:', result);

    if (result.success && result.jobId) {
      console.log('✅ SUCCESS! Job created:', result.jobId);

      // Step 2: Test status polling
      console.log('\n📊 Step 2: Testing Job Status...');
      await testJobStatus(result.jobId);

      // Step 3: Test different generation types
      console.log('\n🎨 Step 3: Testing Other Generation Types...');
      await testMultipleTypes(userId);

    } else {
      console.log('❌ Generation failed:', result.error || result.message);
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

async function testJobStatus(jobId) {
  try {
    const statusResponse = await fetch(`/status?jobId=${jobId}`, {
      headers: { 'Authorization': `Bearer test-token` }
    });

    const statusResult = await statusResponse.json();
    console.log('📈 Status Result:', statusResult);

    if (statusResult.success) {
      console.log('✅ Status check successful!');
    } else {
      console.log('❌ Status check failed:', statusResult.error);
    }
  } catch (error) {
    console.log('❌ Status check error:', error.message);
  }
}

async function testMultipleTypes(userId) {
  const types = [
    { type: 'emotion-mask', prompt: 'Happy smiling face', presetKey: 'happy' },
    { type: 'presets', prompt: 'Mountain landscape', presetKey: 'landscape' },
    { type: 'ghibli-reaction', prompt: 'Studio Ghibli style', presetKey: 'ghibli' }
  ];

  for (const testType of types) {
    try {
      console.log(`\n📤 Testing ${testType.type}...`);

      const response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer test-token`
        },
        body: JSON.stringify({
          ...testType,
          sourceAssetId: 'test-image.jpg',
          userId: userId
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ ${testType.type} successful! Job ID:`, result.jobId);
      } else {
        console.log(`❌ ${testType.type} failed:`, result.error);
      }

    } catch (error) {
      console.log(`❌ ${testType.type} error:`, error.message);
    }

    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Quick status check
async function checkEndpointHealth() {
  console.log('🔍 Quick Endpoint Health Check...\n');

  const endpoints = [
    { name: 'Generate', url: '/.netlify/functions/generate', method: 'POST' },
    { name: 'Status', url: '/.netlify/functions/status?jobId=test', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`✅ ${endpoint.name}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }

  console.log('\n🎯 If both return 200 or 400, the unified system is working!\n');
}

// Make functions available globally
window.testRealUnifiedGeneration = testRealUnifiedGeneration;
window.testJobStatus = testJobStatus;
window.checkEndpointHealth = checkEndpointHealth;

console.log('🎯 Unified Generation Test Functions Loaded!');
console.log('');
console.log('📝 Available commands:');
console.log('• checkEndpointHealth() - Quick health check');
console.log('• testRealUnifiedGeneration() - Full generation test');
console.log('');
console.log('🚀 Start with: checkEndpointHealth()');
