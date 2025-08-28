#!/usr/bin/env node

/**
 * Database Column Check Script
 * 
 * This script checks what columns actually exist in the database
 * vs what Prisma schema expects, to identify schema drift.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseColumns() {
  console.log('🔍 [Database Check] Checking actual database columns...\n');

  try {
    // Check emotion_mask_media table columns
    console.log('📋 Checking emotion_mask_media table...');
    const emotionColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'emotion_mask_media'
      ORDER BY ordinal_position
    `;
    
    console.log('✅ emotion_mask_media columns found:');
    emotionColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check if preset_key column exists
    const hasPresetKey = emotionColumns.some(col => col.column_name === 'preset_key');
    console.log(`\n🔍 preset_key column exists: ${hasPresetKey ? '✅ YES' : '❌ NO'}`);

    if (!hasPresetKey) {
      console.log('\n🚨 SCHEMA DRIFT DETECTED!');
      console.log('   Prisma schema expects preset_key but database is missing it.');
      console.log('\n🔧 To fix this, run in Neon console:');
      console.log('   ALTER TABLE emotion_mask_media ADD COLUMN preset_key TEXT;');
    }

    // Check other media tables for comparison
    console.log('\n📋 Checking other media tables for preset columns...');
    const allPresetColumns = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE table_name IN (
        'emotion_mask_media',
        'ghibli_reaction_media', 
        'presets_media',
        'custom_prompt_media',
        'neo_glitch_media'
      )
      AND column_name LIKE '%preset%'
      ORDER BY table_name, ordinal_position
    `;

    console.log('✅ Preset-related columns found:');
    allPresetColumns.forEach(col => {
      console.log(`   - ${col.table_name}.${col.column_name} (${col.data_type})`);
    });

    // Summary
    console.log('\n📊 SUMMARY:');
    const tablesWithPresetKey = [...new Set(allPresetColumns.map(col => col.table_name))];
    console.log(`   Tables with preset columns: ${tablesWithPresetKey.join(', ')}`);
    
    if (!hasPresetKey) {
      console.log('\n🚨 ACTION REQUIRED:');
      console.log('   1. Add missing preset_key column to emotion_mask_media');
      console.log('   2. Run: npx prisma generate');
      console.log('   3. Test: node scripts/checkFields.js');
    }

  } catch (error) {
    console.error('❌ [Database Check] Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseColumns().catch(console.error);
