// Test script for 3D generation
// Run this to test Stability AI's 3D endpoints

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function test3DGeneration() {
  console.log('🧪 Testing 3D Generation...\n');

  // Test with a sample image URL (you can replace this with any image URL)
  const testImageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&h=1024&fit=crop';
  
  console.log(`📸 Test image: ${testImageUrl}\n`);

  // Test both models
  const models = ['stable-fast-3d', 'stable-point-aware-3d'];
  
  for (const model of models) {
    console.log(`🚀 Testing ${model}...`);
    
    try {
      const response = await fetch('http://localhost:8888/.netlify/functions/test-3d-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: testImageUrl,
          model: model
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${model} SUCCESS:`);
        console.log(`   - Has OBJ: ${result.hasObj}`);
        console.log(`   - Has GLTF: ${result.hasGltf}`);
        console.log(`   - Has Texture: ${result.hasTexture}`);
        console.log(`   - Result keys: ${Object.keys(result.result).join(', ')}`);
        
        // Show URLs if available
        if (result.result.obj_url) console.log(`   - OBJ URL: ${result.result.obj_url}`);
        if (result.result.gltf_url) console.log(`   - GLTF URL: ${result.result.gltf_url}`);
        if (result.result.texture_url) console.log(`   - Texture URL: ${result.result.texture_url}`);
        
      } else {
        console.log(`❌ ${model} FAILED:`);
        console.log(`   - Error: ${result.error}`);
        console.log(`   - Details: ${result.details}`);
      }
      
    } catch (error) {
      console.log(`❌ ${model} ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line between tests
  }

  console.log('🏁 3D generation test completed!');
}

// Run the test
test3DGeneration().catch(console.error);
