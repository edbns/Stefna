#!/usr/bin/env node

/**
 * Netlify Database Diagnostic Script
 * 
 * This script checks what database Netlify is connecting to
 * and verifies the schema matches expectations.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNetlifyDatabase() {
  console.log('🔍 [Netlify DB Check] Checking database connection and schema...\n');

  try {
    // 1. Check database connection
    console.log('📋 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // 2. Check what database we're connected to
    console.log('\n📋 Checking database info...');
    const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    console.log('✅ Database info:', dbInfo);

    // 3. Check if preset_key columns exist
    console.log('\n📋 Checking preset_key columns...');
    
    const tables = [
      'emotion_mask_media',
      'ghibli_reaction_media', 
      'presets_media',
      'custom_prompt_media',
      'neo_glitch_media'
    ];

    for (const table of tables) {
      try {
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = ${table}
          AND column_name = 'preset_key'
        `;
        
        if (columns.length > 0) {
          console.log(`✅ ${table}: preset_key column exists`);
        } else {
          console.log(`❌ ${table}: preset_key column MISSING`);
        }
      } catch (error) {
        console.log(`❌ ${table}: Error checking columns - ${error.message}`);
      }
    }

    // 4. Check table structure
    console.log('\n📋 Checking table structure...');
    for (const table of tables) {
      try {
        const structure = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = ${table}
          ORDER BY ordinal_position
        `;
        
        console.log(`\n📊 ${table} structure:`);
        structure.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
      } catch (error) {
        console.log(`❌ ${table}: Error checking structure - ${error.message}`);
      }
    }

    // 5. Test actual queries
    console.log('\n📋 Testing actual Prisma queries...');
    
    try {
      const emotionResult = await prisma.emotionMaskMedia.findFirst({
        select: { presetKey: true }
      });
      console.log('✅ emotionMaskMedia query: SUCCESS');
    } catch (error) {
      console.log('❌ emotionMaskMedia query: FAILED -', error.message);
    }

    try {
      const ghibliResult = await prisma.ghibliReactionMedia.findFirst({
        select: { presetKey: true }
      });
      console.log('✅ ghibliReactionMedia query: SUCCESS');
    } catch (error) {
      console.log('❌ ghibliReactionMedia query: FAILED -', error.message);
    }

    try {
      const presetsResult = await prisma.presetsMedia.findFirst({
        select: { presetKey: true }
      });
      console.log('✅ presetsMedia query: SUCCESS');
    } catch (error) {
      console.log('❌ presetsMedia query: FAILED -', error.message);
    }

    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('Check the results above to identify the issue.');

  } catch (error) {
    console.error('❌ [Netlify DB Check] Error:', error.message);
    console.error('   This suggests a database connection or configuration issue.');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkNetlifyDatabase().catch(console.error);
