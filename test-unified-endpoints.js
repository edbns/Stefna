#!/usr/bin/env node

// test-unified-endpoints.js
// Test script for the new unified generation endpoints
//
// Usage: node test-unified-endpoints.js

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NETLIFY_URL || 'http://localhost:8888';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'your-test-jwt-token-here';

// Test data
const testRequests = [
  {
    type: 'neo-glitch',
    prompt: 'A futuristic cyberpunk city with neon lights',
    presetKey: 'cyberpunk',
    sourceAssetId: 'test-source-url.jpg'
  },
  {
    type: 'emotion-mask',
    prompt: 'Happy smiling face with joyful expression',
    presetKey: 'happy',
    sourceAssetId: 'test-face.jpg'
  },
  {
    type: 'presets',
    prompt: 'Beautiful landscape with mountains and lake',
    presetKey: 'landscape',
    sourceAssetId: 'test-landscape.jpg'
  }
];

// Helper function to make HTTP requests
function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          };
          resolve(response);
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test the /generate endpoint
async function testGenerateEndpoint() {
  console.log('🧪 Testing /generate endpoint...\n');

  for (const testData of testRequests) {
    console.log(`📤 Testing ${testData.type} generation:`);
    console.log(`   Prompt: "${testData.prompt}"`);
    console.log(`   Preset: ${testData.presetKey}`);

    try {
      const response = await makeRequest(`${BASE_URL}/.netlify/functions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_USER_TOKEN}`
        }
      }, testData);

      console.log(`   Status: ${response.status}`);
      if (response.status === 200) {
        console.log(`   ✅ Job ID: ${response.body.jobId}`);
        console.log(`   📊 Status: ${response.body.status}`);
        console.log(`   🏷️  Type: ${response.body.type}`);

        // Test status endpoint if job was created
        if (response.body.jobId) {
          await testStatusEndpoint(response.body.jobId, testData.type);
        }
      } else {
        console.log(`   ❌ Error: ${JSON.stringify(response.body, null, 2)}`);
      }
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }

    console.log(''); // Empty line between tests
  }
}

// Test the /status endpoint
async function testStatusEndpoint(jobId, type) {
  console.log(`   🔍 Checking status for job ${jobId}:`);

  try {
    const statusUrl = `${BASE_URL}/.netlify/functions/status?jobId=${jobId}&type=${type}`;
    const response = await makeRequest(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });

    console.log(`      Status Code: ${response.status}`);
    if (response.status === 200) {
      console.log(`      📊 Job Status: ${response.body.status}`);
      console.log(`      🏷️  Type: ${response.body.type || 'unknown'}`);
      if (response.body.imageUrl) {
        console.log(`      🖼️  Image URL: ${response.body.imageUrl}`);
      }
    } else {
      console.log(`      ❌ Status Error: ${JSON.stringify(response.body, null, 2)}`);
    }
  } catch (error) {
    console.log(`      ❌ Status Network Error: ${error.message}`);
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('🧪 Testing error handling...\n');

  // Test missing authorization
  console.log('📤 Testing without authorization:');
  try {
    const response = await makeRequest(`${BASE_URL}/.netlify/functions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, testRequests[0]);

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test invalid type
  console.log('\n📤 Testing invalid generation type:');
  try {
    const response = await makeRequest(`${BASE_URL}/.netlify/functions/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    }, {
      type: 'invalid-type',
      prompt: 'test',
      presetKey: 'test',
      sourceAssetId: 'test.jpg'
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log(''); // Empty line
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Unified Endpoints Test Suite\n');
  console.log(`🌐 Testing against: ${BASE_URL}`);
  console.log(`🔑 Using token: ${TEST_USER_TOKEN.substring(0, 20)}...\n`);

  if (TEST_USER_TOKEN === 'your-test-jwt-token-here') {
    console.log('⚠️  WARNING: Using placeholder token. Set TEST_USER_TOKEN environment variable for real testing.\n');
  }

  try {
    await testGenerateEndpoint();
    await testErrorHandling();

    console.log('✅ Test suite completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testGenerateEndpoint, testStatusEndpoint, testErrorHandling };
