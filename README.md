## Scheduled Cleanup

Netlify Scheduled Functions can call `/.netlify/functions/cleanup-otps` daily to remove expired or used OTPs. Configure in Netlify UI or add a background scheduler.
# Stefna - AI Photo App 🎨

A beautiful, immersive AI-powered photo and video generation platform with a neon dark UI.

## 🚀 Features

- **AI Generation**: Create stunning images and videos with AIML API
- **Smart Token System**: Intelligent distribution of 250M tokens
- **Magic Link Authentication**: Passwordless login with Supabase
- **Email Integration**: Beautiful emails with Resend
- **User Dashboard**: Track creations, downloads, likes, and remixes
- **Infinite Scroll**: Seamless content browsing
- **Responsive Design**: Works on all devices

## 🛠️ Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Stefna
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:

```env
# AIML API Configuration
VITE_AIMLAPI_API_KEY=your_aiml_api_key_here

# Email Service (Resend)
VITE_RESEND_API_KEY=your_resend_api_key_here

# Backend Configuration (Netlify Functions)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
JWT_SECRET=your_jwt_secret

# Optional: Development Settings
VITE_APP_ENV=development
VITE_DEBUG_MODE=false
```

### 3. API Keys Setup

#### AIML API
1. Sign up at [AIML API](https://aimlapi.com)
2. Get your API key from the dashboard
3. Add to `.env`: `VITE_AIMLAPI_API_KEY=your_key`

#### Resend (Email Service)
1. Sign up at [Resend](https://resend.com)
2. Create an API key
3. Add to `.env`: `VITE_RESEND_API_KEY=your_key`

#### Custom OTP Authentication
The app uses a custom OTP (One-Time Password) authentication system with:

1. **Resend** for sending branded emails
2. **Supabase** for storing user data and OTPs (backend only)
3. **Netlify Functions** for secure backend operations

#### Setup Instructions

1. **Resend (Email Service)**
   - Sign up at [Resend](https://resend.com)
   - Create an API key
   - Add to Netlify environment variables: `RESEND_API_KEY=your_key`

2. **Supabase (Database - Backend Only)**
   - Create a project at [Supabase](https://supabase.com)
   - Run the SQL schema in `database-schema.sql`
   - Get your project URL and service role key
   - Add to Netlify environment variables (not frontend):
     - `SUPABASE_URL=your_project_url`
     - `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`
     - `JWT_SECRET=your_jwt_secret_key`

### 4. Development

```bash
npm run dev
```

The app will run in demo mode if API keys are not configured.

### 5. Production Build

```bash
npm run build
```

## 🏗️ Architecture

### Services

- **`EnvironmentService`**: Centralized API key management
- **`AIGenerationService`**: AI content generation with token tracking
- **`TokenService`**: Smart token distribution system
- **`AuthService`**: Custom OTP authentication management
- **`EmailService`**: Magic links and notifications

### Components

- **`WebsiteLayout`**: Main application layout
- **`AuthScreen`**: Custom OTP authentication interface
- **`UserDashboard`**: User profile and statistics
- **`GenerationProgress`**: Real-time generation status
- **`TokenCounter`**: Live token usage display

## 🔧 Configuration

### Demo Mode
When API keys are not configured, the app runs in demo mode:
- Mock AI generation with realistic progress
- Local storage for user data
- Simulated email sending
- No external API calls

### Token System
- **Guest**: 5 tokens/day
- **Registered**: 15 tokens/day
- **Verified**: 30 tokens/day
- **Contributor**: 50 tokens/day

### Generation Costs
- **Photo (Standard)**: 1 token
- **Photo (High Quality)**: 2 tokens
- **Video (Standard)**: 3 tokens
- **Video (High Quality)**: 5 tokens

## 🎨 UI/UX Features

- **Neon Dark Theme**: Immersive dark UI with neon accents
- **Floating Controls**: Minimal, non-intrusive interface
- **Smooth Animations**: Micro-interactions throughout
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: WCAG compliant

## 🔒 Security

- **Environment Variables**: All API keys stored securely
- **Magic Link Authentication**: Passwordless, secure login
- **Token Validation**: Prevents abuse and tracks usage
- **Rate Limiting**: Built-in protection against spam

## 🚀 Deployment

### Netlify
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push

### Vercel
1. Import project to Vercel
2. Add environment variables
3. Deploy with automatic builds

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_AIMLAPI_API_KEY` | AIML API key for AI generation | Yes |
| `VITE_RESEND_API_KEY` | Resend API key for emails | Yes |
| `SUPABASE_URL` | Supabase project URL (backend only) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) | Yes |
| `VITE_APP_ENV` | Environment (dev/prod/staging) | No |
| `VITE_DEBUG_MODE` | Enable debug logging | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and modern web technologies.** 