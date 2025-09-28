import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
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

  const sitemapXML = generateSitemapXML();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    },
    body: sitemapXML
  };
};
