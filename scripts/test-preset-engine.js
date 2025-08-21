#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 Testing 25-PRESET ENGINE Setup...\n');

// Test 1: Check if required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
  'src/config/presetEngine.ts',
  'src/components/PresetSelector.tsx',
  'src/components/PresetEngineDemo.tsx',
  'src/hooks/usePresetEngine.ts',
  '25_PRESET_ENGINE_README.md'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check if professional-presets.ts exists (dependency)
console.log('\n📁 Checking dependencies...');
const dependencyFiles = [
  'src/config/professional-presets.ts'
];

dependencyFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING (required dependency)`);
    allFilesExist = false;
  }
});

// Test 3: Check package.json for required dependencies
console.log('\n📦 Checking package.json...');
try {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check if React and TypeScript are available
  const hasReact = packageJson.dependencies?.react || packageJson.devDependencies?.react;
  const hasTypeScript = packageJson.devDependencies?.typescript;
  
  if (hasReact) {
    console.log('✅ React dependency found');
  } else {
    console.log('❌ React dependency not found');
  }
  
  if (hasTypeScript) {
    console.log('✅ TypeScript dependency found');
  } else {
    console.log('❌ TypeScript dependency not found');
  }
  
} catch (error) {
  console.log('❌ Could not read package.json:', error.message);
}

// Test 4: Check if build output exists
console.log('\n🔨 Checking build output...');
const buildFiles = [
  'dist',
  'build'
];

let hasBuildOutput = false;
buildFiles.forEach(dir => {
  const buildPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(buildPath)) {
    console.log(`✅ Build output found in ${dir}/`);
    hasBuildOutput = true;
  }
});

if (!hasBuildOutput) {
  console.log('⚠️  No build output found - run "npm run build" first');
}

// Test 5: Check preset engine structure
console.log('\n🔧 Checking preset engine structure...');
try {
  const presetEnginePath = path.join(__dirname, '..', 'src/config/presetEngine.ts');
  const presetEngineContent = fs.readFileSync(presetEnginePath, 'utf8');
  
  // Check for key functions and types
  const requiredExports = [
    'getActivePresets',
    'getPresetByKey',
    'searchPresets',
    'forceRotation',
    'resetRotation',
    'getRotationStatus',
    'PresetOption',
    'PresetCategory'
  ];
  
  let allExportsFound = true;
  requiredExports.forEach(exportName => {
    if (presetEngineContent.includes(exportName)) {
      console.log(`✅ ${exportName} export found`);
    } else {
      console.log(`❌ ${exportName} export missing`);
      allExportsFound = false;
    }
  });
  
  if (allExportsFound) {
    console.log('✅ All preset engine exports found');
  }
  
} catch (error) {
  console.log('❌ Could not read preset engine file:', error.message);
}

// Test 6: Check component structure
console.log('\n🎨 Checking component structure...');
try {
  const presetSelectorPath = path.join(__dirname, '..', 'src/components/PresetSelector.tsx');
  const presetSelectorContent = fs.readFileSync(presetSelectorPath, 'utf8');
  
  // Check for key component features
  const requiredFeatures = [
    'PresetSelector',
    'useState',
    'useEffect',
    'onSelect',
    'showRotationControls',
    'showSearch',
    'showCategories'
  ];
  
  let allFeaturesFound = true;
  requiredFeatures.forEach(feature => {
    if (presetSelectorContent.includes(feature)) {
      console.log(`✅ ${feature} feature found`);
    } else {
      console.log(`❌ ${feature} feature missing`);
      allFeaturesFound = false;
    }
  });
  
  if (allFeaturesFound) {
    console.log('✅ All component features found');
  }
  
} catch (error) {
  console.log('❌ Could not read PresetSelector component:', error.message);
}

// Test 7: Check hooks structure
console.log('\n🎣 Checking hooks structure...');
try {
  const hooksPath = path.join(__dirname, '..', 'src/hooks/usePresetEngine.ts');
  const hooksContent = fs.readFileSync(hooksPath, 'utf8');
  
  // Check for key hook functions
  const requiredHooks = [
    'usePresetEngine',
    'usePresetAPI',
    'usePresetRotation',
    'usePresetSearch'
  ];
  
  let allHooksFound = true;
  requiredHooks.forEach(hookName => {
    if (hooksContent.includes(hookName)) {
      console.log(`✅ ${hookName} hook found`);
    } else {
      console.log(`❌ ${hookName} hook missing`);
      allHooksFound = false;
    }
  });
  
  if (allHooksFound) {
    console.log('✅ All preset engine hooks found');
  }
  
} catch (error) {
  console.log('❌ Could not read hooks file:', error.message);
}

// Test 8: Check demo component
console.log('\n🎭 Checking demo component...');
try {
  const demoPath = path.join(__dirname, '..', 'src/components/PresetEngineDemo.tsx');
  const demoContent = fs.readFileSync(demoPath, 'utf8');
  
  // Check for key demo features
  const requiredDemoFeatures = [
    'PresetEngineDemo',
    'PresetSelector',
    'useState',
    'handlePresetSelect',
    'apiPayload'
  ];
  
  let allDemoFeaturesFound = true;
  requiredDemoFeatures.forEach(feature => {
    if (demoContent.includes(feature)) {
      console.log(`✅ ${feature} demo feature found`);
    } else {
      console.log(`❌ ${feature} demo feature missing`);
      allDemoFeaturesFound = false;
    }
  });
  
  if (allDemoFeaturesFound) {
    console.log('✅ All demo features found');
  }
  
} catch (error) {
  console.log('❌ Could not read demo component:', error.message);
}

// Test 9: Check README
console.log('\n📚 Checking documentation...');
try {
  const readmePath = path.join(__dirname, '..', '25_PRESET_ENGINE_README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  
  // Check for key documentation sections
  const requiredSections = [
    '25-PRESET ENGINE',
    'Quick Start',
    'File Structure',
    'API Reference',
    'Smart Rotation System'
  ];
  
  let allSectionsFound = true;
  requiredSections.forEach(section => {
    if (readmeContent.includes(section)) {
      console.log(`✅ ${section} section found`);
    } else {
      console.log(`❌ ${section} section missing`);
      allSectionsFound = false;
    }
  });
  
  if (allSectionsFound) {
    console.log('✅ All documentation sections found');
  }
  
} catch (error) {
  console.log('❌ Could not read README:', error.message);
}

// Final Summary
console.log('\n🎯 25-PRESET ENGINE Test Summary');
console.log('================================');

if (allFilesExist) {
  console.log('✅ All required files are present');
} else {
  console.log('❌ Some required files are missing');
}

if (hasBuildOutput) {
  console.log('✅ Build output is available');
} else {
  console.log('⚠️  Build output not found - run "npm run build"');
}

console.log('\n🚀 Next Steps:');
console.log('1. Run "npm run build" to ensure everything compiles');
console.log('2. Import PresetSelector into your main app');
console.log('3. Use usePresetEngine hook for integration');
console.log('4. Test the rotation system and search functionality');

console.log('\n📖 See 25_PRESET_ENGINE_README.md for complete documentation!');
console.log('🎭 See EMOTION_MASK_README.md for Emotion Mask system details!');
console.log('🟪 See GHIBLI_REACTION_README.md for Ghibli Reaction system details!');
console.log('🟥 See NEO_TOKYO_GLITCH_README.md for Neo Tokyo Glitch system details!');

console.log('\n✨ 25-PRESET ENGINE setup complete! 🎨');
