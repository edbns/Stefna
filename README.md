# SocialSpy - Data Intelligence Platform

A comprehensive social media analytics and trending content platform that collects public data from multiple platforms and provides AI-powered insights.

## 🚀 Features

### Core Features
- **Worldwide Trending Content**: Real-time trending videos, posts, and content from multiple platforms
- **Multi-Platform Support**: YouTube, TikTok, Twitter, Instagram (with more coming soon)
- **AI-Powered Insights**: DeepSeek AI integration for content analysis and trend predictions
- **Infinite Scroll**: Smooth loading of trending content with pagination
- **Advanced Analytics**: Comprehensive data collection and visualization
- **User Authentication**: Email OTP verification for account creation
- **Responsive Design**: Beautiful UI that works on all devices

### Data Collection
- **Public Profile Data**: Collect public profile information
- **Follower Analytics**: Track follower growth and engagement
- **Like & Engagement Metrics**: Monitor likes, comments, shares
- **Trend Analysis**: Analyze trending topics and hashtags
- **Shorts/Short-form Content**: Track short-form video performance
- **Geographic Data**: Location-based trending content
- **Demographics**: Audience demographic analysis
- **Sentiment Analysis**: AI-powered sentiment analysis

### AI Features
- **AI Chat Assistant**: Powered by DeepSeek via OpenRouter
- **Content Summaries**: AI-generated content insights
- **Trend Predictions**: Predictive analytics for upcoming trends
- **Sentiment Analysis**: Real-time sentiment tracking
- **Smart Recommendations**: Personalized content suggestions

### User Experience
- **Modern UI**: Gradient-based design with smooth animations
- **Dark Theme**: Elegant dark interface optimized for content consumption
- **Toast Notifications**: Real-time feedback and updates
- **Loading States**: Beautiful loading animations
- **Error Handling**: Graceful error handling with user-friendly messages

## 🎨 Design System

### Color Palette
- Primary: `#69686D`, `#4F4E52`, `#353437`, `#1A1A1B`, `#000000`
- Accent: Blue to Purple gradients
- Status: Green for success, Red for errors, Yellow for warnings

### Typography
- Font: Inter (Google Fonts)
- Weights: 300, 400, 500, 600, 700

### Components
- Glass morphism effects
- Gradient backgrounds
- Smooth animations with Framer Motion
- Responsive grid layouts
- Custom scrollbars

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **React Query**: Data fetching and caching
- **React Hook Form**: Form handling
- **React Hot Toast**: Toast notifications
- **React Icons**: Icon library

### AI & APIs
- **OpenRouter**: AI model access (DeepSeek)
- **YouTube Data API**: Trending content
- **Custom APIs**: Platform-specific data collection

### Development
- **TypeScript**: Type safety (optional)
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Netlify**: Deployment platform

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/edbns/SocialSpy.git
   cd SocialSpy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### API Keys Setup

#### OpenRouter (Required for AI Chat)
1. Visit [OpenRouter](https://openrouter.ai/)
2. Create a free account
3. Get your API key
4. Add to `.env.local`:
   ```env
   VITE_OPENROUTER_API_KEY=your_key_here
   ```

#### YouTube Data API (Optional)
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to `.env.local`:
   ```env
   VITE_YOUTUBE_API_KEY=your_key_here
   ```

### Customization

#### Colors
Edit `tailwind.config.js` to customize the color scheme:
```javascript
colors: {
  primary: {
    50: '#69686D',
    // ... other shades
  }
}
```

#### Features
- Enable/disable features in `src/App.jsx`
- Customize data collection in `src/components/Sidebar.jsx`
- Modify AI prompts in `src/components/AIChat.jsx`

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Manual Deployment
1. Build the project: `npm run build`
2. Upload `dist` folder to your web server
3. Configure environment variables on your server

## 📱 Usage

### Getting Started
1. **Browse Trending Content**: View worldwide trending content on the home page
2. **Filter by Platform**: Use the sidebar to filter by YouTube, TikTok, etc.
3. **Search Content**: Use the search bar to find specific content
4. **AI Chat**: Click the AI Chat button for insights and analysis
5. **Create Account**: Sign up for personalized features

### Features Guide

#### Dashboard
- Overview of trending content
- Platform statistics
- Data collection metrics
- Quick access to features

#### Trending Content
- Infinite scroll through trending items
- Platform-specific filtering
- Real-time refresh
- Share and like functionality

#### Analytics
- Engagement metrics
- Platform distribution
- Performance insights
- Data visualization

#### AI Insights
- Trend analysis
- Sentiment analysis
- Predictions
- AI-powered recommendations

#### Settings
- Account management
- Data source configuration
- Privacy settings
- API key management

## 🔒 Privacy & Security

### Data Collection
- **Public Data Only**: We only collect publicly available data
- **No Personal Information**: No personal data is stored
- **API-Based**: All data comes from official platform APIs
- **Transparent**: Clear information about data sources

### Security
- **HTTPS Only**: All connections are encrypted
- **API Key Security**: Keys are stored securely
- **No Data Mining**: We don't mine or sell user data
- **GDPR Compliant**: Respects user privacy rights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add feature'`
6. Push: `git push origin feature-name`
7. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure responsive design
- Test on multiple browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter**: For providing AI model access
- **YouTube**: For the Data API
- **React Community**: For the amazing ecosystem
- **Tailwind CSS**: For the utility-first CSS framework
- **Framer Motion**: For smooth animations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/edbns/SocialSpy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/edbns/SocialSpy/discussions)
- **Email**: support@socialspy.com

## 🔮 Roadmap

### Upcoming Features
- [ ] TikTok API integration
- [ ] Twitter/X API integration
- [ ] Instagram API integration
- [ ] Advanced analytics dashboard
- [ ] Custom AI model training
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Team collaboration features
- [ ] Advanced filtering options
- [ ] Export functionality

### Platform Support
- [x] YouTube
- [ ] TikTok
- [ ] Twitter/X
- [ ] Instagram
- [ ] Facebook
- [ ] LinkedIn
- [ ] Reddit
- [ ] Snapchat

---

**Made with ❤️ by the SocialSpy Team**# Updated for Netlify deployment fix
# Updated for final Netlify deployment fix
# Netlify deployment fix - all submodule references removed
