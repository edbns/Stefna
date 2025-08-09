# 🚀 Stefna Deployment Guide

## Deploying to Netlify

### Option 1: Deploy via Netlify CLI (Recommended)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy from your project directory**
   ```bash
   netlify deploy --prod
   ```

### Option 2: Deploy via Netlify Dashboard

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`

### Environment Variables Setup

1. **In Netlify Dashboard:**
   - Go to Site settings → Environment variables
   - Add the following variables:

   ```
   # AI provider API key (Aimlapi.com)
   VITE_AIMLAPI_API_KEY=your_aimlapi_api_key_here

   # Backend environment variables (not exposed to frontend)
   RESEND_API_KEY=your_resend_api_key_here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   JWT_SECRET=your_jwt_secret_key_here

   # Resend API key for email sending
   VITE_RESEND_API_KEY=your_resend_api_key_here
   ```

2. **Get your API keys:**

   **Aimlapi (AI Processing):**
   - Sign up at [aimlapi.com](https://aimlapi.com)
   - Go to your account settings
   - Copy your API key

   **Resend (Email Service):**
   - Sign up at [resend.com](https://resend.com)
   - Go to API Keys
   - Create a new API key

   **Supabase (Database):**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL schema in `database-schema.sql`
   - Go to Settings → API
   - Copy your Project URL and service role key

   **Resend (Email):**
   - Sign up at [resend.com](https://resend.com)
   - Go to API Keys
   - Create a new API key

### Build Settings

**Build command:** `npm run build`
**Publish directory:** `dist`
**Node version:** 18 (automatically set in netlify.toml)

### Supabase Database Setup

1. **Create the following tables in Supabase:**

   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT,
     name TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     total_photos INTEGER DEFAULT 0,
     daily_usage INTEGER DEFAULT 0,
     daily_limit INTEGER DEFAULT 10
   );

   -- Saved prompts table
   CREATE TABLE saved_prompts (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     name TEXT NOT NULL,
     prompt TEXT NOT NULL,
     category TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     usage_count INTEGER DEFAULT 0
   );

   -- Feed items table
   CREATE TABLE feed_items (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     user_name TEXT NOT NULL,
     user_avatar TEXT,
     image_url TEXT NOT NULL,
     prompt TEXT NOT NULL,
     prompt_name TEXT NOT NULL,
     category TEXT NOT NULL,
     likes INTEGER DEFAULT 0,
     comments INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     is_trending BOOLEAN DEFAULT FALSE
   );

   -- Feed likes table
   CREATE TABLE feed_likes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     feed_item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE,
     user_id UUID REFERENCES users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(feed_item_id, user_id)
   );
   ```

2. **Set up Row Level Security (RLS):**
   ```sql
   -- Enable RLS
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view their own profile" ON users
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update their own profile" ON users
     FOR UPDATE USING (auth.uid() = id);

   CREATE POLICY "Users can view all feed items" ON feed_items
     FOR SELECT USING (true);

   CREATE POLICY "Users can create feed items" ON feed_items
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can view their saved prompts" ON saved_prompts
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can create saved prompts" ON saved_prompts
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

### Custom Domain (Optional)

1. **In Netlify Dashboard:**
   - Go to Site settings → Domain management
   - Add your custom domain
   - Follow DNS setup instructions

### Post-Deployment Checklist

- [ ] Environment variables are set
- [ ] Supabase database is configured
- [ ] Site is accessible at your Netlify URL
- [ ] Camera functionality works (requires HTTPS)
- [ ] AI filters are working (if API key is set)
- [ ] User authentication works
- [ ] Email functionality works
- [ ] Mobile testing on actual devices
- [ ] Share functionality works
- [ ] All animations are smooth

### Troubleshooting

**Build fails:**
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check for TypeScript errors

**Camera not working:**
- Ensure site is served over HTTPS
- Test on actual mobile device
- Check browser permissions

**AI filters not working:**
- Verify Aimlapi API key is set
- Check environment variables in Netlify
- Test with demo mode first

**Authentication not working:**
- Verify Supabase URL and anon key
- Check Supabase project settings
- Ensure RLS policies are configured

**Emails not sending:**
- Verify Resend API key is set
- Check email domain verification
- Test with a verified email address

### Performance Optimization

The app is already optimized for production:
- **Bundle size:** ~100KB gzipped
- **Loading time:** < 2 seconds
- **Mobile optimized:** Touch-friendly UI
- **PWA ready:** Can be added to home screen

### Monitoring

After deployment, monitor:
- **Page load times**
- **User engagement**
- **AI usage patterns**
- **Authentication success rates**
- **Email delivery rates**

## 🎉 Success!

Your Stefna AI Photo App is now live with full backend integration! 