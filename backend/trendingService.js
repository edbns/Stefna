const puppeteer = require('puppeteer');
const NodeCache = require('node-cache');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Cache with 20 minute TTL
const cache = new NodeCache({ stdTTL: 1200 });

class TrendingService {
  constructor() {
    this.browser = null;
    this.lastRequestTime = {};
    this.minDelay = 1000; // 1 second between requests
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async delay(platform) {
    const now = Date.now();
    const lastRequest = this.lastRequestTime[platform] || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < this.minDelay) {
      await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest));
    }
    
    this.lastRequestTime[platform] = Date.now();
  }

  async scrapeTwitterTrending() {
    const cacheKey = 'twitter_trending';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    await this.delay('twitter');
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto('https://twitter.com/explore/tabs/trending', { waitUntil: 'networkidle2' });
      
      const trends = await page.evaluate(() => {
        const trendElements = document.querySelectorAll('[data-testid="trend"]');
        const results = [];
        
        trendElements.forEach(element => {
          const titleElement = element.querySelector('[dir="ltr"]');
          const categoryElement = element.querySelector('span[style*="color: rgb(83, 100, 113)"]');
          const tweetCountElement = element.querySelector('span[style*="color: rgb(83, 100, 113)"]:last-child');
          
          if (titleElement) {
            const title = titleElement.textContent.trim();
            const isHashtag = title.startsWith('#');
            
            results.push({
              platform: 'twitter',
              type: isHashtag ? 'hashtag' : 'topic',
              title: title,
              hashtag: isHashtag ? title : null,
              category: categoryElement ? categoryElement.textContent.trim() : 'General',
              url: `https://twitter.com/search?q=${encodeURIComponent(title)}`,
              author: null,
              views: tweetCountElement ? tweetCountElement.textContent.trim() : null,
              mediaPreview: null,
              summary: null
            });
          }
        });
        
        return results;
      });
      
      cache.set(cacheKey, trends);
      return trends;
    } catch (error) {
      console.error('Twitter scraping error:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  async scrapeYouTubeTrending() {
    const cacheKey = 'youtube_trending';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    await this.delay('youtube');
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto('https://www.youtube.com/feed/trending', { waitUntil: 'networkidle2' });
      
      const videos = await page.evaluate(() => {
        const videoElements = document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer');
        const results = [];
        
        videoElements.forEach(element => {
          const titleElement = element.querySelector('#video-title, h3 a');
          const channelElement = element.querySelector('#channel-name a, .ytd-channel-name a');
          const viewsElement = element.querySelector('#metadata-line span:first-child, .style-scope.ytd-video-meta-block');
          const thumbnailElement = element.querySelector('img');
          const linkElement = element.querySelector('a#thumbnail, a#video-title');
          
          if (titleElement && linkElement) {
            const title = titleElement.textContent.trim();
            const hashtags = title.match(/#\w+/g) || [];
            
            results.push({
              platform: 'youtube',
              type: 'video',
              title: title,
              hashtag: hashtags.length > 0 ? hashtags[0] : null,
              category: 'Entertainment', // YouTube doesn't expose categories easily
              url: linkElement.href.startsWith('http') ? linkElement.href : `https://youtube.com${linkElement.href}`,
              author: channelElement ? channelElement.textContent.trim() : null,
              views: viewsElement ? viewsElement.textContent.trim() : null,
              mediaPreview: thumbnailElement ? thumbnailElement.src : null,
              summary: null
            });
          }
        });
        
        return results;
      });
      
      cache.set(cacheKey, videos);
      return videos;
    } catch (error) {
      console.error('YouTube scraping error:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  async scrapeTikTokTrending() {
    const cacheKey = 'tiktok_trending';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    await this.delay('tiktok');
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto('https://www.tiktok.com/trending', { waitUntil: 'networkidle2' });
      
      const videos = await page.evaluate(() => {
        const videoElements = document.querySelectorAll('[data-e2e="recommend-list-item-container"]');
        const results = [];
        
        videoElements.forEach(element => {
          const linkElement = element.querySelector('a');
          const imgElement = element.querySelector('img');
          const descElement = element.querySelector('[data-e2e="browse-video-desc"]');
          const authorElement = element.querySelector('[data-e2e="browse-username"]');
          
          if (linkElement) {
            const description = descElement ? descElement.textContent.trim() : '';
            const hashtags = description.match(/#\w+/g) || [];
            
            results.push({
              platform: 'tiktok',
              type: 'video',
              title: description || 'TikTok Video',
              hashtag: hashtags.length > 0 ? hashtags[0] : null,
              category: 'Entertainment',
              url: linkElement.href.startsWith('http') ? linkElement.href : `https://tiktok.com${linkElement.href}`,
              author: authorElement ? authorElement.textContent.trim() : null,
              views: null,
              mediaPreview: imgElement ? imgElement.src : null,
              summary: null
            });
          }
        });
        
        return results;
      });
      
      cache.set(cacheKey, videos);
      return videos;
    } catch (error) {
      console.error('TikTok scraping error:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  async scrapeInstagramExplore() {
    const cacheKey = 'instagram_trending';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    await this.delay('instagram');
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto('https://www.instagram.com/explore/', { waitUntil: 'networkidle2' });
      
      const posts = await page.evaluate(() => {
        const postElements = document.querySelectorAll('article a');
        const results = [];
        
        postElements.forEach((element, index) => {
          if (index < 20) { // Limit to top 20 posts
            const imgElement = element.querySelector('img');
            
            if (imgElement) {
              results.push({
                platform: 'instagram',
                type: 'post',
                title: imgElement.alt || 'Instagram Post',
                hashtag: null, // Would need to access post details for hashtags
                category: 'Social',
                url: element.href.startsWith('http') ? element.href : `https://instagram.com${element.href}`,
                author: null, // Would need post details
                views: null,
                mediaPreview: imgElement.src,
                summary: null
              });
            }
          }
        });
        
        return results;
      });
      
      cache.set(cacheKey, posts);
      return posts;
    } catch (error) {
      console.error('Instagram scraping error:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  async scrapeGoogleTrends() {
    const cacheKey = 'google_trends';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    await this.delay('google');
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto('https://trends.google.com/trends/trendingsearches/daily?geo=US', { waitUntil: 'networkidle2' });
      
      const trends = await page.evaluate(() => {
        const trendElements = document.querySelectorAll('.feed-item');
        const results = [];
        
        trendElements.forEach(element => {
          const titleElement = element.querySelector('.title a');
          const categoryElement = element.querySelector('.source');
          
          if (titleElement) {
            results.push({
              platform: 'google',
              type: 'topic',
              title: titleElement.textContent.trim(),
              hashtag: null,
              category: categoryElement ? categoryElement.textContent.trim() : 'General',
              url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(titleElement.textContent.trim())}`,
              author: null,
              views: null,
              mediaPreview: null,
              summary: null
            });
          }
        });
        
        return results;
      });
      
      cache.set(cacheKey, trends);
      return trends;
    } catch (error) {
      console.error('Google Trends scraping error:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  async getAllTrending() {
    const [twitter, youtube, tiktok, instagram, google] = await Promise.allSettled([
      this.scrapeTwitterTrending(),
      this.scrapeYouTubeTrending(),
      this.scrapeTikTokTrending(),
      this.scrapeInstagramExplore(),
      this.scrapeGoogleTrends()
    ]);

    const results = [];
    
    if (twitter.status === 'fulfilled') results.push(...twitter.value);
    if (youtube.status === 'fulfilled') results.push(...youtube.value);
    if (tiktok.status === 'fulfilled') results.push(...tiktok.value);
    if (instagram.status === 'fulfilled') results.push(...instagram.value);
    if (google.status === 'fulfilled') results.push(...google.value);

    return results;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = TrendingService;