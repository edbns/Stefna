# Stefna - AI-Powered Photo & Video Editing Platform

## 🎯 **Core Purpose**
Stefna is a creative AI-powered platform that transforms existing photos and videos through advanced AI editing. Unlike traditional text-to-image generators, Stefna focuses on **image-to-image (I2I)** and **video-to-video (V2V)** transformations, allowing users to remix and enhance their existing media with custom prompts and preset styles.

## ✨ **Main Features**

### 🖼️ **Media Upload & Remix**
- **Core Requirement**: Users upload photos/videos for AI editing
- **Remix Functionality**: Users can remix existing media from the public feed
- **Nothing works without media** - this is the fundamental requirement

### 🎨 **AI-Powered Transformations**
- **Custom Prompts**: Users enter their own creative instructions
- **Preset Styles**: Pre-built transformations including:
  - Anime
  - Cyberpunk
  - Oil Painting
  - Studio Ghibli
  - Photorealistic
  - Watercolor
- **Always I2I/V2V**: Never text-to-image - always transforms existing media

### 👥 **User Management & Privacy**
- **User Profiles**: Complete settings and preferences
- **Share to Feed**: Control if media appears publicly
- **Allow Remix**: Control if others can remix your media (only works when sharing is ON)
- **Private "All Media" Tab**: Personal content storage
- **Public Feed**: Gallery of shared media

### 🔄 **Content Flow**
1. User uploads photo/video OR selects media to remix
2. User enters custom prompt OR selects preset style
3. AI processes the media with the prompt/style
4. Result automatically saves to user's private media tab
5. User can choose to share to public feed and allow remixing
6. Media appears in public feed/gallery if shared

## 🏗️ **Technical Architecture**

### **Frontend**
- **React** with **Vite** for fast development
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Responsive design** for all devices

### **Backend**
- **Netlify Functions** for serverless backend operations
- **AIML API** integration for AI generation
- **Cloudinary** for secure media hosting
- **JWT authentication** for user sessions

### **Database**
- **Supabase** with PostgreSQL
- **Row Level Security (RLS)** for data privacy
- **Service role access** for backend operations
- **Real-time subscriptions** for live updates

### **Media Processing**
- **Secure uploads** via signed Cloudinary URLs
- **Automatic media optimization**
- **Support for high-resolution content**
- **Efficient storage and retrieval**

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- Cloudinary account
- AIML API account
- Netlify account

### **Environment Variables**
Create a `.env` file based on `env.example`:

```bash
# Frontend (Vite)
VITE_AIML_API_KEY=your_aiml_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_APP_ENV=development
VITE_DEBUG_MODE=true

# Backend (Netlify Functions)
AIML_API_KEY=your_aiml_api_key_here
AIML_API_URL=https://api.aimlapi.com
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
JWT_SECRET=your_jwt_secret_key_here
RESEND_API_KEY=your_resend_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### **Installation**
```bash
# Clone the repository
git clone https://github.com/edbns/Stefna.git
cd Stefna

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your actual values

# Start development server
npm run dev
```

### **Database Setup**
Run the database migration script in your Supabase SQL Editor:
```sql
-- Use the simple-database-migration.sql file
-- This sets up all required tables, policies, and functions
```

## 🔧 **Development**

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### **Project Structure**
```
src/
├── components/      # React components
├── screens/         # Page components
├── services/        # API and business logic
├── stores/          # State management
├── utils/           # Utility functions
└── config/          # Configuration files

netlify/
└── functions/       # Serverless backend functions
```

### **Key Components**
- **WebsiteLayout.tsx**: Main application layout and AI generation logic
- **MediaCard.tsx**: Individual media item display and controls
- **GalleryScreen.tsx**: Media gallery and feed management
- **aiGenerationService.ts**: AI generation service integration
- **interactionService.ts**: Social features (likes, remixes, shares)

## 🎨 **AI Generation Features**

### **Supported Models**
- **Image-to-Image (I2I)**: Transform photos with custom prompts
- **Video-to-Video (V2V)**: Transform videos with custom prompts
- **Preset Styles**: Quick transformation with predefined artistic styles

### **Generation Process**
1. **Media Upload**: Secure upload to Cloudinary
2. **Prompt Input**: Custom text or preset selection
3. **AI Processing**: Server-side generation via AIML API
4. **Result Storage**: Automatic save to user's media library
5. **Sharing Options**: Optional public feed publication

## 🔒 **Security Features**

### **Data Privacy**
- **Row Level Security**: Database-level access control
- **User Isolation**: Users can only access their own media
- **Guest Support**: Anonymous users with temporary IDs
- **Secure Uploads**: Signed URLs prevent unauthorized access

### **Authentication**
- **JWT Tokens**: Secure session management
- **OTP Verification**: Two-factor authentication support
- **Service Role Access**: Backend operations bypass user restrictions

## 📱 **User Experience**

### **Interface Design**
- **Minimal & Clean**: Black and white color scheme
- **Full-Screen Layout**: Immersive editing experience
- **Responsive Design**: Works on all device sizes
- **Intuitive Navigation**: Easy-to-use controls and menus

### **Notifications**
- **Real-time Updates**: Live generation progress
- **Success Feedback**: Clear confirmation of completed operations
- **Error Handling**: Helpful error messages and recovery options

## 🚧 **Current Status**

### **✅ Completed Features**
- Complete database schema and migrations
- AI generation pipeline (I2I/V2V)
- Media upload and management
- User privacy controls
- Social features (likes, remixes, shares)
- Preset style system
- Guest user support
- Usage tracking and limits

### **🔄 In Development**
- Production deployment optimization
- Performance testing and optimization
- User feedback integration

### **📋 Next Steps**
- Local testing and bug fixes
- Production deployment
- User acceptance testing
- Performance monitoring

## 🤝 **Contributing**

This is a production application. Please ensure all changes are thoroughly tested before submitting pull requests.

## 📄 **License**

This project is proprietary software. All rights reserved.

## 📞 **Support**

For technical support or questions about the platform, please refer to the project documentation or contact the development team.

---

**Stefna** - Transforming creativity through AI-powered media editing 🎨✨ 