#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Stefna Environment Setup');
console.log('===========================\n');

const envTemplate = `# Stefna Environment Variables
# Copy this file to .env and fill in your API keys

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

# Development Settings
NODE_ENV=development
`;

const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('If you want to create a new one, delete the existing .env file first.\n');
} else {
  try {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Created .env file successfully!');
    console.log('📝 Please edit the .env file and add your actual API keys.\n');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    process.exit(1);
  }
}

console.log('📋 Required API Keys:');
console.log('=====================');
console.log('');
console.log('🔑 AI APIs (Choose at least one):');
console.log('  • OpenRouter: https://openrouter.ai/keys');
console.log('  • HuggingFace: https://huggingface.co/settings/tokens');
console.log('  • DeepInfra: https://deepinfra.com/');
console.log('  • Together AI: https://together.ai/');
console.log('  • Replicate: https://replicate.com/');
console.log('  • Groq: https://console.groq.com/');
console.log('');
console.log('📰 Content APIs:');
console.log('  • YouTube: https://console.cloud.google.com/apis/credentials');
console.log('  • NewsData.io: https://newsdata.io/');
console.log('  • Last.fm: https://www.last.fm/api/account/create');
console.log('  • Reddit: https://www.reddit.com/prefs/apps');
console.log('');
console.log('📧 Email Service:');
console.log('  • Resend: https://resend.com/');
console.log('');
console.log('🚀 For Netlify deployment:');
console.log('1. Go to your Netlify site dashboard');
console.log('2. Navigate to Site settings > Environment variables');
console.log('3. Add ALL variables (both with and without VITE_ prefix)');
console.log('');
console.log('💡 Minimum setup for basic features:');
console.log('  • VITE_LASTFM_API_KEY (Music section)');
console.log('  • VITE_NEWSDATA_API_KEY (News section)');
console.log('  • VITE_REDDIT_CLIENT_ID + VITE_REDDIT_CLIENT_SECRET (Reddit section)');
console.log(''); 