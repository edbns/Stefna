#!/usr/bin/env node

// Simple script to test the migration function
const testMigration = async () => {
  try {
    console.log('🧪 Testing migration function...');
    
    // You'll need to replace this with a valid JWT token
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    const response = await fetch('https://stefna.xyz/.netlify/functions/fix-negative-likes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Migration successful:', result);
    } else {
      console.log('❌ Migration failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testMigration();

