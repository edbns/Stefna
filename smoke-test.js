// One-click smoke test for complete I2I workflow
// Run this in browser console (signed-in tab) for quick validation

(async () => {
  console.log('🚀 Starting I2I workflow smoke test...');
  
  try {
    // 1) Generate (use a real HTTPS image URL you own)
    console.log('📸 Step 1: Generating image...');
    const gen = await fetch('/.netlify/functions/aimlApi', {
      method:'POST', 
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        prompt:'oil painting, thick brush strokes, canvas texture',
        image_url:'https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/your-image-id.png', // Replace with your actual URL
        strength:0.75, 
        num_inference_steps:36, 
        guidance_scale:7.5
      })
    });
    
    const g = await gen.json(); 
    console.log('✅ aimlApi:', gen.status, g);
    if (!gen.ok) {
      console.error('❌ Generation failed');
      return;
    }

    // 2) Pull JWT from your app (adjust if you store under a different key)
    console.log('🔑 Step 2: Getting JWT...');
    const jwt = Object.values(localStorage).find(v => 
      typeof v==='string' && v.startsWith('eyJ')
    );
    if (!jwt) { 
      console.warn('⚠️ No JWT found in localStorage'); 
      return; 
    }
    console.log('✅ JWT found');

    // 3) Extract user_id from JWT claims
    console.log('👤 Step 3: Extracting user_id...');
    const claims = JSON.parse(atob(jwt.split('.')[1]));
    const user_id = claims.sub || claims.uid || claims.user_id || claims.id;
    if (!user_id) {
      console.error('❌ No UUID found in JWT claims');
      return;
    }
    console.log('✅ User ID:', user_id);

    // 4) Save (private)
    console.log('💾 Step 4: Saving to database...');
    const me = await fetch('/.netlify/functions/save-media', {
      method:'POST',
      headers:{
        'Content-Type':'application/json', 
        Authorization:`Bearer ${jwt}`
      },
      body: JSON.stringify({
        user_id: user_id,
        result_url: g.result_url,
        source_url: 'https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/your-image-id.png', // Same as above
        model:'flux/dev/image-to-image', 
        mode:'i2i',
        prompt:'oil painting, thick brush strokes, canvas texture',
        visibility:'private', 
        env: location.host.includes('netlify.app')?'dev':'prod'
      })
    });
    
    const saveResult = await me.json();
    console.log('✅ save-media:', me.status, saveResult);
    
    if (me.ok) {
      console.log('🎉 SUCCESS: Complete I2I workflow working!');
      console.log('📋 Next: Check All Media tab, test Share + Allow Remix toggles');
    } else {
      console.error('❌ Save failed:', saveResult);
    }

  } catch (error) {
    console.error('💥 Smoke test failed:', error);
  }
})();

// Quick individual function tests:
console.log(`
🧪 Quick Tests Available:
• fetch('/.netlify/functions/ping').then(r=>r.json()).then(console.log)
• fetch('/.netlify/functions/save-media').then(r=>console.log('GET:', r.status)) // Should be 405
• fetch('/.netlify/functions/getUserMedia').then(r=>console.log('GET:', r.status)) // Should be 200 (guest)
`);
