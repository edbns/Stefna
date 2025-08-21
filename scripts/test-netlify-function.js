async function testNetlifyFunction() {
  try {
    console.log('🧪 Testing Netlify function status...');
    
    // Test the current deployed function
    const response = await fetch('https://stefna.netlify.app/.netlify/functions/credits-reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      },
      body: JSON.stringify({
        action: 'image.gen',
        cost: 2
      })
    });
    
    const result = await response.text();
    console.log('📡 Response status:', response.status);
    console.log('📡 Response body:', result);
    
    if (response.status === 500) {
      console.log('\n❌ Function is returning 500 error - needs redeploy');
      console.log('💡 Push a small change to trigger Netlify redeploy');
    } else if (response.status === 401) {
      console.log('\n✅ Function is working (401 is expected for invalid token)');
      console.log('💡 The function is deployed and responding correctly');
    } else {
      console.log('\n🔍 Unexpected response status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNetlifyFunction();
