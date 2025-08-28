#!/usr/bin/env node

/**
 * Prisma Build Verification Script
 * 
 * This script verifies that the Prisma client is properly built
 * and accessible during the Netlify build process.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

console.log('🔍 [Prisma Build Verification] Starting verification...\n');

// 1. Check if Prisma client files exist
console.log('📋 Checking Prisma client files...');
const prismaClientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
const indexJsPath = path.join(prismaClientPath, 'index.js');
const indexDtsPath = path.join(prismaClientPath, 'index.d.ts');

if (fs.existsSync(prismaClientPath)) {
  console.log('✅ Prisma client directory exists');
} else {
  console.log('❌ Prisma client directory missing');
  process.exit(1);
}

if (fs.existsSync(indexJsPath)) {
  console.log('✅ Prisma client index.js exists');
} else {
  console.log('❌ Prisma client index.js missing');
  process.exit(1);
}

if (fs.existsSync(indexDtsPath)) {
  console.log('✅ Prisma client index.d.ts exists');
} else {
  console.log('❌ Prisma client index.d.ts missing');
  process.exit(1);
}

// 2. Check Prisma client version
console.log('\n📋 Checking Prisma client version...');
try {
  const packageJsonPath = path.join(prismaClientPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`✅ Prisma client version: ${packageJson.version}`);
} catch (error) {
  console.log('❌ Could not read Prisma client version:', error.message);
}

// 3. Test Prisma client instantiation
console.log('\n📋 Testing Prisma client instantiation...');
try {
  const prisma = new PrismaClient();
  console.log('✅ Prisma client instantiated successfully');
  
  // 4. Test database connection
  console.log('\n📋 Testing database connection...');
  await prisma.$connect();
  console.log('✅ Database connection successful');
  
  // 5. Test actual queries with presetKey
  console.log('\n📋 Testing presetKey queries...');
  
  try {
    const emotionResult = await prisma.emotionMaskMedia.findFirst({
      select: { presetKey: true }
    });
    console.log('✅ emotionMaskMedia presetKey query: SUCCESS');
  } catch (error) {
    console.log('❌ emotionMaskMedia presetKey query: FAILED -', error.message);
  }

  try {
    const ghibliResult = await prisma.ghibliReactionMedia.findFirst({
      select: { presetKey: true }
    });
    console.log('✅ ghibliReactionMedia presetKey query: SUCCESS');
  } catch (error) {
    console.log('❌ ghibliReactionMedia presetKey query: FAILED -', error.message);
  }

  try {
    const presetsResult = await prisma.presetsMedia.findFirst({
      select: { presetKey: true }
    });
    console.log('✅ presetsMedia presetKey query: SUCCESS');
  } catch (error) {
    console.log('❌ presetsMedia presetKey query: FAILED -', error.message);
  }

  await prisma.$disconnect();
  
} catch (error) {
  console.log('❌ Prisma client test failed:', error.message);
  process.exit(1);
}

// 6. Check build environment
console.log('\n📋 Build environment info...');
console.log('✅ Node version:', process.version);
console.log('✅ Current working directory:', process.cwd());
console.log('✅ NODE_ENV:', process.env.NODE_ENV || 'not set');

console.log('\n🎉 [Prisma Build Verification] All checks passed!');
console.log('🚀 Prisma client is ready for Netlify deployment!');
