# Stefna - AI Photo Editing Platform

A modern, React-based AI photo generation platform with **five distinct generation modes**, built for stability, scalability, and user experience.

## 🚀 **Features**

### **🎨 Editing Modes**

1. **Presets Mode** - 25 professional AI style presets with auto-generation
2. **Emotion Mask Mode** - 5 emotional variants with cinematic styling
3. **Studio Ghibli Reaction Mode** - 3 facial emotion enhancements
4. **Neo Tokyo Glitch Mode** - 4 cyberpunk aesthetic overlays
5. **Custom Prompt Mode** - Full creative control with manual generation

### **💎 Core Capabilities**

- **Smart Auto-Generation**: Presets, Emotion Mask, Ghibli Reaction, and Neo Tokyo Glitch auto-run when ready
- **Manual Control**: Custom prompts require explicit user action
- **Credit System**: Reserve → Generate → Finalize with automatic refunds
- **File Upload**: Drag & drop or click to upload images
- **AI Generation**: Powered by AIML API with multiple models
- **Cloud Storage**: Cloudinary integration for media storage
- **User Authentication**: JWT-based auth system with Neon Database
- **Real-time Updates**: Live generation status and notifications
- **Responsive Design**: Mobile-first, modern UI with Tailwind CSS

## 🎉 **Major Milestone: Q4 2024 - Complete Preset System Overhaul**

### **🏆 What We've Accomplished**

This milestone represents a complete transformation of Stefna's AI generation capabilities, bringing the platform to production-ready status with enterprise-grade features.

#### **🎭 Refined Preset System**
- **Emotion Mask**: 4 curated dual-emotion presets with original working prompts
- **Ghibli Reaction**: 3 balanced anime-inspired presets with subtle Ghibli layer
- **Neo Tokyo Glitch**: 4 cyberpunk aesthetic presets with glitch effects
- **Professional Presets**: 25 minimal presets for color grading and enhancement
- **All presets optimized** for `flux/dev` model (working system)

#### **🎨 UI/UX Transformation**
- **100% Full-Screen Media Coverage**: No more wasted screen real estate
- **Floating Action Menu**: Top-left accessible navigation system
- **4-Column Media Grid**: Optimized layout for maximum content visibility
- **Clean, Minimal Design**: Black/white aesthetic with focus on content

#### **⚙️ Technical Improvements**
- **JSX Structure**: Complete cleanup and optimization
- **Component Architecture**: Streamlined and maintainable codebase
- **Build System**: Production-ready compilation and deployment
- **Error Handling**: Comprehensive runtime guards and logging

#### **🔧 Production Features**
- **Credit System**: Robust reserve → generate → finalize flow
- **Composer Clearing**: Automatic cleanup after generation
- **Toast Notifications**: Unified user feedback system
- **AIML Integration**: Ready for comprehensive testing

### **🚀 Ready for Production**
- **Build System**: ✅ Stable and optimized
- **Preset System**: ✅ Refined and tested
- **UI Layout**: ✅ Full-screen, responsive design
- **Code Quality**: ✅ Clean, maintainable structure
- **Documentation**: ✅ Comprehensive and up-to-date

### **🎯 Current Status & Next Steps**

#### **✅ Completed & Ready**
- **Refined Preset System**: All 3 modes optimized and tested
- **Full-Screen Layout**: 100% media coverage achieved
- **JSX Structure**: Clean, maintainable codebase
- **Build System**: Production-ready compilation

#### **🚧 In Progress**
- **AIML Integration Testing**: Comprehensive preset testing with real API
- **User Experience Validation**: Testing refined preset results
- **Performance Optimization**: Fine-tuning generation parameters

#### **🔮 Future Enhancements**
- **Floating Menu Refinements**: Enhanced navigation and styling
- **Additional Preset Variants**: More emotional and stylistic options
- **Advanced UI Features**: Enhanced user interaction patterns
- **Mobile Optimization**: Touch-friendly interface improvements

## 🏗️ **Architecture Overview**

### **Frontend Stack**
- **React 18** with TypeScript
- **Vite** for build tooling
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations

### **Backend Services**
- **Netlify Functions** for serverless API endpoints
- **Neon Database** for PostgreSQL database (serverless-optimized)
- **Cloudinary** for media storage and optimization
- **AIML API** for AI generation

### **Key Design Principles**
- **Mode Independence**: Each generation mode is completely separate
- **Smart Automation**: Auto-run where helpful, manual control where needed
- **Credit Safety**: Two-phase credit system (reserve → finalize)
- **Error Resilience**: Comprehensive error handling and recovery

## 📁 **Project Structure**

```
src/
├── components/           # React components
│   ├── HomeNew.tsx     # Main application component
│   ├── MediaCard.tsx   # Media display component
│   ├── Composer/       # Generation interface
│   └── ui/             # UI components
├── services/            # Business logic and API calls
│   ├── aiGenerationService.ts # Main generation orchestrator
│   ├── aiml.ts         # AIML API client
│   ├── presets.ts      # Preset system
│   └── credits.ts      # Credit management
├── stores/              # Zustand state management
│   ├── generationMode.ts # Mode selection
│   ├── selectedPreset.ts # Preset selection
│   └── userMedia.ts    # User media management
├── features/            # Feature-specific components
│   └── presets/        # Preset system
└── app/                 # Application bootstrap
    └── bootstrap.ts    # Global initialization
```

## 🔧 **Setup & Installation**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Netlify account (for deployment)
- Neon Database account (for PostgreSQL database)
- Cloudinary account (for media storage)
- AIML API account (for AI generation)

### **Environment Variables**

Create a `.env` file in the root directory:

```bash
# Frontend Variables (VITE_ prefix)
VITE_AIML_API_KEY=your_aiml_api_key
VITE_AIML_API_BASE=https://api.aimlapi.com
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_FUNCTION_APP_KEY=your_app_key

# Backend Variables (no VITE_ prefix)
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_neon_database_url
AIML_API_KEY=your_aiml_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=your_resend_key
```

### **Netlify Environment Variables**

Set these in your Netlify dashboard under Functions:

```bash
# Authentication
JWT_SECRET=your_jwt_secret

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx-pooler.neon.tech/neondb?sslmode=require
NETLIFY_DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx-pooler.neon.tech/neondb?sslmode=require

# AI Services
AIML_API_KEY=your_aiml_api_key
AIML_API_BASE=https://api.aimlapi.com

# Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email & Notifications
RESEND_API_KEY=your_resend_key
SITE_URL=your_site_url
```

### **Installation Steps**

1. **Clone the repository**
   ```bash
   git clone https://github.com/edbns/Stefna.git
   cd Stefna
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 **Generation Modes Deep Dive**

### **1. Presets Mode**
- **Purpose**: Professional AI style presets with auto-generation
- **Auto-Run**: ✅ Enabled when file uploaded + preset selected
- **Credits**: 1 credit per generation
- **UI**: Preset dropdown (26 options) + auto-generation
- **Output**: Single generated image with preset styling
- **Behavior**: Starts immediately after preset selection

### **2. Studio Ghibli Reaction Mode**
- **Purpose**: Enhance facial emotions with Ghibli-style anime features
- **Auto-Run**: ✅ Enabled when triggered
- **Credits**: 1 credit per generation
- **UI**: 3 emotion enhancement options (Tears, Shock, Sparkle)
- **Output**: Single image with enhanced facial expression
- **Behavior**: Starts immediately after variant selection

### **3. Emotion Mask Mode**
- **Purpose**: Emotional truth portraits with cinematic styling
- **Auto-Run**: ✅ Enabled when triggered
- **Credits**: 1 credit per generation
- **UI**: 5 emotional variant options
- **Output**: Single emotionally transformed image
- **Behavior**: Starts immediately after variant selection

### **4. Neo Tokyo Glitch Mode**
- **Purpose**: Cyberpunk aesthetic overlays with identity preservation
- **Auto-Run**: ✅ Enabled when triggered
- **Credits**: 1 credit per generation
- **UI**: 4 cyberpunk style options
- **Output**: Single image with cyberpunk enhancements
- **Behavior**: Starts immediately after variant selection

### **5. Custom Prompt Mode**
- **Purpose**: Full creative control with user-written prompts
- **Auto-Run**: ❌ Manual generation only
- **Credits**: 1 credit per generation
- **UI**: Text input + Magic Brush enhancement + Generate button
- **Output**: Single image based on custom prompt
- **Behavior**: Requires explicit user action

## 💰 **Credit System**

### **Two-Phase Credit Flow**
1. **Reserve Credits**: Deduct credits before generation starts
2. **Generate Content**: Use reserved credits for AI processing
3. **Finalize Credits**: Commit credits on successful generation
4. **Refund Credits**: Return credits on failure

### **Credit Requirements by Mode**
- **Custom Prompt**: 1 credit
- **Presets**: 1 credit
- **Studio Ghibli Reaction**: 1 credit
- **Emotion Mask**: 1 credit
- **Neo Tokyo Glitch**: 1 credit

### **Daily Limits**
- **Daily Cap**: 30 generations per day
- **Credit Balance**: User-specific credit allocation
- **Referral Bonuses**: Additional credits for referrals

## 🔄 **Generation Pipeline**

### **Complete Flow**
1. **File Upload**: User selects image file
2. **Mode Selection**: User chooses generation mode
3. **Credit Check**: Verify sufficient credits and daily limit
4. **Credit Reservation**: Reserve credits for generation
5. **Cloudinary Upload**: File uploaded to Cloudinary
6. **AIML API Call**: AI generation with secure URL
7. **Result Processing**: Generated image saved
8. **Credit Finalization**: Commit reserved credits
9. **UI Reset**: Clear all options for next generation

### **Error Handling**
- **Credit Refund**: Automatic refund on any failure
- **User Feedback**: Clear error messages and status updates
- **State Recovery**: Maintain user selections on retry

## 🛡️ **Authentication & Security**

### **JWT-Based Authentication**
- **Token Management**: Secure JWT tokens with expiration
- **User Verification**: Custom JWT verification with secret key
- **Profile Management**: Neon Database user profiles and settings

### **API Security**
- **App Key Validation**: `x-app-key` header verification
- **CORS Protection**: Proper cross-origin request handling
- **Rate Limiting**: Daily generation caps and limits

## 📱 **UI/UX Features**

### **Smart Automation**
- **Auto-Generation**: Where it makes sense (presets, emotion mask, ghibli reaction, neo tokyo glitch)
- **Manual Control**: Where user choice matters (custom prompts)
- **Immediate Feedback**: Clear indication of what will happen

### **Mode Separation**
- **Distinct UI**: Each mode has its own interface elements
- **Clear Labels**: No confusion between generation options
- **Hover Descriptions**: Full context for each option

### **Responsive Design**
- **Mobile First**: Optimized for mobile devices
- **Touch Friendly**: Large touch targets and gestures
- **Adaptive Layout**: Responsive grid and components

## 🧪 **Testing & Development**

### **Development Commands**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### **Testing Checklist**
1. **Mode Separation**: Verify all five modes work independently
2. **Auto-Generation**: Test preset/emotion mask/ghibli reaction/neo tokyo glitch auto-run
3. **Manual Generation**: Test custom prompt manual flow
4. **Credit System**: Test reservation, generation, and finalization
5. **Error Handling**: Test with invalid inputs and network issues
6. **UI Reset**: Verify options clear after generation

### **Debug Features**
- **Console Logs**: Comprehensive logging for all operations
- **Debug Hook**: `window.debugIntent()` for development
- **State Inspection**: Zustand dev tools for state debugging

## 🚀 **Deployment**

### **Netlify Deployment**
1. **Connect Repository**: Link GitHub repo to Netlify
2. **Build Settings**: 
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Environment Variables**: Set all required env vars
4. **Functions**: Deploy Netlify functions (67 functions)

### **Production Considerations**
- **Environment Variables**: Ensure all production keys are set
- **Database**: Verify Neon Database connection and tables
- **CDN**: Cloudinary optimization settings
- **Monitoring**: Set up error tracking and analytics

## 🔮 **Future Enhancements**

### **Planned Features**
- **Advanced Presets**: Seasonal and trending style collections
- **Custom Mood Bundles**: User-defined emotional themes
- **Batch Operations**: Parallel generation for multiple images
- **Style Transfer**: Advanced AI style manipulation

### **Technical Improvements**
- **Performance**: Further optimization and caching
- **Testing**: Comprehensive test coverage
- **Documentation**: API documentation and examples
- **Monitoring**: Advanced error tracking and analytics

## 🤝 **Contributing**

### **Code Style**
- **TypeScript**: Strict type checking enabled
- **ESLint**: Consistent code formatting
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standard commit message format

### **Development Workflow**
1. **Feature Branch**: Create branch for new features
2. **Development**: Implement and test locally
3. **Testing**: Ensure all tests pass
4. **Pull Request**: Submit PR with detailed description
5. **Review**: Code review and approval process
6. **Merge**: Merge to main branch

## 📞 **Support & Contact**

### **Documentation**
- **Generation Options**: See `GENERATION_OPTIONS_ARCHITECTURE.md`
- **API Docs**: Check Netlify Functions for endpoint details
- **Component Library**: Browse `src/components/` for UI components
- **State Management**: Review `src/stores/` for data flow

### **Issues & Bugs**
- **GitHub Issues**: Report bugs and feature requests
- **Debug Mode**: Enable debug logging for detailed information
- **Console Logs**: Check browser console for error details

### **Getting Help**
- **Code Comments**: Inline documentation throughout codebase
- **Type Definitions**: TypeScript interfaces for all data structures
- **Example Usage**: Check existing implementations for patterns

---

**Last Updated**: August 17, 2025  
**Version**: 3.0.0  
**Maintainer**: Development Team  
**License**: Proprietary  
**Status**: Production Ready ✅
