# Stefna - AI Photo Generation Platform

A modern, React-based AI photo generation platform with multiple creative modes, built for stability and scalability.

## 🚀 **Features**

### **Generation Modes**

1. **Presets Mode** - Traditional AI style presets with rotating weekly selection
2. **MoodMorph™ Mode** - Generate 3 mood variations (Happy, Sad, Cinematic)
3. **Style Clash Mode** - Create split images with two contrasting styles

### **Core Capabilities**

- **File Upload**: Drag & drop or click to upload images
- **AI Generation**: Powered by AIML API with multiple models
- **Cloud Storage**: Cloudinary integration for media storage
- **User Authentication**: JWT-based auth system
- **Real-time Updates**: Live generation status and notifications
- **Responsive Design**: Mobile-first, modern UI

## 🏗️ **Architecture Overview**

### **Frontend Stack**
- **React 18** with TypeScript
- **Vite** for build tooling
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations

### **Backend Services**
- **Netlify Functions** for serverless API endpoints
- **Supabase** for database and authentication
- **Cloudinary** for media storage and optimization

### **Key Design Principles**
- **Sandboxed Modes**: Each generation mode is completely independent
- **Centralized File Handling**: Consistent file processing across all modes
- **NO_DB_MODE Support**: Development-friendly without database dependencies
- **Error Resilience**: Comprehensive error handling and recovery

## 📁 **Project Structure**

```
src/
├── components/           # React components
│   ├── HomeNew.tsx     # Main application component
│   ├── MediaCard.tsx   # Media display component
│   └── ...
├── services/            # Business logic and API calls
│   ├── source.ts       # Centralized file handling
│   ├── aiml.ts         # AIML API client
│   ├── styleClash.ts   # Style Clash generation
│   ├── moodMorph.ts    # MoodMorph generation
│   └── ...
├── stores/              # Zustand state management
│   ├── generationMode.ts # Mode selection (presets/moodmorph/styleclash)
│   └── ...
├── features/            # Feature-specific components
│   ├── styleclash/     # Style Clash feature
│   ├── moodmorph/      # MoodMorph feature
│   └── ...
└── app/                 # Application bootstrap
    └── bootstrap.ts    # Global initialization and NO_DB_MODE handling
```

## 🔧 **Setup & Installation**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Netlify account (for deployment)
- Cloudinary account (for media storage)

### **Environment Variables**

Create a `.env` file in the root directory:

```bash
# Development Mode
VITE_NO_DB_MODE=true

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key

# AIML API Configuration
VITE_AIML_API_KEY=your_aiml_api_key

# Supabase (for production)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Netlify Environment Variables**

Set these in your Netlify dashboard under Functions:

```bash
# AIML API
AIML_API_KEY=your_aiml_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Development Mode
NO_DB_MODE=1
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
- **Purpose**: Traditional AI style presets with user prompts
- **File Handling**: Uses `getSourceFileOrThrow()` for consistent file processing
- **UI**: Prompt text box + preset dropdown + generate button
- **Output**: Single generated image with preset styling

### **2. MoodMorph™ Mode**
- **Purpose**: Generate 3 mood variations from one image
- **File Handling**: Centralized file processing via `getSourceFileOrThrow()`
- **UI**: Clean interface, no prompt box
- **Output**: 3 images (Happy, Sad, Cinematic) grouped together

### **3. Style Clash Mode**
- **Purpose**: Create split images with two contrasting styles
- **File Handling**: Same centralized approach as other modes
- **UI**: Larger prompt bar (h-32) + styled pair picker dropdowns
- **Output**: Single composite image with left/right style split

## 🔄 **File Processing Pipeline**

### **Centralized Source Handling**
All modes use the `getSourceFileOrThrow()` function from `src/services/source.ts`:

```typescript
// Converts any input to a File object
export async function fromAnyToFile(
  input: File | Blob | string
): Promise<File>

// Gets source file from candidate or global state
export async function getSourceFileOrThrow(
  candidate?: File | Blob | string | null
): Promise<File>
```

### **Upload Flow**
1. **File Selection**: User selects image file
2. **Source Conversion**: `getSourceFileOrThrow()` ensures File object
3. **Cloudinary Upload**: File uploaded to Cloudinary
4. **AI Generation**: AIML API called with secure URL
5. **Result Processing**: Generated image saved and displayed

