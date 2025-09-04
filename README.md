# Stefna AI - Advanced AI-Powered Photo Editor

Transform your photos with cutting-edge AI technology. A privacy-first, credit-based platform for creative photo editing and generation.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Or run with Netlify Functions (recommended)
netlify dev
```

## ✨ Features

### 🎨 AI Generation Modes
- **Presets**: Curated professional photo styles with weekly rotation
- **Custom Prompt**: Free-form AI generation with your own prompts
- **Emotion Mask**: Transform facial expressions with AI
- **Ghibli Reaction**: Studio Ghibli-inspired artistic transformations
- **Neo Tokyo Glitch**: Cyberpunk aesthetic with glitch effects
- **Studio (Edit)**: Advanced photo editing with nano-banana AI
- **Story Time**: Multi-image video generation (temporarily hidden)

### 🛡️ Privacy & Security
- **Privacy-First**: All content private by default
- **No Social Media**: Pure creative tools, no social features
- **Secure Auth**: JWT + OTP email verification
- **Data Protection**: GDPR-compliant data handling

### 💳 Credit System
- **30 Daily Credits**: Free daily generation allowance
- **Fair Usage**: Prevents abuse while keeping it accessible
- **Admin Controls**: Comprehensive credit management system

### 🎯 Advanced Features
- **Real-time Face Detection**: TensorFlow.js-powered face landmarks
- **Identity Preservation**: IPA system to maintain facial features
- **Masonry Layout**: Responsive grid with dynamic sizing
- **Infinite Scroll**: Seamless content browsing
- **Admin Dashboard**: Full system management interface

## 🏗️ Technology Stack

### Frontend
- **React 18**: Modern UI framework with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management

### Backend
- **Netlify Functions**: Serverless backend
- **PostgreSQL**: Reliable relational database
- **Cloudinary**: Image storage and optimization
- **JWT**: Secure authentication tokens

### AI Providers
- **BFL API**: Primary AI generation (Flux Pro 1.1 Ultra/Pro/Standard)
- **Fal.ai**: Secondary provider with nano-banana for Studio mode
- **Stability.ai**: Fallback provider for Neo Tokyo Glitch
- **Replicate**: Emergency fallback for IPA failures

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Netlify CLI**: Local development and deployment

## 📁 Project Structure

```
stefna/
├── src/
│   ├── components/          # React components
│   ├── screens/            # Page components
│   ├── services/           # API and business logic
│   ├── utils/              # Utility functions
│   ├── presets/            # AI preset configurations
│   └── config/             # App configuration
├── netlify/
│   └── functions/          # Serverless backend functions
├── database/
│   ├── schema/             # Database schema
│   └── migrations/         # Database migrations
├── scripts/                # Utility scripts
└── migrations/             # SQL migration files
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# AI APIs
BFL_API_KEY=your_bfl_api_key
FAL_KEY=your_fal_api_key
STABILITY_API_KEY=your_stability_key
REPLICATE_API_KEY=your_replicate_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Resend)
RESEND_API_KEY=your_resend_key

# Admin
ADMIN_SECRET=your_admin_secret
```

### Database Setup

```bash
# Run migrations
npm run migrate

