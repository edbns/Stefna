# SpyDash - Social Media Trending Content Dashboard

![SpyDash Dashboard](https://img.shields.io/badge/SpyDash-Dashboard-blue)
![React](https://img.shields.io/badge/React-18.x-blue)
![Vite](https://img.shields.io/badge/Vite-Latest-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-blue)
![Netlify Functions](https://img.shields.io/badge/Netlify-Functions-orange)

A modern, elegant social media trending content dashboard that tracks viral content across platforms like YouTube, TikTok, and more. Built with React, Vite, Tailwind CSS, and powered by AI-generated insights.

## 🚀 Quick Deployment

Since your API keys are already configured on Netlify:

1. **Connect to Netlify** (if not already connected):
   ```bash
   # Build the project
   npm run build
   
   # Deploy to Netlify manually via drag-and-drop:
   # 1. Go to https://app.netlify.com/
   # 2. Drag the 'dist' folder to deploy
   # 3. Or connect your GitHub repo for automatic deployments
   ```

2. **GitHub + Netlify Auto-Deploy**:
   ```bash
   # Your repo is ready at: https://github.com/edbns/SocialSpy.git
   # Connect this repo to Netlify for automatic deployments
   # Build command: npm run build
   # Publish directory: dist
   # Functions directory: netlify/functions
   ```

3. **Environment Variables** (already set up):
   - `YOUTUBE_API_KEY` ✅
   - `OPENROUTER_API_KEY` ✅
   - Add others as needed: `TWITTER_API_KEY`, `TIKTOK_API_KEY`

## ✨ Features

### 🎯 **Core Functionality**
- **Real-time trending content** from YouTube (TikTok, Twitter coming soon)
- **AI-powered content summaries** using OpenRouter API
- **Automatic location detection** for region-specific trending content
- **Embedded content viewing** - watch videos directly in the dashboard
- **Multi-language support** with English/French toggle
- **Responsive design** with mobile-first approach

### 🎨 **Modern UI/UX**
- **Click-to-close sidebar** - click anywhere to close when extended
- **Dark/Light mode toggle** with smooth transitions
- **Collapsible sidebar menu** with smooth animations
- **Social platform icons** with authentic branding colors
- **Blue/Gray color scheme** with professional aesthetics
- **Infinite scroll** for seamless content browsing

### 🔧 **Technical Features**
- **Serverless architecture** with Netlify Functions
- **Intelligent caching** with 24-hour location caching
- **SEO optimized** with meta tags and Open Graph support
- **Error handling** with graceful fallbacks
- **TypeScript ready** structure

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Icons** - Feather icon set
- **React Query** - Data fetching and caching
- **react-i18next** - Internationalization

### **Backend**
- **Netlify Functions** - Serverless API endpoints
- **YouTube Data API v3** - Trending videos data
- **OpenRouter API** - AI content summaries
- **IP Geolocation** - Automatic location detection

### **APIs & Services**
- **YouTube Data API v3** - Video metadata, trending lists
- **OpenRouter** - AI summaries via GPT-3.5-turbo
- **BigDataCloud** - IP-based geolocation
- **Browser APIs** - Geolocation, timezone detection

## 🚀 Quick Start

### **Prerequisites**
- Node.js 20.x
- npm or yarn
- Netlify account with API keys configured

### **Installation**
```bash
# Clone the repository
git clone https://github.com/edbns/SocialSpy.git
cd SocialSpy

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### **Environment Setup**
Copy `.env.example` to `.env` and add your API keys:
```env
YOUTUBE_API_KEY=your_youtube_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
TWITTER_API_KEY=your_twitter_api_key_optional
TIKTOK_API_KEY=your_tiktok_api_key_optional
CUSTOM_AI_ENDPOINT=your_custom_ai_endpoint_optional
```

## 📦 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/edbns/SocialSpy.git
cd SocialSpy
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

### 3. Get API Keys

#### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to `YOUTUBE_API_KEY`

#### OpenRouter API (Free AI)
1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from dashboard
3. Add to `OPENROUTER_API_KEY`

### 4. Development
```bash
npm run dev                    # Start dev server
npm run functions:serve        # Test Netlify functions locally
```

### 5. Production Deploy
```bash
npm run build                  # Build for production
npm run functions:build        # Build Netlify functions
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `YOUTUBE_API_KEY` | Google YouTube Data API v3 key | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API for AI summaries | ✅ |
| `TWITTER_API_KEY` | Twitter API key (coming soon) | ⏳ |
| `TIKTOK_API_KEY` | TikTok API key (coming soon) | ⏳ |

### Netlify Setup
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Enable Netlify Functions

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/
│   ├── Sidebar.jsx           # Collapsible navigation
│   ├── Header.jsx            # Top bar with controls
│   ├── ContentCard.jsx       # Individual content cards
│   └── SocialCard.jsx        # Legacy component
├── data/
│   └── mockData.js           # Development fallback data
├── i18n.js                   # Internationalization setup
├── App.jsx                   # Main application
└── main.jsx                  # Entry point
```

### Backend Functions
```
netlify/functions/
├── youtube-trending.js       # YouTube API integration
├── ai-summary.js            # OpenRouter AI summaries
├── twitter-trending.js      # Twitter API (coming soon)
└── tiktok-trending.js       # TikTok API (coming soon)
```

## 🔌 API Endpoints

### GET `/api/youtube-trending`
Fetch trending YouTube videos
```javascript
// Query parameters
{
  region: 'US',           // Country code
  maxResults: 25          // Number of results
}

// Response
{
  success: true,
  data: [
    {
      id: 'video_id',
      platform: 'youtube',
      title: 'Video Title',
      thumbnail: 'image_url',
      channelTitle: 'Channel Name',
      viewCount: 1000000,
      likeCount: 50000,
      publishedAt: '2024-01-20T10:30:00Z',
      url: 'https://youtube.com/watch?v=...',
      tags: ['tag1', 'tag2']
    }
  ]
}
```

### POST `/api/ai-summary`
Generate AI summary for content
```javascript
// Request body
{
  title: 'Content title',
  description: 'Content description',
  platform: 'youtube'
}

// Response
{
  success: true,
  summary: 'AI-generated summary...',
  model: 'gpt-3.5-turbo'
}
```

## 🎨 Customization

### Adding New Platforms
1. Create new function in `netlify/functions/`
2. Add platform to sidebar filters
3. Update content card platform styles
4. Add API integration logic

### Styling
- Modify `tailwind.config.js` for custom theme
- Update CSS variables in `src/index.css`
- Customize animations in component files

### AI Models
- Change model in `ai-summary.js`
- Adjust prompts for different analysis styles
- Add custom AI endpoints

## 🚀 Deployment

### Netlify (Recommended)
1. Fork this repository
2. Connect to Netlify
3. Set environment variables
4. Deploy automatically on push

### Other Platforms
- **Vercel**: Compatible with minor config changes
- **Railway**: Supports Netlify function format
- **Self-hosted**: Requires serverless function adaptation

## 🔧 Development

### Local Testing
```bash
# Start everything
npm run functions:serve

# Test specific function
curl http://localhost:8888/api/youtube-trending?region=US&maxResults=5
```

### Contributing
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📊 Monitoring

### Built-in Analytics
- Content performance tracking
- Platform popularity metrics
- Regional trending analysis
- Real-time engagement monitoring

### Error Handling
- Graceful API failure handling
- Automatic fallback content
- User-friendly error messages
- Comprehensive logging

## 🔒 Privacy & Security

- No user data collection
- API keys stored securely
- CORS protection enabled
- Rate limiting implemented
- Content filtering available

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/edbns/SocialSpy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/edbns/SocialSpy/discussions)
- **Documentation**: This README + inline comments

## 🎯 Roadmap

### Phase 1 ✅
- [x] YouTube integration
- [x] AI summaries with OpenRouter
- [x] Collapsible sidebar
- [x] Real-time updates
- [x] Multi-language support

### Phase 2 🚧
- [ ] TikTok API integration
- [ ] Twitter/X API integration
- [ ] Instagram API integration
- [ ] Advanced filtering options
- [ ] Content export features

### Phase 3 🔮
- [ ] User accounts & preferences
- [ ] Custom dashboards
- [ ] Alert system for viral content
- [ ] API rate limiting dashboard
- [ ] Advanced analytics

---

**Built with ❤️ for social media enthusiasts and content creators**