# Stefna AI - Current State & Developer Guide
*Last Updated: September 1, 2025*

## 🎯 Core Purpose
Stefna is an AI-powered photo editing platform focused on transformative image generation using various AI models. This is NOT a social media platform - all social features have been removed to maintain focus on the core AI editing functionality.

## 🏗️ Architecture Overview

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Main Component**: `HomeNew.tsx` (5,266 lines - the heart of the UI)
- **Key Features**:
  - Multiple generation modes (Presets, Custom, Emotion Mask, Ghibli React, Neo Tokyo Glitch)
  - Real-time face detection using TensorFlow.js
  - Cloudinary integration for image storage
  - Credit-based generation system

### Backend
- **Platform**: Netlify Functions (Serverless)
- **Database**: PostgreSQL (raw SQL queries, no ORM)
- **Authentication**: JWT + OTP-based login
- **AI Providers**:
  - FAL.ai (primary for most generation modes)
  - Stability.ai (for Neo Tokyo Glitch)
  - Kling V1.6 (for Story Time video generation)

## 📁 Project Structure

```
src/
├── components/
│   └── HomeNew.tsx         # Main UI component (DO NOT SPLIT THIS)
├── screens/               # Route-based screens
├── services/              # Cleaned up service layer
│   ├── authService.ts     # Authentication
│   ├── simpleGenerationService.ts  # Main generation service
│   ├── userMediaService.ts # Media management
│   └── ...               # Other essential services
├── lib/                  # Utilities and helpers
└── presets/             # AI generation presets

netlify/functions/       # Backend serverless functions
├── _db.ts              # Database connection
├── _lib/               # Shared backend utilities
├── fal-generate.ts     # FAL.ai generation
├── neo-glitch-generate.ts  # Stability.ai generation
├── credits-reserve.ts  # Credit reservation
└── ...                # Other API endpoints
```

## 🔄 Recent Major Changes (September 2025)

### 1. Backend Service Cleanup
**Removed 15 redundant service files** that were creating unnecessary abstraction layers:
- ❌ `tokenService.ts` - Merged into credit system
- ❌ `aiGenerationService.ts` - Replaced by simpleGenerationService
- ❌ `advancedAiService.ts` - Unnecessary abstraction
- ❌ `captionService.ts` - Not used
- ❌ `interactionService.ts` - Social feature (removed)
- ❌ `media.ts`, `source.ts`, `prompt.ts` - Redundant abstractions
- And 7 more unused services...

### 2. Database Cleanup
- Fixed duplicate user creation bug in OTP flow
- Removed social media columns (`avatar_url`, `name`, `allow_remix`)
- Cleaned up 22 placeholder users
- Ensured all users have credit entries
- Set privacy-first defaults (`share_to_feed = false`)

### 3. Neo Tokyo Glitch Fixes
- **Timeout Fix**: Changed to respond immediately and process in background
- **Credit Reservation**: Now properly reserves 2 credits before generation
- **Background Processing**: Prevents 504 Gateway Timeouts

### 4. UI Preservation
- Kept `HomeNew.tsx` completely intact (all 5,266 lines)
- All UI functionality preserved
- Fixed missing social media icons in ProfileScreen

## 💳 Credit System

Each user gets 30 daily credits. Generation costs:
- Standard generation: 2 credits
- Neo Tokyo Glitch: 2 credits
- Story Time (video): 2 credits

Credits are:
1. Reserved before generation starts
2. Finalized after successful generation
3. Refunded if generation fails

## 🔐 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# AI Providers
FAL_KEY=...
STABILITY_API_KEY=...
KLING_APP_ID=...
KLING_API_KEY=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Auth
JWT_SECRET=...
RESEND_API_KEY=...

# Frontend variables use VITE_ prefix
VITE_API_URL=...
```

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Run with Netlify functions
netlify dev

# Database migrations (in database/migrations/)
# Apply manually via your PostgreSQL client
```

## ⚠️ Important Notes

1. **DO NOT SPLIT HomeNew.tsx** - It's intentionally monolithic and works well
2. **NO SOCIAL FEATURES** - This is an AI editing tool, not social media
3. **Use Raw SQL** - No ORMs, direct PostgreSQL queries only
4. **Privacy First** - Default all sharing options to private
5. **Credit System** - Always reserve credits before generation

## 🐛 Known Issues & Solutions

### "Failed to resolve import ../services/presets"
- The `presets.ts` service was restored from git history
- If missing, check git log for the file

### Neo Tokyo Glitch Timeouts
- Fixed by immediate response + background processing
- Function returns pending status, processes asynchronously

### Profile Screen Icons
- All social icons use lucide-react
- TikTok and Threads use custom SVG icons (defined in ProfileScreen)

## 🔮 Future Considerations

1. **Performance**: Consider lazy loading for HomeNew components
2. **Monitoring**: Add proper error tracking (Sentry)
3. **Testing**: Add unit tests for critical flows
4. **Documentation**: Keep this file updated with major changes

## 📞 Support

For questions about the current architecture or recent changes, refer to:
- Git history for context
- Database schema in `database/schema/database-schema.sql`
- This document for current state

Remember: Simplicity over complexity. The app works well - don't over-engineer it!