# Or manually run migration scripts
node scripts/run-migration.js
```

## 🎨 AI Generation Modes

### Presets Mode
- **Weekly Rotation**: 6 curated presets change weekly
- **Professional Quality**: Optimized for consistent results
- **Easy to Use**: One-click generation

### Custom Prompt Mode
- **Free-form Input**: Write your own prompts
- **Advanced Control**: Full creative freedom
- **Prompt Enhancement**: AI-powered prompt optimization

### Emotion Mask Mode
- **Facial Expression**: Transform emotions with AI
- **Identity Preservation**: Maintain facial features
- **Real-time Detection**: TensorFlow.js face landmarks

### Ghibli Reaction Mode
- **Studio Ghibli Style**: Artistic anime transformations
- **BFL Ultra**: Highest quality generation
- **Emotional Expressions**: Tears, joy, surprise, etc.

### Neo Tokyo Glitch Mode
- **Cyberpunk Aesthetic**: Futuristic glitch effects
- **Stability.ai**: Specialized for this style
- **Unique Visuals**: Distinctive artistic style

### Studio Mode (Edit)
- **Advanced Editing**: Professional photo editing
- **Nano-banana AI**: Specialized for image-to-image
- **Multiple Images**: Support for additional reference images

## 🔐 Authentication

### User Registration
1. **Email Verification**: OTP sent to email
2. **Account Creation**: Automatic user profile setup
3. **Credit Allocation**: 30 daily credits assigned

### Admin Access
- **Route**: `/dashboard/management/control`
- **Secret**: Set via `ADMIN_SECRET` environment variable
- **Features**: Media management, user management, system configuration

## 💳 Credit System

### Daily Credits
- **30 Credits**: Free daily allowance
- **Reset**: Daily at midnight UTC
- **Usage**: 1-2 credits per generation depending on mode

### Admin Controls
- **Credit Adjustment**: Modify user credits
- **Daily Reset**: Manual credit reset
- **Usage Analytics**: Track credit consumption

## 🎯 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with Netlify Functions
netlify dev

# Run tests
npm test

# Build for production
npm run build
```

### Database Management

```bash
# Run migrations
npm run migrate

# Seed presets
node scripts/admin-seed-presets.js

# Cleanup placeholder users
node scripts/cleanup-placeholder-users.js
```

### Deployment

```bash
# Deploy to Netlify
git push origin main

# Or manual deployment
netlify deploy --prod
```

## 📊 Admin Dashboard

### Features
- **Media Browser**: View and manage all generated content
- **User Management**: View users, adjust credits, ban users
- **System Configuration**: Manage presets, credits, settings
- **Analytics**: Generation statistics and usage data
- **Logs**: System logs and error tracking

### Access
- **URL**: `/dashboard/management/control`
- **Authentication**: Admin secret required
- **Privacy**: Noindex, nofollow meta tags

## 🔧 API Endpoints

### Generation
- `POST /unified-generate-background`: Main generation endpoint
- `POST /credits-reserve`: Reserve credits for generation
- `POST /credits-finalize`: Finalize credit usage

### Media
- `GET /get-user-media`: Fetch user's media
- `GET /get-public-feed`: Fetch public feed
- `DELETE /delete-media`: Delete media

### User
- `GET /get-user-profile`: Fetch user profile
- `POST /update-profile`: Update user profile
- `POST /change-email`: Change user email

### Admin
- `GET /admin-media`: Admin media management
- `GET /admin-config`: System configuration
- `POST /admin-ban-user`: Ban user
- `POST /admin-adjust-credits`: Adjust user credits

## 🐛 Troubleshooting

### Common Issues

**Generation Fails**
- Check API keys in environment variables
- Verify credit balance
- Check Netlify function logs

**Database Errors**
- Run migrations: `npm run migrate`
- Check database connection
- Verify `DATABASE_URL` format

**Image Upload Issues**
- Verify Cloudinary credentials
- Check file size limits
- Ensure proper file format

### Debug Mode

```bash
# Enable debug logging
DEBUG=true npm run dev

# View Netlify function logs
netlify functions:logs
```

## 📈 Performance

### Optimizations
- **Image Optimization**: Cloudinary automatic optimization
- **Lazy Loading**: Images load as needed
- **Caching**: Browser and CDN caching
- **Code Splitting**: Dynamic imports for better loading

### Monitoring
- **Netlify Analytics**: Performance monitoring
- **Error Tracking**: Automatic error logging
- **User Analytics**: Generation statistics

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 License

Private & Confidential - All rights reserved

## 🆘 Support

For technical support or questions:
- Check the [CURRENT_STATE.md](./CURRENT_STATE.md) for detailed documentation
- Review the [DEVELOPMENT_LOG_2024_12_19.md](./DEVELOPMENT_LOG_2024_12_19.md) for recent changes
- Contact the development team

---

**Stefna AI** - Transforming creativity with AI technology 🎨✨