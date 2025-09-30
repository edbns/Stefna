#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current date in YYYY-MM-DD format
const currentDate = new Date().toISOString().split('T')[0];

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Function to fetch stories from database
async function fetchStories() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT slug, updated_at 
      FROM stories 
      WHERE status = 'published' 
      AND slug IS NOT NULL 
      AND slug != ''
      ORDER BY updated_at DESC
      LIMIT 100
    `);
    client.release();
    return result.rows;
  } catch (error) {
    console.warn('⚠️ Could not fetch stories from database:', error.message);
    return [];
  }
}

// Function to generate sitemap entries
async function generateSitemapEntries() {
  // Static pages
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
    // Stories index page
    {
      url: 'https://stefna.xyz/story',
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.8'
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

  // Fetch stories from database
  const stories = await fetchStories();
  console.log(`📚 Found ${stories.length} stories to include in sitemap`);

  // Add story entries
  const storyEntries = stories.map(story => ({
    url: `https://stefna.xyz/story/${story.slug}`,
    lastmod: story.updated_at ? story.updated_at.split('T')[0] : currentDate,
    changefreq: 'weekly',
    priority: '0.6'
  }));

  return [...staticEntries, ...storyEntries];
}

// Generate XML content
const generateSitemapXML = (sitemapEntries) => {
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
  return xml;
};

// Main function
async function main() {
  try {
    // Generate sitemap entries
    const sitemapEntries = await generateSitemapEntries();
    
    // Generate XML
    const sitemapXML = generateSitemapXML(sitemapEntries);
    
    // Write sitemap to public directory
    const publicDir = path.join(__dirname, '..', 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    
    fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
    
    console.log(`✅ Sitemap generated successfully with date: ${currentDate}`);
    console.log(`📁 Location: ${sitemapPath}`);
    console.log(`📊 Total URLs: ${sitemapEntries.length}`);
    
    // Close database connection
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the main function
main();
