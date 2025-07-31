# Stefna Project Structure

## 📁 **Clean Project Structure**

```
social-dashboard/
├── public/                    # Static assets
│   ├── favicon.png           # Site favicon
│   └── stefna-logo.png      # Logo image
├── src/                      # Source code
│   ├── components/           # React components
│   │   ├── icons/           # Custom SVG icons
│   │   └── profile/         # Profile-related components
│   ├── constants/           # App constants
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   ├── index.css            # Global styles
│   ├── types.ts             # TypeScript types
│   └── vite-env.d.ts        # Vite environment types
├── netlify/                 # Netlify serverless functions
│   └── functions/           # API endpoints
├── index.html               # HTML template
├── package.json             # Dependencies & scripts
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
├── netlify.toml            # Netlify deployment config
├── .env                     # Environment variables
└── README.md               # Project documentation
```

## 🚀 **Development Workflow**

### **Available Scripts:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run clean` - Clean build artifacts
- `npm run type-check` - TypeScript type checking
- `npm run install-functions` - Install Netlify function dependencies

### **Environment Variables:**
All API keys use `VITE_` prefix for frontend access:
- `VITE_OPENROUTER_API_KEY`
- `VITE_HUGGINGFACE_API_KEY`
- `VITE_DEEPINFRA_API_KEY`
- `VITE_TOGETHER_API_KEY`
- `VITE_REPLICATE_API_KEY`
- `VITE_GROQ_API_KEY`
- `VITE_YOUTUBE_API_KEY`
- `VITE_NEWSDATA_API_KEY`
- `VITE_LASTFM_API_KEY`
- `VITE_REDDIT_CLIENT_ID`
- `VITE_REDDIT_CLIENT_SECRET`
- `VITE_RESEND_API_KEY`

### **Netlify Functions:**
Serverless functions in `netlify/functions/` handle:
- Email sending (Resend)
- AI chat responses
- YouTube summaries
- Reddit trending posts
- News data fetching
- Bluesky trending posts
- Hacker News trending stories

## 🧹 **Cleanup Summary**

### **Removed:**
- ❌ `backend/` folder (Express server)
- ❌ `netlify/functions/test.js` (unused test)
- ❌ `.DS_Store` files (macOS system files)
- ❌ Empty directories (`src/pages/`, `src/styles/`, `src/assets/`)
- ❌ `src/App.css` (unused CSS file)
- ❌ `dist/` build artifacts
- ❌ `setup-env.js` (redundant setup script)
- ❌ `ENVIRONMENT_SETUP.md` (redundant documentation)
- ❌ `netlify/functions/package.json` (consolidated into main package.json)
- ❌ `netlify/functions/node_modules/` (consolidated dependencies)

### **Updated:**
- ✅ Favicon to use new design
- ✅ Package.json scripts for better development
- ✅ Vite config for improved development experience
- ✅ Project structure documentation
- ✅ Consolidated package management (single package.json)
- ✅ Standardized environment variables (VITE_ prefix)
- ✅ Clean .env file structure

## 🔧 **Best Practices**

1. **Environment Variables**: Use `VITE_` prefix for frontend, no prefix for Netlify functions
2. **File Organization**: Keep components, services, and utilities in dedicated folders
3. **TypeScript**: Use strict type checking and proper type definitions
4. **Styling**: Use Tailwind CSS for consistent design system
5. **API Calls**: Use Netlify functions for server-side operations
6. **Build Process**: Use Vite for fast development and optimized builds

## 🚨 **Security Notes**

- API keys in Netlify functions are server-side only
- Frontend environment variables are public (use `VITE_` prefix)
- Never commit `.env` files to version control
- Use environment variables in Netlify dashboard for production 