## 🛡️ **Error Handling & Resilience**

### **File Validation**
- **Type Checking**: Ensures only File objects reach the pipeline
- **Fallback Handling**: Uses global state if candidate fails
- **Blob URL Prevention**: Never sends blob/data URLs to backend

### **API Error Handling**
- **Authentication**: Proper auth headers based on mode
- **Retry Logic**: Network error recovery
- **User Feedback**: Clear error messages and status updates

### **State Recovery**
- **File Input Reset**: Clears input after each generation
- **Blob URL Cleanup**: Prevents memory leaks
- **Mode Persistence**: Maintains user selections

## 🚫 **NO_DB_MODE Development**

### **Purpose**
Enable development without database dependencies or authentication requirements.

### **How It Works**
- **Environment Variable**: `VITE_NO_DB_MODE=true`
- **Fetch Override**: Intercepts and blocks DB-related API calls
- **Mock Responses**: Returns success responses for blocked endpoints
- **XHR Blocking**: Also blocks XMLHttpRequest calls

### **Blocked Endpoints**
```typescript
// These endpoints are blocked in NO_DB_MODE
'get-notifications'
'update-profile'
'onboarding'
'record-asset'
'user-settings'
'get-user-profile'
'check-tier-promotion'
```

### **Benefits**
- **Faster Development**: No network calls to DB
- **Offline Work**: Works without internet connection
- **Clean Logs**: No 500 errors from missing DB
- **Quick Testing**: Instant feedback on UI changes

## 🔐 **Authentication System**

### **Production Mode**
- **JWT Tokens**: Bearer token authentication
- **Identity Verification**: Netlify identity service
- **User Profiles**: Supabase user management

### **Development Mode**
- **No Auth Required**: Skip all authentication checks
- **Mock User**: Returns demo user object
- **Full Access**: All features available without login

## 📱 **UI/UX Features**

### **Responsive Design**
- **Mobile First**: Optimized for mobile devices
- **Touch Friendly**: Large touch targets and gestures
- **Adaptive Layout**: Responsive grid and components

### **Accessibility**
- **ARIA Labels**: Proper screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant color schemes

### **Performance**
- **Lazy Loading**: Images load as needed
- **Optimized Bundles**: Code splitting and tree shaking
- **Efficient Rendering**: React optimization techniques

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
1. **File Upload**: Test with various file types and sizes
2. **Mode Switching**: Verify all three modes work correctly
3. **Generation**: Test each mode's generation pipeline
4. **Error Handling**: Test with invalid inputs and network issues
5. **Responsiveness**: Test on different screen sizes
6. **NO_DB_MODE**: Verify DB calls are properly blocked

### **Debugging**
- **Console Logs**: Comprehensive logging for all operations
- **Network Tab**: Monitor API calls and responses
- **State Inspection**: Zustand dev tools for state debugging

## 🚀 **Deployment**

### **Netlify Deployment**
1. **Connect Repository**: Link GitHub repo to Netlify
2. **Build Settings**: 
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Environment Variables**: Set all required env vars
4. **Functions**: Deploy Netlify functions

### **Production Considerations**
- **Environment Variables**: Ensure all production keys are set
- **Database**: Verify Supabase connection and tables
- **CDN**: Cloudinary optimization settings
- **Monitoring**: Set up error tracking and analytics

## 🔮 **Future Enhancements**

### **Planned Features**
- **Batch Processing**: Generate multiple images simultaneously
- **Style Transfer**: Advanced AI style manipulation
- **Social Features**: Sharing and collaboration tools
- **Advanced Editing**: Post-generation image editing

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
- **API Docs**: Check Netlify Functions for endpoint details
- **Component Library**: Browse `src/components/` for UI components
- **State Management**: Review `src/stores/` for data flow

### **Issues & Bugs**
- **GitHub Issues**: Report bugs and feature requests
- **Debug Mode**: Enable `VITE_DEBUG_MODE=true` for detailed logs
- **Console Logs**: Check browser console for error details

### **Getting Help**
- **Code Comments**: Inline documentation throughout codebase
- **Type Definitions**: TypeScript interfaces for all data structures
- **Example Usage**: Check existing implementations for patterns

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Maintainer**: Development Team  
**License**: Proprietary