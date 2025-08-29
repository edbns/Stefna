// Quick status check for all endpoints
// Copy and paste this into browser console

async function checkAllEndpoints() {
  console.log('🔍 Checking all endpoints...\n');

  const endpoints = [
    { name: 'Generate', url: '/.netlify/functions/generate', method: 'POST' },
    { name: 'Status', url: '/.netlify/functions/status?jobId=test', method: 'GET' },
    { name: 'Request OTP', url: '/.netlify/functions/request-otp', method: 'POST' },
    { name: 'Verify OTP', url: '/.netlify/functions/verify-otp', method: 'POST' },
    { name: 'Get Public Feed', url: '/.netlify/functions/getPublicFeed?limit=1', method: 'GET' }
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
}

checkAllEndpoints();
