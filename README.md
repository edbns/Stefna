# AI Photo Magic ✨

A modern, mobile-first AI-powered photo filtering app built with React + TypeScript. Transform your photos with AI filters and discover community-created prompt recipes.

## 🚀 Features

### Core Functionality
- **📱 Mobile-First Design**: Optimized touch interface with smooth animations
- **📸 Photo Capture**: Camera integration with gallery upload fallback
- **🎨 AI Filters**: Transform photos using AI-powered style transfers
- **👥 Community Feed**: Browse and share prompt recipes
- **💾 Smart Storage**: Local storage with quota management
- **📤 Easy Sharing**: Download or share filtered photos

### AI Integration
- **Replicate API Ready**: Pre-configured for Stable Diffusion models
- **Preset Filters**: Curated collection (Ghibli, Cyberpunk, Oil Painting, etc.)
- **Custom Prompts**: Write your own style descriptions
- **Real-time Processing**: Progress tracking and status updates

### User Experience
- **Daily Quota System**: 10 free AI generations per day
- **Bonus Credits**: Invitation rewards system
- **Favorites System**: Save and organize favorite prompts
- **Before/After View**: Compare original and filtered images
- **Touch-Optimized**: Large buttons, smooth gestures

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom mobile components
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Notifications**: React Hot Toast

## 📱 Screenshots

The app features three main screens:

1. **Camera Screen**: Photo capture and upload
2. **Edit Screen**: AI filter application and sharing
3. **Feed Screen**: Community prompt recipes

## 🔧 Setup & Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-photo-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔑 AI Integration Setup

### Using Replicate API

1. Sign up at [Replicate.com](https://replicate.com)
2. Get your API key from the dashboard
3. Update `src/services/ai.ts` with your configuration:

```typescript
// Uncomment and configure the real Replicate integration
export const aiService = new AIService({
  apiKey: 'your-replicate-api-key',
  baseUrl: 'https://api.replicate.com/v1'
});
```

### Supported Models
- SDXL (Stable Diffusion XL)
- ControlNet
- InstantID
- Custom fine-tuned models

## 📁 Project Structure

```
src/
├── components/
│   ├── navigation/     # Bottom navigation
│   ├── screens/        # Main app screens
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── services/          # API integrations
├── types/             # TypeScript definitions
├── utils/             # Helper functions
└── assets/            # Static assets
```

## 🎯 Core Components

### Screens
- `CameraScreen`: Photo capture and upload
- `EditScreen`: AI filter application
- `FeedScreen`: Community prompt sharing

### Services
- `aiService`: Replicate API integration
- `storage`: Local data management
- `imageUtils`: Image processing utilities

### Hooks
- `useQuota`: Daily usage tracking

## 📱 Mobile Optimization

- **Responsive Design**: Works on all screen sizes
- **Touch Gestures**: Optimized for mobile interaction
- **PWA Ready**: Can be installed as a mobile app
- **Camera Access**: Native camera integration
- **Share API**: Native sharing capabilities

## 🔄 State Management

Uses React's built-in state management with:
- Local state for UI interactions
- localStorage for persistence
- Custom hooks for shared logic

## 🎨 Styling

### Tailwind Configuration
- Custom color palette
- Mobile-first breakpoints
- Component utilities
- Animation classes

### Key Design Principles
- **Mobile-First**: Touch-friendly interface
- **Minimal**: Clean, focused design
- **Fast**: Smooth animations and transitions
- **Accessible**: High contrast, readable text

## 🚀 Deployment

### Recommended Platforms
- **Netlify**: Automatic builds from Git
- **Vercel**: Optimized for React apps
- **GitHub Pages**: Free static hosting

### Environment Variables
```bash
VITE_REPLICATE_API_KEY=your_api_key
VITE_API_BASE_URL=https://api.replicate.com/v1
```

## 🛣️ Roadmap

### Planned Features
- [ ] Video filter support
- [ ] User authentication
- [ ] Cloud storage integration
- [ ] In-app purchases for credits
- [ ] Push notifications
- [ ] Advanced editing tools
- [ ] Batch processing
- [ ] Social features (comments, follows)

### Technical Improvements
- [ ] Service Worker for offline support
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Error boundaries
- [ ] Unit tests
- [ ] E2E tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions or issues:
- Open a GitHub issue
- Check existing documentation
- Review the code comments

## 💡 Tips for Development

### Adding New Filters
1. Add filter definition to `presetFilters` in `src/services/ai.ts`
2. Include appropriate prompts and descriptions
3. Test with various image types

### Custom Components
- Use Tailwind utility classes
- Follow mobile-first design principles
- Include hover and active states
- Add proper TypeScript types

### Performance
- Optimize images before processing
- Use lazy loading for large lists
- Implement proper error handling
- Cache API responses when possible

---

Built with ❤️ for the mobile-first AI photo editing community!