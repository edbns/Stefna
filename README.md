# 🚀 **Stefna AI Photo Platform**

**Professional AI-powered photo editing with FAL.ai integration, automatic identity preservation, and seamless user experience. Now featuring Story Time - AI-powered photo-to-video storytelling!**

---

## 🎯 **What is Stefna?**

Stefna is a cutting-edge AI photo editing platform that transforms your photos using advanced AI models from FAL.ai while preserving the original identity and composition. Built with modern web technologies, it offers a seamless, professional-grade editing experience.

---

## ✨ **Key Features**

### **🎨 AI Generation Modes**
- **Neo Tokyo Glitch**: Cyberpunk aesthetic with Stability.ai integration
- **Ghibli Reaction**: Anime-style transformations with FAL.ai
- **Emotion Mask**: Emotional expression overlays with FAL.ai
- **Custom Presets**: Professional-grade transformations with FAL.ai
- **Custom Prompt**: User-defined transformations with FAL.ai
- **🎬 Story Time**: AI-powered photo-to-video storytelling with Kling V1.6

### **🔒 Identity Preservation**
- **Cloudinary Integration**: Automatic re-upload for image persistence
- **Privacy-First Design**: User content is private by default
- **Credit System**: 2 credits per generation with reservation system

### **🤖 AI Providers**
- **FAL.ai**: Primary provider for all image generation (high-quality, reliable)
- **Stability.ai**: Specialized provider for Neo Tokyo Glitch effects
- **Kling V1.6**: Image-to-Video generation for Story Time
- **Smart Routing**: Optimized provider selection per generation type

### **💳 Credit System**
- **2 Credits per Generation**: Standardized pricing across all modes
- **Reservation System**: Prevents double-charging with automatic refunds
- **Referral Bonuses**: 50 credits for referrers, 25 credits for new users

---

## 🏗️ **Architecture**

### **Frontend**
- **React 18** with TypeScript
- **Tailwind CSS** for modern, responsive design
- **Zustand** for state management
- **Vite** for fast development and building

### **Backend**
- **Netlify Functions** (serverless)
- **PostgreSQL** with raw SQL queries (no Prisma ORM)
- **Cloudinary** for image optimization and storage
- **JWT** authentication with OTP verification

### **AI Services**
- **FAL.ai**: Primary provider for all image transformations
- **Stability.ai**: Specialized for Neo Tokyo Glitch effects
- **Kling V1.6**: Image-to-Video generation for Story Time

### **Database Architecture**
- **Raw SQL Queries**: Optimized PostgreSQL queries with connection pooling
- **Custom DB Helper**: Centralized database operations (`q`, `qOne`, `qCount`)
- **Privacy-First**: User content is private by default (`share_to_feed = FALSE`)
- **Type Safety**: TypeScript interfaces for database results

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 20+
- PostgreSQL database (Neon recommended)
- Cloudinary account
- FAL.ai API key
- Stability.ai API key (optional, for Neo Tokyo Glitch)

### **Admin Dashboard Setup**
The admin dashboard provides full control over users, media, credits, and system configuration.

1. **Set Admin Secret**: Add `ADMIN_SECRET=your_secure_secret_here` to your environment variables
2. **Access**: Click the red Shield icon (🛡️) in the top-right navigation of the Profile screen
3. **Authentication**: Enter your admin secret to access the dashboard
4. **Features**:
   - **Users Management**: View, ban/unban, adjust credits, delete users
   - **Media Browser**: Browse and manage all user-generated content
   - **Credit System**: Monitor and adjust user credit balances
   - **Config & Tokens**: Manage API keys and system settings
   - **Logs & Debug**: View generation logs and system activity
   - **Referral System**: Manage referral bonuses and tracking

**Security**: The admin secret should be a strong, unique password known only to administrators.

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
# Database schema and migrations are in the database/ directory
# Use your preferred PostgreSQL client to run the schema

# Start development server
npm run dev
```

### **Environment Variables**
```bash
# Database (Netlify Functions use this directly)
DATABASE_URL=postgresql://username:password@host:5432/database

# AI Providers
FAL_KEY=your_fal_api_key_here
STABILITY_API_KEY=your_stability_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Authentication
JWT_SECRET=your_secure_jwt_secret_here
ADMIN_SECRET=your_admin_secret_here

