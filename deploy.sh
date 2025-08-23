#!/bin/bash

echo "🚀 Deploying Stefna AI Photo App to Netlify..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Netlify
    echo "🌐 Deploying to Netlify..."
    netlify deploy --prod --dir=dist
    
    echo "🎉 Deployment complete!"
    echo "📱 Your app is now live!"
    echo "🔧 Don't forget to set environment variables in Netlify dashboard:"
    echo "   VITE_STABILITY_API_KEY=your_api_key_here"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi 