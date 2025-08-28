#!/usr/bin/env ts-node

/**
 * Prisma Field Guard Script
 * 
 * This script scans your functions/ folder for hardcoded field names
 * that might not exist in your current Prisma schema.
 * 
 * Usage: ts-node scripts/fieldGuard.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Known problematic field names that were renamed
const RENAMED_FIELDS = {
  'preset': 'presetKey',
  'media_upload_agreed': 'mediaUploadAgreed',
  'share_to_feed': 'shareToFeed',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'user_id': 'userId',
  'image_url': 'imageUrl',
  'source_url': 'sourceUrl',
  'error_message': 'errorMessage',
  'run_id': 'runId',
  'stability_job_id': 'stabilityJobId'
};

// Fields that should exist in current schema
const VALID_FIELDS = [
  'id', 'userId', 'imageUrl', 'sourceUrl', 'prompt', 'presetKey',
  'status', 'errorMessage', 'runId', 'createdAt', 'updatedAt',
  'stabilityJobId', 'metadata', 'user', 'email', 'name',
  'shareToFeed', 'mediaUploadAgreed', 'credits', 'updatedAt'
];

function scanFile(filePath: string): { file: string; issues: string[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues: string[] = [];
  
  // Check for hardcoded field names
  Object.entries(RENAMED_FIELDS).forEach(([oldField, newField]) => {
    const regex = new RegExp(`\\b${oldField}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      issues.push(`❌ "${oldField}" → should be "${newField}" (${matches.length} occurrences)`);
    }
  });
  
  // Check for potentially invalid field names
  const fieldRegex = /\.(\w+)(?=\s*[:=,}\]]|$)/g;
  let match;
  const foundFields = new Set<string>();
  
  while ((match = fieldRegex.exec(content)) !== null) {
    const field = match[1];
    if (!VALID_FIELDS.includes(field) && !field.startsWith('_') && field !== 'length') {
      foundFields.add(field);
    }
  }
  
  foundFields.forEach(field => {
    if (!field.match(/^(id|userId|email|name|type|status|url|prompt|createdAt|updatedAt)$/)) {
      issues.push(`⚠️  Unknown field: "${field}" - verify this exists in schema`);
    }
  });
  
  return { file: filePath, issues };
}

function scanDirectory(dirPath: string): { file: string; issues: string[] }[] {
  const results: { file: string; issues: string[] }[] = [];
  
  function scanRecursive(currentPath: string) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanRecursive(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
        const result = scanFile(fullPath);
        if (result.issues.length > 0) {
          results.push(result);
        }
      }
    }
  }
  
  scanRecursive(dirPath);
  return results;
}

async function main() {
  console.log('🔍 [Prisma Field Guard] Scanning for potential field issues...\n');
  
  const functionsDir = path.join(process.cwd(), 'netlify', 'functions');
  const srcDir = path.join(process.cwd(), 'src');
  
  let allIssues: { file: string; issues: string[] }[] = [];
  
  if (fs.existsSync(functionsDir)) {
    console.log('📁 Scanning netlify/functions/...');
    const functionIssues = scanDirectory(functionsDir);
    allIssues.push(...functionIssues);
  }
  
  if (fs.existsSync(srcDir)) {
    console.log('📁 Scanning src/...');
    const srcIssues = scanDirectory(srcDir);
    allIssues.push(...srcIssues);
  }
  
  if (allIssues.length === 0) {
    console.log('✅ [Field Guard] No field issues found! Your code looks clean.');
    return;
  }
  
  console.log(`\n🚨 [Field Guard] Found ${allIssues.length} files with potential issues:\n`);
  
  allIssues.forEach(({ file, issues }) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`📄 ${relativePath}:`);
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
  });
  
  console.log('💡 [Field Guard] Recommendations:');
  console.log('   1. Update field names to match current schema.prisma');
  console.log('   2. Use Prisma.ModelSelect types for compile-time safety');
  console.log('   3. Run: npx prisma generate after schema changes');
  console.log('   4. Test with: ts-node scripts/checkFields.ts');
  
  if (allIssues.some(({ issues }) => issues.some(i => i.startsWith('❌')))) {
    process.exit(1);
  }
}

main().catch(console.error);
