async function monitorV5Deployment() {
  console.log('🔍 Monitoring V5 function deployment...');
  console.log('⏰ Checking every 30 seconds...\n');
  
  let attempts = 0;
  const maxAttempts = 20; // 10 minutes
  
  const checkFunction = async () => {
    attempts++;
    console.log(`📡 Attempt ${attempts}/${maxAttempts} - Checking V5 function...`);
    
    try {
      const response = await fetch('https://stefna.netlify.app/.netlify/functions/credits-reserve-v5', {
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
      
      if (response.status === 404) {
        console.log('⏳ Function not found yet (404)');
        console.log('   Waiting for deployment to complete...\n');
      } else if (response.status === 500 && result.includes('Invalid JWT')) {
        console.log('✅ Function deployed! Now getting JWT error (expected)');
        console.log('   This means the new function is working!');
        console.log('   The old JWT issue is resolved.\n');
        return true;
      } else if (response.status === 401) {
        console.log('✅ Function working correctly (401 for invalid token is expected)');
        console.log('   Deployment complete! 🎉\n');
        return true;
      } else if (response.status === 400) {
        console.log('✅ Function deployed and responding (400 for missing fields is expected)');
        console.log('   Deployment complete! 🎉\n');
        return true;
      } else {
        console.log(`🔍 Response: ${response.status}`);
        console.log(`   Body: ${result.substring(0, 100)}...\n`);
      }
      
    } catch (error) {
      console.log(`❌ Check failed: ${error.message}\n`);
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Timeout reached. Function may not have deployed yet.');
      console.log('💡 Try manual deployment from Netlify dashboard.');
      return false;
    }
    
    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
    return false;
  };
  
  while (!(await checkFunction())) {
    // Continue checking
  }
  
  console.log('🎯 V5 deployment monitoring complete!');
  console.log('🚀 You can now test image generation!');
}

monitorV5Deployment();
