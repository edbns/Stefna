// test-unified-endpoints-browser.js
// Browser console test for unified generation endpoints
//
// Copy and paste this into your browser console to test the new unified endpoints

// Test 1: Generate Neo Glitch
async function testNeoGlitchGeneration() {
  console.log('🧪 Testing Neo Glitch Generation...');

  try {
    const response = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'your-jwt-token'}`
      },
      body: JSON.stringify({
        type: 'neo-glitch',
        prompt: 'A futuristic cyberpunk city with neon lights',
        presetKey: 'cyberpunk',
        sourceAssetId: 'test-source-url.jpg'
      })
    });

    const result = await response.json();
    console.log('🎯 Neo Glitch Result:', result);

    if (result.jobId) {
      console.log('✅ Job created successfully! Job ID:', result.jobId);

      // Test status polling
      setTimeout(() => testJobStatus(result.jobId), 2000);
    } else {
      console.log('❌ Generation failed:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Test 2: Job Status Polling
async function testJobStatus(jobId) {
  console.log('📊 Testing Job Status for:', jobId);

  try {
    const response = await fetch(`/.netlify/functions/status?jobId=${jobId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'your-jwt-token'}`
      }
    });

    const status = await response.json();
    console.log('📈 Job Status:', status);

    if (status.status === 'completed') {
      console.log('🎉 Job completed! Image URL:', status.imageUrl);
    } else if (status.status === 'processing') {
      console.log('⏳ Still processing...');
    } else {
      console.log('❌ Job failed:', status.error);
    }
  } catch (error) {
    console.error('❌ Status check error:', error);
  }
}

// Test 3: All Generation Types
async function testAllGenerationTypes() {
  const testCases = [
    { type: 'neo-glitch', prompt: 'Cyberpunk city', presetKey: 'cyberpunk' },
    { type: 'emotion-mask', prompt: 'Happy smiling face', presetKey: 'happy' },
    { type: 'presets', prompt: 'Mountain landscape', presetKey: 'landscape' },
    { type: 'ghibli-reaction', prompt: 'Studio Ghibli style', presetKey: 'ghibli' },
    { type: 'custom-prompt', prompt: 'Custom art style', presetKey: 'custom' }
  ];

  console.log('🚀 Testing All Generation Types...');

  for (const testCase of testCases) {
    console.log(`\n📤 Testing ${testCase.type}...`);

    try {
      const response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'your-jwt-token'}`
        },
        body: JSON.stringify({
          ...testCase,
          sourceAssetId: 'test-source-url.jpg'
        })
      });

      const result = await response.json();
      console.log(`✅ ${testCase.type} result:`, result);
    } catch (error) {
      console.error(`❌ ${testCase.type} error:`, error);
    }

    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Test 4: Error Handling
async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...');

  // Test invalid type
  try {
    const response = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'your-jwt-token'}`
      },
      body: JSON.stringify({
        type: 'invalid-type',
        prompt: 'test',
        presetKey: 'test',
        sourceAssetId: 'test.jpg'
      })
    });

    const result = await response.json();
    console.log('❌ Invalid type error (expected):', result);
  } catch (error) {
    console.error('❌ Error test error:', error);
  }

  // Test missing auth
  try {
    const response = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'neo-glitch',
        prompt: 'test',
        presetKey: 'test',
        sourceAssetId: 'test.jpg'
      })
    });

    const result = await response.json();
    console.log('❌ No auth error (expected):', result);
  } catch (error) {
    console.error('❌ Auth error test error:', error);
  }
}

// Quick test runner
function runUnifiedEndpointTests() {
  console.log('🚀 Starting Unified Endpoint Tests...\n');

  // Run tests with delays
  testNeoGlitchGeneration();

  setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    testAllGenerationTypes();
  }, 3000);

  setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    testErrorHandling();
  }, 10000);
}

// Make functions available globally
window.testNeoGlitchGeneration = testNeoGlitchGeneration;
window.testJobStatus = testJobStatus;
window.testAllGenerationTypes = testAllGenerationTypes;
window.testErrorHandling = testErrorHandling;
window.runUnifiedEndpointTests = runUnifiedEndpointTests;

console.log('🎯 Unified Endpoint Test Functions Loaded!');
console.log('');
console.log('Available commands:');
console.log('• testNeoGlitchGeneration() - Test single generation');
console.log('• testAllGenerationTypes() - Test all 5 types');
console.log('• testErrorHandling() - Test error scenarios');
console.log('• runUnifiedEndpointTests() - Run all tests');
console.log('');
console.log('Example: testNeoGlitchGeneration()');
