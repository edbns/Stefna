import React from 'react'
import { FileText, Shield, Cookie } from 'lucide-react'
import { InstagramIcon, XIcon, FacebookIcon, TikTokIcon, ThreadsIcon, YouTubeIcon } from './SocialIcons'
import { useNavigate, useLocation } from 'react-router-dom'

const StickyFooter: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Only show footer on pages that have a sidebar (website layout) or profile page
  const shouldShowFooter = location.pathname === '/' || location.pathname.includes('/profile')

  if (!shouldShowFooter) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 w-[40%] bg-black/95 backdrop-blur-md z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo - All the way to the left */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center hover:opacity-80 transition-opacity duration-300"
            title="Go to Home"
          >
            <img 
              src="/logo.png" 
              alt="Stefna" 
              className="h-8 w-auto"
            />
          </button>
          
          {/* Social Media Links - Center (official icons, consistent with profile) */}
          <div className="flex items-center space-x-2">
            <a
              href="https://www.instagram.com/stefnaxyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="Instagram"
              aria-label="Instagram"
            >
              <InstagramIcon size={16} className="text-white" />
            </a>
            <a
              href="https://x.com/StefnaXYZ"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="X"
              aria-label="X"
            >
              <XIcon size={16} className="text-white" />
            </a>
            <a
              href="https://www.facebook.com/Stefnaxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="Facebook"
              aria-label="Facebook"
            >
              <FacebookIcon size={16} className="text-white" />
            </a>
            <a
              href="https://www.tiktok.com/@stefnaxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="TikTok"
              aria-label="TikTok"
            >
              <TikTokIcon size={16} className="text-white" />
            </a>
            <a
              href="https://www.threads.net/@stefnaxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="Threads"
              aria-label="Threads"
            >
              <ThreadsIcon size={16} className="text-white" />
            </a>
            <a
              href="https://www.youtube.com/channel/UCNBAWuWc8luYN8F0dIXX0RA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="YouTube"
              aria-label="YouTube"
            >
              <YouTubeIcon size={16} className="text-white" />
            </a>
          </div>
          
          {/* Legal Pages - All the way to the right */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/privacy')}
              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 relative group"
              title="Privacy Policy"
            >
                              <Shield size={18} className="text-white" />
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                Privacy Policy
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-black/90"></div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 relative group"
              title="Terms of Service"
            >
                              <FileText size={18} className="text-white" />
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                Terms of Service
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-black/90"></div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/cookies')}
              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 relative group"
              title="Cookies Policy"
            >
                              <Cookie size={18} className="text-white" />
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                Cookies Policy
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-black/90"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StickyFooter 