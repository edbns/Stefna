#!/usr/bin/env node

/**
 * Test Query Script
 * 
 * This script tests the exact query that's failing in getPublicFeed
 * to identify the real issue.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFeedQuery() {
  console.log('🔍 [Test Query] Testing the exact query from getPublicFeed...\n');

  try {
    // Test the exact query that's failing
    console.log('📋 Testing emotion_mask_media.findMany with preset_key...');
    
    const emotionResults = await prisma.emotionMaskMedia.findMany({
      where: { status: 'completed' },
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        prompt: true,
        presetKey: true, // This is what's failing
        status: true,
        sourceUrl: true,
        errorMessage: true,
        runId: true,
        createdAt: true,
        updatedAt: true,
        metadata: true
      },
      take: 1
    });

    console.log('✅ emotion_mask_media query SUCCESSFUL!');
    console.log('   Results:', emotionResults.length);
    if (emotionResults.length > 0) {
      console.log('   Sample record:', {
        id: emotionResults[0].id,
        presetKey: emotionResults[0].presetKey,
        status: emotionResults[0].status
      });
    }

    // Test other media types too
    console.log('\n📋 Testing other media types...');
    
    const ghibliResults = await prisma.ghibliReactionMedia.findMany({
      where: { status: 'completed' },
      select: { presetKey: true },
      take: 1
    });
    console.log('✅ ghibli_reaction_media query SUCCESSFUL!');

    const presetsResults = await prisma.presetsMedia.findMany({
      where: { status: 'completed' },
      select: { presetKey: true },
      take: 1
    });
    console.log('✅ presets_media query SUCCESSFUL!');

    const customResults = await prisma.customPromptMedia.findMany({
      where: { status: 'completed' },
      select: { presetKey: true },
      take: 1
    });
    console.log('✅ custom_prompt_media query SUCCESSFUL!');

    const neoResults = await prisma.neoGlitchMedia.findMany({
      where: { status: 'completed' },
      select: { presetKey: true },
      take: 1
    });
    console.log('✅ neo_glitch_media query SUCCESSFUL!');

    console.log('\n🎉 ALL QUERIES SUCCESSFUL!');
    console.log('   The preset_key columns are working fine locally.');

  } catch (error) {
    console.error('❌ [Test Query] Query FAILED:', error.message);
    console.error('   Error details:', error);
    
    if (error.message.includes('preset_key')) {
      console.log('\n🚨 This confirms the schema mismatch issue.');
      console.log('   The database column exists but Prisma can\'t access it.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFeedQuery().catch(console.error);
