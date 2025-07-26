# SpyDash - YouTube Analytics Dashboard

A modern, responsive YouTube analytics dashboard that provides comprehensive insights into YouTube channel performance.

## 🚀 Features

- **Real-time Analytics**: Fetch and display YouTube channel statistics
- **AI-Powered Summaries**: Generate intelligent summaries of video content
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Secure Authentication**: OTP-based user verification system
- **Netlify Functions**: Serverless backend for scalability

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- YouTube Data API v3 key
- OpenAI API key (optional, for AI summaries)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SpyDash_Final_Build
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=development
   ```

4. **Get API Keys**
   
   - **YouTube Data API v3**: 
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Create a new project or select existing one
     - Enable YouTube Data API v3
     - Create credentials (API key)
   
   - **OpenAI API** (optional):
     - Sign up at [OpenAI](https://openai.com/)
     - Generate an API key

## 🚀 Development

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Preview production build**
   ```bash
   npm run preview
   ```

## 🌐 Deployment

### Netlify (Recommended)

1. **Connect to Netlify**
   - Push your code to GitHub
   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Configure environment variables**
   - Go to Netlify dashboard → Site settings → Environment variables
   - Add your API keys:
     - `YOUTUBE_API_KEY`
     - `OPENAI_API_KEY`

3. **Deploy**
   - Netlify will automatically deploy on every push to main branch

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload to your hosting provider**
   - Upload the `dist` folder contents to your web server
   - Ensure your hosting provider supports serverless functions

## 📁 Project Structure

```
SpyDash_Final_Build/
├── functions/           # Netlify serverless functions
│   ├── fetchYouTube.js  # YouTube API integration
│   ├── summarize.js     # AI content summarization
│   └── verifyOTP.js     # OTP verification system
├── public/              # Static assets
│   └── logo.png         # Application logo
├── src/                 # Source code
│   ├── main.js          # Main application logic
│   └── style.css        # Styles and animations
├── index.html           # Main HTML file
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## 🔧 Configuration

### Vite Configuration
The `vite.config.js` file is configured for:
- Development server on port 3000
- Production build optimization
- Source maps for debugging
- Public directory for static assets

### Netlify Functions
Each function in the `functions/` directory:
- Handles CORS automatically
- Includes error handling
- Returns proper HTTP status codes
- Supports both GET and POST requests

## 🎨 Customization

### Styling
- Modify `src/style.css` to customize the appearance
- The design uses CSS Grid and Flexbox for responsive layouts
- Color scheme can be changed by modifying CSS custom properties

### Functionality
- Edit `src/main.js` to add new features
- Modify Netlify functions to integrate with different APIs
- Add new routes and components as needed

## 🔒 Security

- API keys are stored as environment variables
- CORS is properly configured for all functions
- OTP verification includes rate limiting
- Session tokens are cryptographically secure

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure your YouTube API key is valid and has the correct permissions
   - Check that the API key is properly set in environment variables

2. **CORS Errors**
   - Functions include CORS headers, but ensure your domain is allowed
   - Check browser console for specific error messages

3. **Build Errors**
   - Ensure all dependencies are installed: `npm install`
   - Check Node.js version compatibility
   - Clear cache: `npm run build -- --force`

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

## 📈 Performance

- Lazy loading for better initial load times
- Optimized images and assets
- Efficient API calls with caching
- Responsive design for all devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation

## 🔄 Updates

Stay updated with the latest features and bug fixes by:
- Following the repository
- Checking the releases page
- Reading the changelog

---

**Built with ❤️ using Vite, Netlify Functions, and modern web technologies** 