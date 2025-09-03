import React, { useState, useEffect } from 'react'
import { Sparkles, CheckCircle, AlertCircle, Download, Share2 } from 'lucide-react'
import UserSettingsService from '../services/userSettingsService'
// import { GenerationStatus, GenerationResult } from '../services/aiGenerationService'
// RemixIcon import removed

// Component disabled - types not available
interface GenerationProgressProps {
  isVisible: boolean
  status: any // GenerationStatus | null
  result?: any // GenerationResult | null
  onComplete?: () => void
  onError?: () => void
  onShareToFeed?: (result: any) => void
  // onAllowRemix removed
  onSave?: (result: any) => void
  onShareSocial?: (result: any) => void
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  isVisible,
  status,
  result,
  onComplete,
  onError,
  onShareToFeed,
  // onAllowRemix removed
  onSave,
  onShareSocial
}) => {

  const [isImageEnlarged, setIsImageEnlarged] = useState(false)
  const [shareToFeed, setShareToFeed] = useState(false) // Privacy-first default
  // allowRemix state removed

  // Load user's saved settings from database
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const settingsService = UserSettingsService.getInstance();
        const settings = await settingsService.loadSettings();
        setShareToFeed(settings.share_to_feed);
      } catch (error) {
        console.warn('Failed to load user settings:', error);
        // Fallback to localStorage
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setShareToFeed(!!profile.shareToFeed);
        } else {
          setShareToFeed(false); // Privacy-first default
        }
      }
    };
    
    loadUserSettings();
  }, []);

  useEffect(() => {
    if (status?.status === 'error') {
      setTimeout(() => {
        onError?.()
      }, 3000)
    }
  }, [status?.status, onError])

  if (!isVisible || !status) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/90 backdrop-blur-md rounded-lg p-8 border border-white/20 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          {/* Success State with Generated Media */}
          {status.status === 'completed' && result && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h3 className="text-white text-xl font-semibold">Generation Complete!</h3>
              
              {/* Generated Media Display */}
              <div className="relative">
                <img 
                  src={result.url} 
                  alt={result.prompt}
                  className={`mx-auto rounded-lg border border-white/20 cursor-pointer transition-all duration-300 ${
                    isImageEnlarged ? 'w-full max-w-2xl' : 'w-full max-w-xs'
                  }`}
                  onClick={() => setIsImageEnlarged(!isImageEnlarged)}
                />
                <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                  <span className="text-white text-sm font-medium">
                    {isImageEnlarged ? 'Click to shrink' : 'Click to enlarge'}
                  </span>
                </div>
              </div>
              
              {/* Prompt Display */}
              <div className="text-left bg-white/5 rounded-lg p-4">
                <p className="text-white/80 text-base font-medium mb-1">Prompt:</p>
                <p className="text-white text-base">{result.prompt}</p>
                {result.style && (
                  <p className="text-white/60 text-sm mt-1">Style: {result.style}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={async () => {
                    const newValue = !shareToFeed
                    setShareToFeed(newValue)
                    
                    // Update settings using the service
                    try {
                      const settingsService = UserSettingsService.getInstance();
                      await settingsService.updateSettings({ share_to_feed: newValue });
                    } catch (error) {
                      console.warn('Failed to persist share setting:', error)
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-all duration-300 ${
                    shareToFeed 
                      ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
                >
                  <Share2 size={18} />
                  <span className="text-sm font-medium">
                    {shareToFeed ? '✓ Share to Feed' : 'Share to Feed'}
                  </span>
                </button>
                
                {/* Allow Remix button removed - no more remix functionality */}
                
                <button
                  onClick={() => {
                    // Apply the selected options when saving
                    if (shareToFeed) onShareToFeed?.(result)
                    // allowRemix removed
                    onSave?.(result)
                  }}
                  className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg border border-white/20 transition-all duration-300"
                >
                  <Download size={18} />
                  <span className="text-sm font-medium">Save & Download</span>
                </button>
                
                <button
                  onClick={() => onShareSocial?.(result)}
                  className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg border border-white/20 transition-all duration-300"
                >
                  <Share2 size={18} />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onComplete}
                className="mt-4 text-white/60 hover:text-white transition-colors duration-300"
              >
                Close
              </button>
            </div>
          )}

          {/* Error State */}
          {status.status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h3 className="text-white text-xl font-semibold">Generation Failed</h3>
              <p className="text-white/60">{status.error || 'Something went wrong'}</p>
            </div>
          )}

          {/* Processing State */}
          {status.status === 'processing' && (
            <div className="space-y-6">
                              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Sparkles size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-white text-xl font-semibold mb-2">Creating Your AI Art</h3>
                <p className="text-white/60 text-sm mb-4">This may take a few moments...</p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
                
                <p className="text-white/40 text-sm">{Math.round(status.progress)}% complete</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerationProgress 