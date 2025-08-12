# Test Login Guide

Since the app uses OTP-based authentication, here are the steps to test the login functionality:

## 🚀 **Quick Start (Recommended)**

### Option 1: Use Your Own Email (Easiest)
1. **Go to the app** at `http://localhost:3002/`
2. **Click "Sign up"** or navigate to the auth page
3. **Enter your real email address** (e.g., `yourname@gmail.com`)
4. **Click "Send Code"** - this will send a 6-digit OTP to your email
5. **Check your email** for the OTP code
6. **Enter the 6-digit code** in the app
7. **Click "Verify"** to complete login

## 🛠️ **Advanced Testing Options**

### Option 2: Create a Test User in Database
If you want to create a test user directly in the database:

1. **Go to your Supabase dashboard**
2. **Navigate to SQL Editor**
3. **Run the SQL script** from `scripts/create-test-user.sql`
4. **Use these credentials:**
   - Email: `test@stefna.com`
   - OTP: `123456`

### Option 3: Use Netlify Dev with Full Environment
For complete testing with Netlify functions:

1. **Create a `.env.local` file** (this won't be blocked):
```bash
# Copy env.example to .env.local
cp env.example .env.local
```

2. **Fill in your actual API keys** in `.env.local`

3. **Start the dev server with Netlify functions:**
```bash
npm run netlify:dev
```

This will start both the frontend and Netlify functions locally.

## 📧 **Current OTP System Features**

- **OTP Expiration**: 10 minutes
- **OTP Length**: 6 digits
- **Auto-user creation**: New users are automatically created on first login
- **JWT tokens**: Secure session management
- **Email verification**: Uses Resend API for email delivery

## 🧪 **Testing the Generation Flow**

Once logged in:

1. **Upload an image or video**
2. **Enter a prompt** or select a preset
3. **Click Generate**
4. **Check the console** for the debugging logs we added:
   - `▶ dispatchGenerate` with kind
   - `🛡️ requireUserIntent: ALLOW`
   - `[fetch>]` for aimlApi call
   - `[fetch<]` with status code
   - `⏹ dispatchGenerate done` with timing

## 🔧 **Environment Setup for Local Testing**

### Required Environment Variables
Create a `.env.local` file with:

```bash
# Frontend (Vite)
VITE_AIML_API_KEY=your_aiml_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend (Netlify Functions)
AIML_API_KEY=your_aiml_api_key_here
AIML_API_URL=https://api.aimlapi.com
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
JWT_SECRET=your_jwt_secret_key_here
RESEND_API_KEY=your_resend_api_key_here
```

### Getting API Keys

**Aimlapi (AI Processing):**
- Sign up at [aimlapi.com](https://aimlapi.com)
- Go to your account settings
- Copy your API key

**Supabase (Database):**
- Create a project at [supabase.com](https://supabase.com)
- Run the SQL schema in `database-schema.sql`
- Go to Settings → API
- Copy your Project URL and service role key

**Resend (Email):**
- Sign up at [resend.com](https://resend.com)
- Go to API Keys
- Create a new API key

## 🚨 **Troubleshooting**

### If OTP doesn't arrive:
- Check your spam folder
- Verify the email address is correct
- Check Netlify function logs for errors
- Ensure RESEND_API_KEY is set

### If login fails:
- Check browser console for errors
- Verify JWT_SECRET is set in Netlify
- Check Supabase connection
- Ensure SUPABASE_URL and keys are correct

### If generation doesn't work:
- Use the debugging logs we added
- Check if the user has sufficient tokens
- Verify AIML API key is configured
- Check Netlify function logs

### If Netlify dev fails:
- Ensure you have Node.js 18+
- Check if ports 8888 and 3000 are available
- Verify environment variables are set
- Check Netlify CLI installation

## 🧪 **Quick Test Commands**

```bash
# Test health endpoint
curl http://localhost:3002/.netlify/functions/health

# Test OTP request (replace with your email)
curl -X POST http://localhost:3002/.netlify/functions/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'

# Test with Netlify dev (if using Option 3)
curl http://localhost:8888/.netlify/functions/health
```

## 📋 **Testing Checklist**

- [ ] App loads without errors
- [ ] OTP request sends successfully
- [ ] OTP arrives in email
- [ ] Login completes successfully
- [ ] User is redirected to home page
- [ ] Generation buttons are enabled
- [ ] Console shows debugging logs
- [ ] Generation flow works end-to-end

## 🎯 **Next Steps**

1. **Try Option 1 first** (use your real email) - this is the easiest
2. **Check the console logs** for the debugging information we added
3. **Test the generation flow** to see where it might be failing
4. **Let me know what the logs show** so we can debug further

## 🔍 **What to Look For**

The debugging setup we implemented will show you:
- **Button click events** - whether the UI is responding
- **User intent guards** - whether authentication is working
- **Network requests** - whether the API calls are being made
- **Response handling** - whether the server is responding correctly
- **State management** - whether the UI state is being updated properly

This should give us a complete picture of where the generation flow is breaking down.
