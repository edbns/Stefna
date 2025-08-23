#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';

async function checkDuplicates() {
  try {
    console.log('🔍 Investigating potential duplicate Neo Glitch items...');
    
    const dbUrl = 'postgresql://neondb_owner:npg_TuC4URbHD9cf@ep-restless-rain-a1sbm8zu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
    const sql = neon(dbUrl);
    
    // Check recent Neo Glitch items
    console.log('\n📊 Recent Neo Glitch items (last 24 hours):');
    const recentNeoGlitch = await sql`
      SELECT 
        id, user_id, created_at, prompt, final_url, preset_key,
        meta
      FROM media_assets 
      WHERE preset_key = 'neotokyoglitch' 
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
    `;
    
    console.log(`Found ${recentNeoGlitch.length} Neo Glitch items in last 24 hours:`);
    recentNeoGlitch.forEach((item, index) => {
      console.log(`\n${index + 1}. ID: ${item.id}`);
      console.log(`   User: ${item.user_id}`);
      console.log(`   Created: ${item.created_at}`);
      console.log(`   Preset: ${item.preset_key}`);
      console.log(`   URL: ${item.final_url?.substring(0, 80)}...`);
      console.log(`   Meta: ${JSON.stringify(item.meta)}`);
    });
    
    // Check for potential duplicates by user and prompt
    console.log('\n🔍 Checking for potential duplicates by user and prompt...');
    const potentialDuplicates = await sql`
      SELECT 
        user_id, 
        prompt, 
        COUNT(*) as count,
        ARRAY_AGG(id) as ids,
        ARRAY_AGG(created_at) as timestamps
      FROM media_assets 
      WHERE preset_key = 'neotokyoglitch'
      GROUP BY user_id, prompt
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    if (potentialDuplicates.length > 0) {
      console.log(`\n🚨 Found ${potentialDuplicates.length} potential duplicate groups:`);
      potentialDuplicates.forEach((group, index) => {
        console.log(`\n${index + 1}. User: ${group.user_id}`);
        console.log(`   Prompt: ${group.prompt?.substring(0, 100)}...`);
        console.log(`   Count: ${group.count}`);
        console.log(`   IDs: ${group.ids.join(', ')}`);
        console.log(`   Timestamps: ${group.timestamps.join(', ')}`);
      });
    } else {
      console.log('\n✅ No duplicate groups found by user and prompt');
    }
    
    // Check for items with very similar timestamps (within 1 minute)
    console.log('\n⏰ Checking for items with very similar timestamps...');
    const similarTimestamps = await sql`
      SELECT 
        a.id as id1, a.user_id as user1, a.created_at as time1, a.prompt as prompt1,
        b.id as id2, b.user_id as user2, b.created_at as time2, b.prompt as prompt2,
        EXTRACT(EPOCH FROM (b.created_at - a.created_at)) as seconds_diff
      FROM media_assets a
      JOIN media_assets b ON a.user_id = b.user_id 
        AND a.preset_key = b.preset_key
        AND a.id < b.id
        AND a.preset_key = 'neotokyoglitch'
        AND EXTRACT(EPOCH FROM (b.created_at - a.created_at)) < 60
      ORDER BY a.created_at DESC
    `;
    
    if (similarTimestamps.length > 0) {
      console.log(`\n⚠️  Found ${similarTimestamps.length} pairs with timestamps < 60 seconds apart:`);
      similarTimestamps.forEach((pair, index) => {
        console.log(`\n${index + 1}. User: ${pair.user1}`);
        console.log(`   Time diff: ${pair.seconds_diff} seconds`);
        console.log(`   Item 1: ${pair.id1} at ${pair.time1}`);
        console.log(`   Item 2: ${pair.id2} at ${pair.time2}`);
        console.log(`   Prompt 1: ${pair.prompt1?.substring(0, 80)}...`);
        console.log(`   Prompt 2: ${pair.prompt2?.substring(0, 80)}...`);
      });
    } else {
      console.log('\n✅ No items with very similar timestamps found');
    }
    
    // Check total counts by preset
    console.log('\n📈 Total counts by preset:');
    const presetCounts = await sql`
      SELECT 
        preset_key, 
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM media_assets 
      WHERE preset_key IS NOT NULL
      GROUP BY preset_key
      ORDER BY count DESC
    `;
    
    presetCounts.forEach(preset => {
      console.log(`  ${preset.preset_key || 'NULL'}: ${preset.count} items, ${preset.unique_users} users`);
    });
    
  } catch (error) {
    console.error('❌ Error checking duplicates:', error.message);
  }
}

checkDuplicates();
