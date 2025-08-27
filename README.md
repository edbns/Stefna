# 🚀 **Stefna AI Photo Platform**

**Professional AI-powered photo editing with automatic identity preservation, multiple AI providers, and seamless user experience. Now featuring Story Time - AI-powered photo-to-video storytelling!**

---

## 🎯 **What is Stefna?**

Stefna is a cutting-edge AI photo editing platform that transforms your photos using advanced AI models while preserving the original identity and composition. Built with modern web technologies, it offers a seamless, professional-grade editing experience.

---

## ✨ **Key Features**

### **🎨 AI Generation Modes**
- **Neo Tokyo Glitch**: Cyberpunk aesthetic with Stability.ai + AIML fallback
- **Ghibli Reaction**: Anime-style transformations with AIML API
- **Emotion Mask**: Emotional expression overlays with AIML API
- **Custom Presets**: Professional-grade transformations with AIML API
- **Custom Prompt**: User-defined transformations with AIML API
- **🎬 Story Time**: AI-powered photo-to-video storytelling with Kling V1.6

### **🔒 Identity Preservation**
- **Automatic IPA**: Built-in face preservation without user intervention
- **Multi-tier Validation**: Ensures generated content maintains original identity
- **Configurable Thresholds**: Adjustable similarity requirements per preset

### **🤖 AI Providers**
- **Stability.ai**: Primary provider for Neo Tokyo Glitch (cost-effective, high-quality)
- **AIML API**: Fallback provider and primary for other presets (reliable, feature-rich)
- **Kling V1.6**: Image-to-Video generation for Story Time (cinematic storytelling)
- **Smart Routing**: Automatic fallback and provider selection

### **💳 Credit System**
- **1 Credit per Generation**: Simple, predictable pricing
- **Reservation System**: Prevents double-charging
- **Automatic Refunds**: Credits returned on failures

---

## 🏗️ **Architecture**

### **Frontend**
- **React 18** with TypeScript
- **Tailwind CSS** for modern, responsive design
- **Zustand** for state management
- **Vite** for fast development and building

### **Backend**
- **Netlify Functions** (serverless)
- **PostgreSQL** with Prisma ORM
- **Cloudinary** for image optimization and storage
- **JWT** authentication

### **AI Services**
- **Stability.ai**: Primary provider for Neo Tokyo Glitch
- **AIML API**: Fallback provider and primary for other presets
- **Kling V1.6**: Image-to-Video generation for Story Time

### **Migration Journey**
- **From Raw SQL**: Legacy functions using direct database queries
- **To Prisma ORM**: Modern, type-safe database operations
- **Unified System**: Consistent API patterns across all functions
- **Future-Proof**: Scalable architecture for new features

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL database
- Cloudinary account
- Stability.ai API key
- AIML API key

### **Installation**
```bash
# Clone the repository
git clone https://github.com/edbns/Stefna.git
cd Stefna

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your API keys and database URLs

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### **Environment Variables**
```bash
# Database
DATABASE_URL=postgres://...
NETLIFY_DATABASE_URL=postgres://...

# AI Providers
STABILITY_API_KEY=your_stability_key
AIML_API_KEY=your_aiml_key
AIML_API_URL=https://api.aimlapi.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=your_jwt_secret
JWT_ISSUER=your_issuer
JWT_AUDIENCE=your_audience
```

---

## 🎨 **Usage**

### **Basic Photo Generation**
1. **Upload Image**: Drag & drop or click to upload
2. **Select Preset**: Choose from 33+ professional presets
3. **Generate**: AI processes your image automatically
4. **Download**: Save your transformed image

### **Advanced Features**
- **Batch Processing**: Generate multiple variations
- **Custom Prompts**: Fine-tune AI generation
- **Quality Settings**: Adjust generation parameters
- **Identity Preservation**: Automatic face/identity maintenance

---

## 🔧 **Development**

### **Project Structure**
```
src/
├── components/          # React components
├── services/           # Business logic and API calls
├── hooks/              # Custom React hooks
├── stores/             # Zustand state stores
├── utils/              # Utility functions
└── types/              # TypeScript type definitions

