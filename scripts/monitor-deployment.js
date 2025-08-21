async function monitorDeployment() {
  console.log('🔍 Monitoring Netlify function deployment...');
  console.log('⏰ Checking every 30 seconds...\n');
  
  let attempts = 0;
  const maxAttempts = 20; // 10 minutes
  
  const checkFunction = async () => {
    attempts++;
    console.log(`📡 Attempt ${attempts}/${maxAttempts} - Checking function...`);
    
    try {
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
      
      if (response.status === 500 && result.includes('Invalid JWT')) {
        console.log('⏳ Function still using old version (JWT error)');
        console.log('   Waiting for deployment to complete...\n');
      } else if (response.status === 500 && result.includes('DB_')) {
        console.log('✅ Function updated! Now getting database errors (expected)');
        console.log('   This means the function is deployed with our fixes!');
        console.log('   The JWT error is resolved.\n');
        return true;
      } else if (response.status === 401) {
        console.log('✅ Function working correctly (401 for invalid token is expected)');
        console.log('   Deployment complete! 🎉\n');
        return true;
      } else {
        console.log(`🔍 Unexpected response: ${response.status}`);
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
  
  console.log('🎯 Deployment monitoring complete!');
}

monitorDeployment();
