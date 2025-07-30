const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const TrendingService = require('./trendingService');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const trendingService = new TrendingService();

// Routes
app.get('/api/trending/all', async (req, res) => {
  try {
    const trends = await trendingService.getAllTrending();
    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching all trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending data'
    });
  }
});

app.get('/api/trending/twitter', async (req, res) => {
  try {
    const trends = await trendingService.scrapeTwitterTrending();
    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching Twitter trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Twitter trending data'
    });
  }
});

app.get('/api/trending/youtube', async (req, res) => {
  try {
    const trends = await trendingService.scrapeYouTubeTrending();
    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching YouTube trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch YouTube trending data'
    });
  }
});

app.get('/api/trending/tiktok', async (req, res) => {
  try {
    const trends = await trendingService.scrapeTikTokTrending();
    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching TikTok trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TikTok trending data'
    });
  }
});

app.get('/api/trending/instagram', async (req, res) => {
  try {
    const trends = await trendingService.scrapeInstagramExplore();
    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching Instagram trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Instagram trending data'
    });
  }
});

app.get('/api/trending/google', async (req, res) => {
  try {
    const trends = await trendingService.scrapeGoogleTrends();
    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching Google trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Google trending data'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await trendingService.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await trendingService.cleanup();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Trending service running on port ${port}`);
});