#!/usr/bin/env node

/**
 * Test Setup Script
 * Run this to verify the debugging setup is working
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Testing Stefna Debugging Setup...\n');

// Test 1: Check if required files exist
const requiredFiles = [
  'src/main.tsx',
  'src/utils/generationGuards.ts',
  'src/components/HomeNew.tsx',
  'netlify/functions/health.js',
  'DEBUGGING_SETUP.md',
  'TEST_LOGIN.md'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Test 2: Check if debugging code is present
console.log('\n🔍 Checking debugging code:');

// Check main.tsx for fetch interception
const mainTsx = fs.readFileSync('src/main.tsx', 'utf8');
const hasFetchInterception = mainTsx.includes('window.fetch = async');
console.log(`  ${hasFetchInterception ? '✅' : '❌'} Fetch interception in main.tsx`);

// Check generationGuards.ts for visible logging
const generationGuards = fs.readFileSync('src/utils/generationGuards.ts', 'utf8');
const hasVisibleGuard = generationGuards.includes('🛡️ requireUserIntent:');
console.log(`  ${hasVisibleGuard ? '✅' : '❌'} Visible user intent guard`);

// Check HomeNew.tsx for centralized dispatcher
const homeNew = fs.readFileSync('src/components/HomeNew.tsx', 'utf8');
const hasDispatchGenerate = homeNew.includes('dispatchGenerate');
console.log(`  ${hasDispatchGenerate ? '✅' : '❌'} Centralized generation dispatcher`);

// Check health.js for simple env checks
const healthJs = fs.readFileSync('netlify/functions/health.js', 'utf8');
const hasSimpleHealth = healthJs.includes('DATABASE_URL: !!process.env.DATABASE_URL');
console.log(`  ${hasSimpleHealth ? '✅' : '❌'} Simple health endpoint`);

// Test 3: Check package.json for netlify:dev script
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasNetlifyDev = packageJson.scripts && packageJson.scripts['netlify:dev'];
console.log(`  ${hasNetlifyDev ? '✅' : '❌'} Netlify dev script`);

console.log('\n🎯 Next Steps:');
console.log('1. Open your browser to http://localhost:3002/');
console.log('2. Open browser console to see debugging logs');
console.log('3. Try logging in with your email (OTP system)');
console.log('4. Check console for the debugging information');
console.log('5. Test generation flow to see where it breaks');

console.log('\n📚 Documentation:');
console.log('- See TEST_LOGIN.md for detailed testing instructions');
console.log('- See DEBUGGING_SETUP.md for debugging guide');

console.log('\n🚀 Ready to test! The app will now "scream" when something goes wrong.');
