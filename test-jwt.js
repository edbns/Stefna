// Copy and paste this into browser console to test JWT auth

async function testJWT() {
  console.log('🔍 Testing JWT Authentication...');
  
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    console.error('❌ No auth_token found in localStorage');
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 20) + '...');
  
  try {
    // Test whoami function
    const response = await fetch('/.netlify/functions/whoami', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ whoami SUCCESS:', data);
      
      // Test cloudinary-sign
      console.log('🔍 Testing cloudinary-sign...');
      const signResponse = await fetch('/.netlify/functions/cloudinary-sign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resource_type: 'image' })
      });
      
      const signData = await signResponse.json();
      
      if (signResponse.ok) {
        console.log('✅ cloudinary-sign SUCCESS:', signData);
      } else {
        console.error('❌ cloudinary-sign FAILED:', signData);
      }
      
    } else {
      console.error('❌ whoami FAILED:', data);
      console.error('🔧 JWT_SECRET mismatch between frontend and Netlify');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testJWT();
