// Quick OTP Fix - Use the correct field name
// Copy and paste this into browser console

async function testOTPFix() {
  console.log('🔧 Testing OTP with CORRECT field name...\n');

  // Use 'code' not 'otp' - this is the fix!
  const requestBody = {
    email: 'souhil@pm.me',
    code: '299966'  // ✅ CORRECT: use 'code' not 'otp'
  };

  console.log('📤 Sending request with:', requestBody);

  try {
    const response = await fetch('/.netlify/functions/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Result:', result);

    if (result.success) {
      console.log('✅ SUCCESS! OTP verified!');
      console.log('🔑 User ID:', result.userId);
      console.log('📧 Email:', result.email);
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testOTPFix();
