// Quick test script to verify authentication chain
// Run with: node test-auth.js

const fetch = require('node-fetch');

async function testAuth() {
  console.log('🧪 Testing authentication chain...\n');
  
  // Test 1: Check if whoami endpoint exists
  try {
    console.log('1️⃣ Testing /whoami endpoint...');
    const whoamiRes = await fetch('http://localhost:3009/.netlify/functions/whoami');
    console.log('   Status:', whoamiRes.status);
    const whoamiData = await whoamiRes.json();
    console.log('   Response:', JSON.stringify(whoamiData, null, 2));
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('\n2️⃣ Testing with a fake JWT token...');
  try {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzQ1Njc4NzB9.fake-signature';
    
    const res = await fetch('http://localhost:3009/.netlify/functions/whoami', {
      headers: {
        'Authorization': `Bearer ${fakeToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', res.status);
    const data = await res.json();
    console.log('   Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('\n✅ Auth test complete!');
}

testAuth().catch(console.error);

