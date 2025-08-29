// Simple test without global functions
// Copy and paste this whole block into browser console

(async () => {
  console.log('🧪 Simple Unified Endpoint Test\n');

  try {
    // Test Generate endpoint
    console.log('Testing Generate endpoint...');
    const genResponse = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'neo-glitch',
        prompt: 'test prompt',
        presetKey: 'cyberpunk',
        sourceAssetId: 'test.jpg'
      })
    });

    console.log(`✅ Generate: ${genResponse.status} ${genResponse.statusText}`);
    if (genResponse.status === 200) {
      const result = await genResponse.json();
      console.log('🎯 Generate result:', result);
    } else {
      const error = await genResponse.text();
      console.log('❌ Generate error:', error);
    }
  } catch (error) {
    console.log('❌ Generate network error:', error.message);
  }

  console.log('');

  try {
    // Test Status endpoint
    console.log('Testing Status endpoint...');
    const statusResponse = await fetch('/.netlify/functions/status?jobId=test123', {
      headers: { 'Authorization': 'Bearer test' }
    });

    console.log(`✅ Status: ${statusResponse.status} ${statusResponse.statusText}`);
    if (statusResponse.ok) {
      const result = await statusResponse.json();
      console.log('📊 Status result:', result);
    } else {
      const error = await statusResponse.text();
      console.log('❌ Status error:', error);
    }
  } catch (error) {
    console.log('❌ Status network error:', error.message);
  }

  console.log('\n✅ Test completed!');
})();