# Email (optional)
RESEND_API_KEY=your_resend_api_key_here
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
├── components/          # React components (50+ files)
├── services/           # Business logic and API calls (34 files)
├── hooks/              # Custom React hooks (10 files)
├── stores/             # Zustand state stores (7 files)
├── utils/              # Utility functions (27 files)
├── config/             # Configuration files and presets
├── contexts/           # React context providers
├── screens/            # Page/screen components
├── types/              # TypeScript type definitions
├── features/           # Feature-specific modules
└── state/              # State management utilities

netlify/
├── functions/          # Serverless backend functions (48 files)
├── functions/_db.ts    # Database helper with raw SQL queries
└── functions/_lib/     # Shared utilities for functions

database/               # Database schema, migrations, and fixes
scripts/               # Build and deployment scripts
```

### **Key Components**
- **HomeNew.tsx**: Main application interface with generation pipeline
- **I2IV2VInterface.tsx**: Image-to-video interface for Story Time
- **MasonryMediaGrid**: Responsive media grid with privacy controls
- **PresetSelector**: Professional preset management system
- **GenerationProgress**: Real-time generation status with queue management

### **State Management**
- **useGenerationStore**: Generation state and queue management
- **useUserMedia**: User media management with privacy controls
- **usePresetEngine**: Professional preset configuration system

---

## 🧪 **Testing**

### **Local Development**
```bash
# Start development server
npm run dev

# Test Netlify functions locally (requires netlify-cli)
npx netlify dev

# Build for production
npm run build

# Database operations
# Use your preferred PostgreSQL client (pgAdmin, DBeaver, etc.)
# Schema: database-schema.sql
```

### **Environment Setup**
1. **Copy environment template**: `cp env.example .env`
2. **Configure required variables**: DATABASE_URL, FAL_KEY, etc.
3. **Database setup**: Run `database-schema.sql` in your PostgreSQL instance
4. **Test locally**: `npm run dev` and `npx netlify dev`

### **Production Deployment**
- **Netlify**: Automatic deployment on push to main branch
- **Database**: PostgreSQL with connection pooling
- **CDN**: Cloudinary for global image delivery and persistence

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
- **Database Errors**: Check database-schema.sql and connection string
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

### **Database Support**
- **Schema Setup**: Run database-schema.sql in your PostgreSQL database
- **Connection Issues**: Verify DATABASE_URL and connection pooling settings
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

## 🎉 **Current Status**

### **🚀 FAL.ai Integration Complete**
- ✅ **Primary AI Provider**: FAL.ai for all image generation (high-quality, reliable)
- ✅ **Cloudinary Persistence**: Automatic re-upload for image persistence
- ✅ **Smart Routing**: Optimized provider selection per generation type
- ✅ **Credit System**: 2 credits per generation with reservation system
- ✅ **Privacy-First**: User content private by default (`share_to_feed = FALSE`)

### **🔧 Technical Architecture**
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Zustand
- **Backend**: Netlify Functions + Raw SQL + PostgreSQL
- **AI Services**: FAL.ai (primary) + Stability.ai (Neo Tokyo Glitch) + Kling V1.6 (Story Time)
- **Storage**: Cloudinary CDN with automatic persistence
- **Database**: PostgreSQL with connection pooling and raw queries

### **🎨 Available Features**
- **Image Generation**: 15 professional presets with FAL.ai
- **Neo Tokyo Glitch**: Cyberpunk effects with Stability.ai
- **Ghibli Style**: Anime transformations with FAL.ai
- **Emotion Masks**: Emotional expression overlays
- **Custom Prompts**: User-defined transformations
- **Story Time**: Photo-to-video with Kling V1.6 (in development)
- **Admin Dashboard**: Complete user and system management

### **✅ Production Ready**
- **Database Schema**: Complete with all tables and indexes
- **Authentication**: JWT with OTP verification
- **Credit System**: Reservation and refund system implemented
- **Error Handling**: Comprehensive error boundaries and logging
- **Privacy Controls**: User-level content sharing preferences

---

**Built with ❤️ by the Stefna team**
