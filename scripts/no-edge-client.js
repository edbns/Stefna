#!/usr/bin/env node

/**
 * Prebuild Guard: Prevents @prisma/client/edge from being imported
 * This ensures we never accidentally build with the Edge client that requires Data Proxy
 */

import { execSync } from 'node:child_process';
import path from 'path';

console.log('🔍 [Prebuild Guard] Checking for @prisma/client/edge imports...');

try {
  // Search for actual import/require statements, not comments
  const out = execSync('grep -R -E "(import.*@prisma/client/edge|require.*@prisma/client/edge|from.*@prisma/client/edge)" -n . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=scripts', { 
    stdio: 'pipe',
    cwd: process.cwd()
  }).toString();
  
  console.error('❌ [Prebuild Guard] DO NOT import @prisma/client/edge in Netlify functions!');
  console.error('This will cause P6001 errors because Edge client requires Data Proxy URLs.');
  console.error('Found imports:');
  console.error(out);
  console.error('\nFix: Replace with standard import: import { PrismaClient } from "@prisma/client"');
  process.exit(1);
  
} catch (error) {
  // grep exits non-zero when not found — that's what we want
  if (error.status === 1) {
    console.log('✅ [Prebuild Guard] No @prisma/client/edge imports found');
    console.log('✅ [Prebuild Guard] Build can proceed safely');
    process.exit(0);
  } else {
    console.error('❌ [Prebuild Guard] Error during check:', error.message);
    process.exit(1);
  }
}
