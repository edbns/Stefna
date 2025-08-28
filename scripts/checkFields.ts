#!/usr/bin/env ts-node

/**
 * Prisma Field Safety Check Script
 * 
 * This script validates that all field names used in queries
 * actually exist in the current Prisma schema.
 * 
 * Run this after any schema changes to catch field issues locally.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllFields() {
  console.log('🔍 [Prisma Safety Check] Starting field validation...\n');

  try {
    // Test CustomPromptMedia fields
    console.log('📋 Testing CustomPromptMedia fields...');
    const customPrompt = await prisma.customPromptMedia.findFirst({
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        prompt: true,
        presetKey: true, // ✅ Should work
        status: true,
        sourceUrl: true, // ✅ Should work
        errorMessage: true, // ✅ Should work
        runId: true, // ✅ Should work
        createdAt: true,
        updatedAt: true, // ✅ Should work
        metadata: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    console.log('✅ CustomPromptMedia: All fields valid\n');

    // Test EmotionMaskMedia fields
    console.log('📋 Testing EmotionMaskMedia fields...');
    const emotionMask = await prisma.emotionMaskMedia.findFirst({
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        prompt: true,
        presetKey: true, // ✅ Should work
        status: true,
        sourceUrl: true, // ✅ Should work
        errorMessage: true, // ✅ Should work
        runId: true, // ✅ Should work
        createdAt: true,
        updatedAt: true, // ✅ Should work
        metadata: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    console.log('✅ EmotionMaskMedia: All fields valid\n');

    // Test PresetsMedia fields
    console.log('📋 Testing PresetsMedia fields...');
    const presets = await prisma.presetsMedia.findFirst({
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        prompt: true,
        presetKey: true, // ✅ Should work
        status: true,
        sourceUrl: true, // ✅ Should work
        errorMessage: true, // ✅ Should work
        runId: true, // ✅ Should work
        createdAt: true,
        updatedAt: true, // ✅ Should work
        metadata: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    console.log('✅ PresetsMedia: All fields valid\n');

    // Test GhibliReactionMedia fields
    console.log('📋 Testing GhibliReactionMedia fields...');
    const ghibli = await prisma.ghibliReactionMedia.findFirst({
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        prompt: true,
        presetKey: true, // ✅ Should work
        status: true,
        sourceUrl: true, // ✅ Should work
        errorMessage: true, // ✅ Should work
        runId: true, // ✅ Should work
        createdAt: true,
        updatedAt: true, // ✅ Should work
        metadata: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    console.log('✅ GhibliReactionMedia: All fields valid\n');

    // Test NeoGlitchMedia fields
    console.log('📋 Testing NeoGlitchMedia fields...');
    const neoGlitch = await prisma.neoGlitchMedia.findFirst({
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        prompt: true,
        presetKey: true, // ✅ Should work
        status: true,
        sourceUrl: true, // ✅ Should work
        errorMessage: true, // ✅ Should work
        runId: true, // ✅ Should work
        createdAt: true,
        updatedAt: true, // ✅ Should work
        stabilityJobId: true, // ✅ Should work
        metadata: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    console.log('✅ NeoGlitchMedia: All fields valid\n');

    // Test UserSettings fields
    console.log('📋 Testing UserSettings fields...');
    const userSettings = await prisma.userSettings.findFirst({
      select: {
        id: true,
        userId: true,
        shareToFeed: true,
        mediaUploadAgreed: true, // ✅ Should work
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    console.log('✅ UserSettings: All fields valid\n');

    console.log('🎉 [Prisma Safety Check] ALL FIELDS VALID! No schema issues found.');
    console.log('🚀 Safe to deploy to Netlify!');

  } catch (error: any) {
    console.error('❌ [Prisma Safety Check] FIELD VALIDATION FAILED!');
    console.error('Error:', error.message);
    console.error('\n🔧 This means there are schema mismatches that need fixing.');
    console.error('💡 Check the error above and update your schema.prisma accordingly.');
    console.error('📝 Then run: npx prisma generate && npx prisma db push');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the safety check
checkAllFields().catch(console.error);
