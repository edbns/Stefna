# Environment Setup Guide

## Required Environment Variables

### Frontend Variables (VITE_ prefix)
These are used by the React app and are exposed to the browser:

```bash
# AI API Keys (Frontend)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
VITE_DEEPINFRA_API_KEY=your_deepinfra_api_key_here
VITE_TOGETHER_API_KEY=your_together_api_key_here
VITE_REPLICATE_API_KEY=your_replicate_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here

# Content API Keys (Frontend)
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_NEWSDATA_API_KEY=your_newsdata_api_key_here
VITE_LASTFM_API_KEY=your_lastfm_api_key_here
VITE_REDDIT_CLIENT_ID=your_reddit_client_id_here
VITE_REDDIT_CLIENT_SECRET=your_reddit_client_secret_here

# Email Service (Frontend)
VITE_RESEND_API_KEY=your_resend_api_key_here
```

### Backend Variables (Netlify Functions)
These are used by serverless functions and are NOT exposed to the browser:

```bash
# AI API Keys (Backend)
OPENROUTER_API_KEY=your_openrouter_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
DEEPINFRA_API_KEY=your_deepinfra_api_key_here
TOGETHER_API_KEY=your_together_api_key_here
REPLICATE_API_KEY=your_replicate_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Content API Keys (Backend)
YOUTUBE_API_KEY=your_youtube_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here
LASTFM_API_KEY=your_lastfm_api_key_here
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here

# Email Service (Backend)
RESEND_API_KEY=your_resend_api_key_here
```

## Setup Instructions

### 1. Local Development

Create a `.env` file in the root directory:

```bash
# Copy the frontend variables above into .env
VITE_OPENROUTER_API_KEY=your_actual_key_here
VITE_HUGGINGFACE_API_KEY=your_actual_key_here
# ... add all other VITE_ variables
```

### 2. Netlify Deployment

Add environment variables in Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add ALL variables (both frontend and backend)
4. Make sure to include both VITE_ and non-VITE_ versions

### 3. API Key Sources

#### AI APIs (Choose at least one):
- **OpenRouter**: https://openrouter.ai/keys
- **HuggingFace**: https://huggingface.co/settings/tokens
- **DeepInfra**: https://deepinfra.com/
- **Together AI**: https://together.ai/
- **Replicate**: https://replicate.com/
- **Groq**: https://console.groq.com/

#### Content APIs:
- **YouTube**: https://console.cloud.google.com/apis/credentials
- **NewsData.io**: https://newsdata.io/
- **Last.fm**: https://www.last.fm/api/account/create
- **Reddit**: https://www.reddit.com/prefs/apps

#### Email Service:
- **Resend**: https://resend.com/

## Troubleshooting

### Common Issues:

1. **"API key not found" errors**: Make sure you've added the environment variables
2. **Frontend vs Backend confusion**: 
   - Frontend uses `VITE_` prefix
   - Backend uses no prefix
3. **Netlify deployment issues**: Check that all variables are set in Netlify dashboard
4. **Local vs Production**: Different variables for local development vs production

### Testing API Keys:

```bash
# Test if environment variables are loaded
npm run dev
# Check browser console for any "API key not found" errors
```

### Required for Full Functionality:

**Minimum Setup (Basic Features):**
- `VITE_LASTFM_API_KEY` (for Music section)
- `VITE_NEWSDATA_API_KEY` (for News section)
- `VITE_REDDIT_CLIENT_ID` + `VITE_REDDIT_CLIENT_SECRET` (for Reddit section)

**Full Setup (All Features):**
- All AI API keys (for AI chat and summaries)
- All content API keys (for all sections)
- `VITE_RESEND_API_KEY` (for email OTP)

## Security Notes

- Never commit `.env` files to git
- Use different API keys for development and production
- Monitor API usage to avoid rate limits
- Consider using API key rotation for security 