netlify/
└── functions/          # Serverless backend functions

prisma/
└── schema.prisma       # Database schema
```

### **Key Components**
- **HomeNew.tsx**: Main application interface
- **MasonryMediaGrid**: Responsive image grid
- **PresetSelector**: AI preset management
- **GenerationProgress**: Real-time generation status

### **State Management**
- **useGenerationStore**: Generation state and queue
- **useUserMedia**: User media management
- **usePresetEngine**: Preset configuration and execution

---

## 🧪 **Testing**

### **Local Development**
```bash
# Start development server
npm run dev

# Test Netlify functions locally
netlify dev

# Database operations
npx prisma studio
```

### **Production Testing**
- **Deploy to Netlify**: Automatic deployment on push to main
- **Database**: Production PostgreSQL with Neon
- **CDN**: Cloudinary for global image delivery

---

## 📊 **Performance**

### **Optimizations**
- **Progressive Image Loading**: 4-stage quality progression
- **Network-Aware Loading**: Adaptive quality based on connection
- **Lazy Loading**: Images load as needed
- **CDN Optimization**: Global image delivery

### **Monitoring**
- **Real-time Logs**: Detailed generation tracking
- **Performance Metrics**: Generation time and success rates
- **Error Tracking**: Comprehensive error logging

---

## 🚨 **Troubleshooting**

### **Common Issues**
- **Generation Fails**: Check API keys and quotas
- **Slow Loading**: Verify Cloudinary configuration
- **Database Errors**: Check Prisma schema and connections
- **Story Time Issues**: Verify Kling V1.6 API endpoint and credentials

### **Debug Mode**
Enable debug logging in development:
```typescript
// Debug panel shows real-time state
{import.meta.env.DEV && (
  <div className="debug-panel">
    // Real-time debugging information
  </div>
)}
```

### **Migration Support**
- **Prisma Issues**: Run `npx prisma generate` and `npx prisma db push`
- **Schema Conflicts**: Use `npx prisma migrate resolve` for existing tables
- **Local Development**: `npx netlify dev` for function testing

---

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **Tests**: Required for new features

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support**

- **Issues**: [GitHub Issues](https://github.com/edbns/Stefna/issues)
- **Documentation**: Check the codebase and this README
- **Community**: Join our development discussions

---

## 🎉 **Recent Updates**

### **🚀 Beautiful Migration Complete!**
- ✅ **Prisma ORM Migration**: Converted from raw SQL to modern Prisma ORM
- ✅ **Database Schema Modernization**: Clean, type-safe database operations
- ✅ **Story Time Feature**: AI-powered photo-to-video storytelling with Kling V1.6
- ✅ **Video Generation**: Cinematic video creation from static photos
- ✅ **Enhanced User Experience**: Smooth video playback and progress tracking

### **🔧 Technical Improvements**
- **Type Safety**: Full TypeScript integration with Prisma
- **Performance**: Optimized database queries and caching
- **Scalability**: Modern serverless architecture with Netlify Functions
- **Code Quality**: Clean, maintainable codebase with proper error handling

### **🎬 New Story Time Features**
- **Image-to-Video**: Kling V1.6 AI model integration
- **Smart Presets**: Adventure, Romance, Mystery, Comedy, Fantasy, Travel
- **Progress Tracking**: Real-time video generation updates
- **Video Playback**: Hover-to-play with smooth transitions
- **Feed Integration**: Seamless video display in unified feed

---

## 🧹 **Project Cleanup**

### **Recent Optimizations**
- **Removed 57 unnecessary files** including legacy SQL scripts and deployment files
- **Eliminated 5,544 lines of legacy code** for cleaner codebase
- **Streamlined documentation** with focused, relevant information
- **Modernized build process** with proper ES module support

### **Code Quality**
- **Type Safety**: Full TypeScript integration
- **Linting**: ESLint and Prettier for consistent code style
- **Testing**: Comprehensive error handling and validation
- **Documentation**: Clear, up-to-date README and inline comments

---

**Built with ❤️ by the Stefna team**
