// Quick Test Script for Backend Fixes
// Run this in the browser console to test the fixes

console.log('🧪 Testing Backend Fixes...');

// Test 1: Sanity - GET feed
async function testFeed() {
  console.log('📡 Testing feed...');
  try {
    const response = await fetch('/.netlify/functions/getPublicFeed?limit=5');
    const data = await response.json();
    console.log('✅ Feed response:', data);
    return data.items?.length > 0;
  } catch (error) {
    console.error('❌ Feed test failed:', error);
    return false;
  }
}

// Test 2: Generate image end-to-end (happy path)
async function testGeneration() {
  console.log('🎨 Testing image generation...');
  
  // Check if we have auth
  if (typeof authService === 'undefined') {
    console.log('⚠️ authService not available - skipping generation test');
    return false;
  }
  
  const jwt = authService.getToken();
  if (!jwt) {
    console.log('⚠️ No JWT - skipping generation test');
    return false;
  }
  
  try {
    // Use a sample image URL
    const src = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    
    const response = await fetch('/.netlify/functions/aimlApi', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        prompt: 'cinematic glow', 
        image_url: src, 
        resource_type: 'image', 
        source: 'custom', 
        visibility: 'public' 
      })
    });
    
    const result = await response.json();
    console.log('✅ Generation response:', result);
    
    const resultUrl = result.result_url || result.image_url;
    if (!resultUrl) {
      console.error('❌ No result URL in response');
      return false;
    }
    
    console.log('🎯 Result URL:', resultUrl);
    return true;
  } catch (error) {
    console.error('❌ Generation test failed:', error);
    return false;
  }
}

// Test 3: Toggle like (if we have an asset ID)
async function testLike(assetId) {
  if (!assetId) {
    console.log('⚠️ No asset ID - skipping like test');
    return false;
  }
  
  console.log('❤️ Testing like toggle...');
  
  if (typeof authService === 'undefined') {
    console.log('⚠️ authService not available - skipping like test');
    return false;
  }
  
  const jwt = authService.getToken();
  if (!jwt) {
    console.log('⚠️ No JWT - skipping like test');
    return false;
  }
  
  try {
    const response = await fetch('/.netlify/functions/toggleLike', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}`},
      body: JSON.stringify({ asset_id: assetId })
    });
    
    const result = await response.json();
    console.log('✅ Like response:', result);
    return result.ok;
  } catch (error) {
    console.error('❌ Like test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all tests...');
  
  const feedTest = await testFeed();
  const generationTest = await testGeneration();
  
  // Get first asset ID from feed for like test
  let assetId = null;
  if (feedTest) {
    try {
      const feedResponse = await fetch('/.netlify/functions/getPublicFeed?limit=1');
      const feedData = await feedResponse.json();
      assetId = feedData.items?.[0]?.id;
    } catch (error) {
      console.log('⚠️ Could not get asset ID for like test');
    }
  }
  
  const likeTest = await testLike(assetId);
  
  console.log('📊 Test Results:');
  console.log('  Feed:', feedTest ? '✅' : '❌');
  console.log('  Generation:', generationTest ? '✅' : '❌');
  console.log('  Like:', likeTest ? '✅' : '❌');
  
  const allPassed = feedTest && generationTest && likeTest;
  console.log(allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed');
  
  return allPassed;
}

// Export for console use
window.testFixes = {
  testFeed,
  testGeneration,
  testLike,
  runAllTests
};

console.log('🔧 Test functions available: window.testFixes.runAllTests()');
