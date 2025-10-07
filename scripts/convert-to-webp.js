#!/usr/bin/env node

/**
 * Convert PNG and JPG images to WebP format for better performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const imagesToConvert = [
  // Root level images
  'favicon.png',
  'logo.png',
  'logo-dark.png',
  'og-image.jpg',
  // Images directory
  'images/Abstract.png',
  'images/Ai brush.png',
  'images/Feed.png',
  'images/Remix.png',
  'images/Social sharing.png',
  'images/parallel_self_afterglow.jpg',
  'images/parallel_self_black_aura.jpg',
  'images/parallel_self_colorcore.jpg',
  'images/parallel_self_getaway_lookbook.jpg',
  'images/parallel_self_neon_proof.jpg',
  'images/parallel_self_the_mechanic.jpg',
  'images/parallel_self_untouchable.jpg',
  'images/unreal_reflection_chromatic_bloom.jpg',
  'images/unreal_reflection_gothic_pact.jpg',
  'images/unreal_reflection_medusa_mirror.jpg',
  'images/unreal_reflection_oracle_seoul.jpg',
  'images/unreal_reflection_the_syndicate.jpg',
  'images/unreal_reflection_Y2K_Paparazzi.jpg',
  'images/unreal_reflection_yakuza_heir.jpg',
];

console.log('🖼️  Converting images to WebP format...\n');

let converted = 0;
let skipped = 0;
let failed = 0;

async function convertImages() {
  for (const imagePath of imagesToConvert) {
    const fullPath = path.join(publicDir, imagePath);
    const webpPath = fullPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    
    // Skip if already exists
    if (fs.existsSync(webpPath)) {
      console.log(`⏭️  Skipped (already exists): ${imagePath}`);
      skipped++;
      continue;
    }
    
    // Check if source exists
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Source not found: ${imagePath}`);
      failed++;
      continue;
    }
    
    try {
      await sharp(fullPath)
        .webp({ quality: 85 })
        .toFile(webpPath);
      console.log(`✅ Converted: ${imagePath} → ${path.basename(webpPath)}`);
      converted++;
    } catch (error) {
      console.error(`❌ Failed: ${imagePath} - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Converted: ${converted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n💡 Next step: Update image references in your code to use .webp extensions!`);
}

convertImages().catch(console.error);
