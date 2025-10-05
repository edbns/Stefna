#!/usr/bin/env node

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function investigateDuplicates() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('\n=== CHECKING MEDIA TABLE STRUCTURES ===');
    
    // Check what media tables actually exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%_media'
      ORDER BY table_name
    `);
    
    console.log('Media tables found:', tablesResult.rows.map(r => r.table_name));

    // Check ID generation methods for each table
    console.log('\n=== CHECKING ID GENERATION METHODS ===');
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      const columnResult = await client.query(`
        SELECT column_name, column_default, data_type
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'id'
      `, [tableName]);
      
      if (columnResult.rows.length > 0) {
        const col = columnResult.rows[0];
        console.log(`${tableName}: ${col.data_type} DEFAULT ${col.column_default}`);
      }
    }

    // Check for actual duplicate IDs across tables
    console.log('\n=== CHECKING FOR DUPLICATE IDs ACROSS TABLES ===');
    
    const duplicateCheckQuery = `
      WITH all_media_ids AS (
        SELECT id, 'cyber_siren_media' as table_name FROM cyber_siren_media WHERE id IS NOT NULL
        UNION ALL
        SELECT id, 'presets_media' as table_name FROM presets_media WHERE id IS NOT NULL
        UNION ALL
        SELECT id, 'unreal_reflection_media' as table_name FROM unreal_reflection_media WHERE id IS NOT NULL
        UNION ALL
        SELECT id, 'parallel_self_media' as table_name FROM parallel_self_media WHERE id IS NOT NULL
        UNION ALL
        SELECT id, 'ghibli_reaction_media' as table_name FROM ghibli_reaction_media WHERE id IS NOT NULL
        UNION ALL
        SELECT id, 'custom_prompt_media' as table_name FROM custom_prompt_media WHERE id IS NOT NULL
        UNION ALL
        SELECT id, 'edit_media' as table_name FROM edit_media WHERE id IS NOT NULL
      )
      SELECT id, COUNT(*) as count, STRING_AGG(table_name, ', ') as tables
      FROM all_media_ids
      GROUP BY id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    const duplicatesResult = await client.query(duplicateCheckQuery);
    
    if (duplicatesResult.rows.length > 0) {
      console.log('🚨 DUPLICATE IDs FOUND:');
      duplicatesResult.rows.forEach(row => {
        console.log(`ID: ${row.id} appears in ${row.count} tables: ${row.tables}`);
      });
    } else {
      console.log('✅ No duplicate IDs found across media tables');
    }

    // Check actual feed data
    console.log('\n=== CHECKING ACTUAL FEED DATA ===');
    
    const feedQuery = `
      with allowed_users as (
        select user_id from user_settings where share_to_feed = true
      ),
      feed as (
        select 'cyber_siren' as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'cyber_siren' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from cyber_siren_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        union all
        select 'presets' as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'presets' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from presets_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        union all
        select 'unreal_reflection' as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'unreal_reflection' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from unreal_reflection_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        union all
        select 'parallel_self' as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'parallel_self' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from parallel_self_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        union all
        select 'ghibli_reaction' as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'ghibli_reaction' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from ghibli_reaction_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        union all
        select 'custom_prompt' as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'custom_prompt' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from custom_prompt_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        union all
        select 'edit' as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, null as preset, status, created_at, 'edit' as "mediaType", null as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from edit_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      )
      select *
      from feed f
      join allowed_users u on u.user_id = f.user_id
      order by created_at desc
      limit 20
    `;

    const feedResult = await client.query(feedQuery);
    console.log(`Feed query returned ${feedResult.rows.length} items`);
    
    // Check for duplicate IDs in the feed result
    const feedIds = feedResult.rows.map(row => row.id);
    const uniqueIds = new Set(feedIds);
    
    if (feedIds.length !== uniqueIds.size) {
      console.log('🚨 DUPLICATE IDs IN FEED:');
      const duplicates = feedIds.filter((id, index) => feedIds.indexOf(id) !== index);
      console.log('Duplicate IDs:', [...new Set(duplicates)]);
    } else {
      console.log('✅ No duplicate IDs in feed sample');
    }

    // Show sample feed data
    console.log('\n=== SAMPLE FEED DATA ===');
    feedResult.rows.slice(0, 5).forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Type: ${row.type}, User: ${row.user_id}, Created: ${row.created_at}`);
    });

    // Check table counts
    console.log('\n=== TABLE COUNTS ===');
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`${tableName}: ${countResult.rows[0].count} records`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

investigateDuplicates();
