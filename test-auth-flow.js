// Test Authentication Flow - Step by Step
// Copy and paste this whole block into browser console

async function testCompleteAuthFlow() {
  console.log('🔐 Testing Complete Authentication Flow...\n');

  const email = 'test@example.com'; // Use your actual email

  // Step 1: Request OTP
  console.log('📧 Step 1: Requesting OTP...');
  try {
    const requestResponse = await fetch('/.netlify/functions/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    });

    console.log(`Request OTP Status: ${requestResponse.status}`);

    if (requestResponse.status === 404) {
      console.log('❌ User not found. First register the user or use an existing email.');
      return;
    }

    const requestResult = await requestResponse.json();
    console.log('Request OTP Result:', requestResult);

    if (requestResult.success) {
      console.log('✅ OTP sent! Check your email for the code.');
      console.log('📝 Use the code from email in Step 2...');

      // Step 2: Verify OTP (you need to manually enter the code)
      const code = prompt('Enter the OTP code from your email:');

      if (code) {
        await verifyOTP(email, code);
      }
    } else {
      console.log('❌ Failed to request OTP:', requestResult);
    }
  } catch (error) {
    console.log('❌ Request OTP Error:', error.message);
  }
}

async function verifyOTP(email, code) {
  console.log('🔍 Step 2: Verifying OTP...');

  try {
    const verifyResponse = await fetch('/.netlify/functions/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        code: code  // IMPORTANT: Use 'code' not 'otp'
      })
    });

    console.log(`Verify OTP Status: ${verifyResponse.status}`);
    const verifyResult = await verifyResponse.json();
    console.log('Verify OTP Result:', verifyResult);

    if (verifyResult.success) {
      console.log('✅ Login successful!');
      console.log('🔑 User ID:', verifyResult.userId);
      console.log('📧 Email:', verifyResult.email);

      // Now you can test the unified endpoints
      console.log('\n🚀 Ready to test unified endpoints!');
      console.log('Use this user ID for generation:', verifyResult.userId);
    } else {
      console.log('❌ OTP verification failed:', verifyResult);
    }
  } catch (error) {
    console.log('❌ Verify OTP Error:', error.message);
  }
}

// Make functions available globally
window.testCompleteAuthFlow = testCompleteAuthFlow;
window.verifyOTP = verifyOTP;

console.log('🔐 Authentication Test Functions Loaded!');
console.log('');
console.log('📝 To test:');
console.log('1. Run: testCompleteAuthFlow()');
console.log('2. Enter your email when prompted');
console.log('3. Check email for OTP code');
console.log('4. Enter the code when prompted');
console.log('5. You\'ll get a userId for testing unified endpoints');
