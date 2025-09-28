#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get current date in YYYY-MM-DD format
const currentDate = new Date().toISOString().split('T')[0];

// Define sitemap entries
const sitemapEntries = [
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

// Generate XML content
const generateSitemapXML = () => {
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

// Write sitemap to public directory
const publicDir = path.join(__dirname, '..', 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

try {
  const sitemapXML = generateSitemapXML();
  fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
  console.log(`✅ Sitemap generated successfully with date: ${currentDate}`);
  console.log(`📁 Location: ${sitemapPath}`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
