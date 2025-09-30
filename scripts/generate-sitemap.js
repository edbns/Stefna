#!/usr/bin/env node

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function generateSitemap() {
  try {
    console.log('🗺️ Generating static sitemap...');
    
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Fetch published stories from database
    let storyEntries = [];
    try {
      const result = await pool.query(`
        SELECT slug, updated_at 
        FROM stories 
        WHERE status = 'published'
        ORDER BY created_at DESC
      `);
      
      storyEntries = result.rows.map(story => ({
        url: `https://stefna.xyz/story/${story.slug}`,
        lastmod: story.updated_at ? story.updated_at.split('T')[0] : currentDate,
        changefreq: 'monthly',
        priority: '0.9'
      }));
      
      console.log(`📚 Found ${storyEntries.length} published stories`);
    } catch (error) {
      console.error('❌ Error fetching stories for sitemap:', error);
    }

    // Define static sitemap entries
    const staticEntries = [
      {
        url: 'https://stefna.xyz/',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        url: 'https://stefna.xyz/best-practices',
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        url: 'https://stefna.xyz/privacy',
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.3'
      },
      {
        url: 'https://stefna.xyz/terms',
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.3'
      },
      {
        url: 'https://stefna.xyz/cookies',
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.3'
      },
      // Social Media & Community
      {
        url: 'https://stefna.xyz/feed',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.9'
      },
      // Popular AI Art Tags
      {
        url: 'https://stefna.xyz/tag/cyber_siren',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.7'
      },
      {
        url: 'https://stefna.xyz/tag/ghibli_reaction',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.7'
      },
      {
        url: 'https://stefna.xyz/tag/unreal_reflection',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.7'
      },
      {
        url: 'https://stefna.xyz/tag/parallel_self',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.7'
      },
      {
        url: 'https://stefna.xyz/tag/custom_prompt',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.7'
      }
    ];

    // Add story archive page
    const storyArchiveEntry = {
      url: 'https://stefna.xyz/story',
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.8'
    };

    // Combine all entries
    const sitemapEntries = [
      ...staticEntries,
      storyArchiveEntry,
      ...storyEntries
    ];

    // Generate XML content
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    sitemapEntries.forEach(entry => {
      xml += '  <url>\n';
      xml += `    <loc>${entry.url}</loc>\n`;
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';

    // Write sitemap to public directory
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, xml, 'utf8');
    
    console.log(`✅ Sitemap generated successfully with ${sitemapEntries.length} URLs`);
    console.log(`📁 Saved to: ${sitemapPath}`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
generateSitemap();
