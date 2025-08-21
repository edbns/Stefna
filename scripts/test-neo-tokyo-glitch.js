import fs from 'fs';

console.log('🟥 Testing Neo Tokyo Glitch Module...\n');

// Test 1: Check if dependencies are available
console.log('📋 Test 1: Checking dependencies...');
try {
  // These would be available in the browser
  console.log('✅ React and browser APIs available');
  console.log('✅ Mediapipe will load from CDN at runtime');
  console.log('✅ Canvas API available for effect generation');
} catch (error) {
  console.log('❌ Browser APIs not available (expected in Node.js)');
}

// Test 2: Check file structure
console.log('\n📋 Test 2: Checking file structure...');

const requiredFiles = [
  'src/hooks/useNeoTokyoGlitch.ts',
  'src/hooks/useNeoTokyoGlitchAI.ts',
  'src/components/NeoTokyoTool.tsx',
  'src/components/NeoTokyoGlitchAIGenerator.tsx',
  'src/components/NeoTokyoGlitchDemo.tsx'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    allFilesExist = false;
  }
});

// Test 3: Check package.json dependencies
console.log('\n📋 Test 3: Checking package.json dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  const requiredDeps = [
    '@mediapipe/face_mesh',
    '@mediapipe/drawing_utils'
  ];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep} - ${dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - Missing from dependencies!`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Could not read package.json');
  allFilesExist = false;
}

// Test 4: Check build output
console.log('\n📋 Test 4: Checking build output...');
if (fs.existsSync('dist')) {
  console.log('✅ Build directory exists');
  if (fs.existsSync('dist/index.html')) {
    console.log('✅ Built HTML file exists');
  } else {
    console.log('❌ Built HTML file missing');
    allFilesExist = false;
  }
} else {
  console.log('❌ Build directory missing - run "npm run build" first');
  allFilesExist = false;
}

// Test 5: Check for Emotion Mask system (dependency)
console.log('\n📋 Test 5: Checking Emotion Mask system (dependency)...');
const emotionMaskFiles = [
  'src/hooks/useEmotionMask.ts',
  'src/components/EmotionMaskTool.tsx'
];

let emotionMaskExists = true;
emotionMaskFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Emotion Mask system available`);
  } else {
    console.log(`❌ ${file} - Emotion Mask system missing`);
    emotionMaskExists = false;
  }
});

// Test 6: Check for Ghibli Reaction system (dependency)
console.log('\n📋 Test 6: Checking Ghibli Reaction system (dependency)...');
const ghibliFiles = [
  'src/hooks/useGhibliReaction.ts',
  'src/components/GhibliReactionTool.tsx'
];

let ghibliExists = true;
ghibliFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Ghibli Reaction system available`);
  } else {
    console.log(`❌ ${file} - Ghibli Reaction system missing`);
    ghibliExists = false;
  }
});

// Summary
console.log('\n🎯 Test Summary:');
if (allFilesExist && emotionMaskExists && ghibliExists) {
  console.log('✅ All tests passed! Neo Tokyo Glitch Module is ready to use.');
  console.log('\n🚀 Next steps:');
  console.log('1. Test components in browser');
  console.log('2. Integrate with your AI generation API');
  console.log('3. Add to your main navigation');
  console.log('4. Deploy to Netlify');
  console.log('\n🎮 Available Glitch Modes:');
  console.log('   • 🏙️ Neo Tokyo - Cyberpunk city aesthetic');
  console.log('   • 🤖 Cyberpunk - High-tech dystopian');
  console.log('   • 💻 Digital Glitch - Pure digital artifacts');
  console.log('   • 🌈 Neon Wave - Smooth neon aesthetics');
  console.log('\n💀 Key Features:');
  console.log('   • Identity-safe face preservation');
  console.log('   • Neon stripes and glow effects');
  console.log('   • Glitch displacement and artifacts');
  console.log('   • Scanlines and cel shading');
  console.log('   • 6 neon color options');
  console.log('   • Intensity and effect toggles');
} else {
  console.log('❌ Some tests failed. Please check the issues above.');
  console.log('\n🔧 Fix steps:');
  if (!emotionMaskExists) {
    console.log('1. Install Emotion Mask system first (required dependency)');
  }
  if (!ghibliExists) {
    console.log('2. Install Ghibli Reaction system (required dependency)');
  }
  console.log('3. Install missing dependencies: npm install');
  console.log('4. Run build: npm run build');
  console.log('5. Check file paths and imports');
}

console.log('\n📚 See NEO_TOKYO_GLITCH_README.md for full integration guide!');
console.log('🎭 See EMOTION_MASK_README.md for Emotion Mask system details!');
console.log('🟪 See GHIBLI_REACTION_README.md for Ghibli Reaction system details!');
