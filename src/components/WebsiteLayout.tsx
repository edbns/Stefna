import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, ArrowUp, Check, FileText, Image, Bell, Filter, Video, User, LogOut } from 'lucide-react'
import MediaCard from './MediaCard'
import FullScreenMediaViewer from './FullScreenMediaViewer'
import SlideSignupGate from './SlideSignupGate'

// import FloatingHeader from './FloatingHeader' // Removed mobile component

import { UserTier } from '../services/tokenService'
import tokenService from '../services/tokenService'
import aiGenerationService, { GenerationRequest } from '../services/aiGenerationService'
import contentModerationService from '../services/contentModerationService'
import authService from '../services/authService'
import userMediaService from '../services/userMediaService'
import { runPresetI2I, runI2I, runV2V, listUserAssets, deleteAsset, purgeUserAssets } from '../lib/cloudinary'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'
import { signedFetch } from '../lib/auth'
import { addToGallery } from '../lib/gallery'
import {
  AnimeDreamIcon,
  CyberpunkNeonIcon,
  OilPaintingIcon,
  StudioGhibliIcon,
  PhotorealisticIcon,
  WatercolorIcon
} from './AIBrushIcons'


const WebsiteLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // Custom auth state will be implemented
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // User settings state - reactive to profile changes
  const [userSettings, setUserSettings] = useState(() => {
    try {
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        return {
          shareToFeed: profile.shareToFeed ?? true,
          allowRemix: profile.allowRemix ?? true
        }
      }
    } catch (error) {
      console.error('Failed to load user settings:', error)
    }
    // Default settings if no profile found
    return {
      shareToFeed: true,
      allowRemix: true
    }
  })
  // Unified sidebar state management
  const [sidebarMode, setSidebarMode] = useState<'idle' | 'upload' | 'remix' | 'i2iv2v'>('idle')
  const [uploadedMedia, setUploadedMedia] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'prompt' | 'aiasabrush'>('prompt')
  
  // Debounced style selection to prevent race conditions
  const [styleClickDebounce, setStyleClickDebounce] = useState<NodeJS.Timeout | null>(null)
  // In-flight guard to prevent double-clicks and races
  const [presetInFlight, setPresetInFlight] = useState(false)
  const [typewriterText, setTypewriterText] = useState('')
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [items, setItems] = useState(50)

  // Core app state
  const [userTier, setUserTier] = useState<UserTier>(UserTier.REGISTERED)
  // Get user ID from auth service or generate guest ID
  const getCurrentUserId = () => {
    const user = authService.getCurrentUser()
    return user?.id || `guest-${Date.now()}`
  }
  const [userId] = useState<string>(getCurrentUserId())
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [remixedMedia, setRemixedMedia] = useState<string | null>(null)
  const [remixPrompt, setRemixPrompt] = useState<string>('')
  const [isRemixing, setIsRemixing] = useState(false)
  const [selectedVariation, setSelectedVariation] = useState<number>(1) // Default to 1 variation
  const fileInputRef = useRef<HTMLInputElement>(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerMedia, setViewerMedia] = useState<Array<{ id: string; url: string; prompt: string; aspectRatio: number }>>([])

  const prompts = [
    'Dreamy neon city at midnight',
    'Vintage film look with pastel tones',
    'Cyberpunk portrait with glowing effects',
    'Minimalist studio portrait, soft light',
    'Surreal double exposure with nature',
    'Pop art style with bold colors'
  ]

  // Load authentication state on mount and listen for changes
  useEffect(() => {
    const updateAuthState = () => {
    const authState = authService.getAuthState()
      const wasAuthenticated = isAuthenticated
    setIsAuthenticated(authState.isAuthenticated)
    
    if (authState.user) {
      // Map user tier to UserTier enum
      const tierMap: { [key: string]: UserTier } = {
        'registered': UserTier.REGISTERED, 
        'pro': UserTier.VERIFIED,
        'verified': UserTier.VERIFIED,
        'contributor': UserTier.CONTRIBUTOR
      }
      setUserTier(tierMap[authState.user.tier] || UserTier.REGISTERED)
    }

      // Check for pending generation state after successful authentication
      if (!wasAuthenticated && authState.isAuthenticated) {
        restorePendingGeneration()
      }
    }

    // Initial load
    updateAuthState()
    
    // Check auth state changes periodically (simple polling approach)
    const authCheckInterval = setInterval(updateAuthState, 1000)
    
    return () => clearInterval(authCheckInterval)
  }, [isAuthenticated])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (styleClickDebounce) {
        clearTimeout(styleClickDebounce)
      }
    }
  }, [styleClickDebounce])

  // Listen for profile changes to update user settings
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedProfile = localStorage.getItem('userProfile')
        if (savedProfile) {
          const profile = JSON.parse(savedProfile)
          setUserSettings({
            shareToFeed: profile.shareToFeed ?? true,
            allowRemix: profile.allowRemix ?? true
          })
        }
      } catch (error) {
        console.error('Failed to load updated user settings:', error)
      }
    }

    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for changes (for same-tab updates)
    const interval = setInterval(handleStorageChange, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Respond to router state for remix deep-linking (works on same-route navigation)
  useEffect(() => {
    const state: any = (location && (location as any).state) || null
    if (state?.remixUrl) {
      handleRemixMedia(state.remixUrl)
      if (typeof state.remixPrompt === 'string') {
        setRemixPrompt(state.remixPrompt)
      }
    }
    // Open editor for edit flow
    if (state?.editUrl) {
      setUploadedMedia(state.editUrl)
      setSidebarMode('upload')
      setActiveTab('prompt')
      setCustomPrompt(state.editPrompt || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  // Typewriter effect
  useEffect(() => {
    if (!uploadedMedia && !isRemixing) return

    const currentPrompt = prompts[currentPromptIndex]
    let charIndex = 0

    const typeInterval = setInterval(() => {
      if (charIndex <= currentPrompt.length) {
        setTypewriterText(currentPrompt.slice(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeInterval)
        // Wait before starting next prompt
        setTimeout(() => {
          setCurrentPromptIndex((prev) => (prev + 1) % prompts.length)
          setTypewriterText('')
        }, 2000)
      }
    }, 100)

    return () => clearInterval(typeInterval)
  }, [currentPromptIndex, uploadedMedia, isRemixing])

  // Generation state
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftMedia, setDraftMedia] = useState<string | null>(null)
  
  // AI as a Brush presets with context-aware suggestions
  const aiAsBrushStyles = [
    { 
      id: 'anime-dream', 
      name: 'Anime Dream', 
      icon: AnimeDreamIcon,
      description: 'Vibrant anime-style artwork',
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #45B7D1 100%)',
      example: 'Dreamy anime characters with vibrant colors',
      // Context-aware examples - style-only instructions
      contextExamples: {
        'animal': 'anime art style, vibrant colors, detailed line work, soft shading, preserve subject and composition',
        'person': 'anime art style, vibrant colors, detailed line work, soft shading, preserve subject and composition',
        'landscape': 'anime art style, vibrant colors, detailed line work, soft shading, preserve subject and composition',
        'object': 'anime art style, vibrant colors, detailed line work, soft shading, preserve subject and composition',
        'default': 'anime art style, vibrant colors, detailed line work, soft shading, preserve subject and composition'
      } as Record<string, string>
    },
    { 
      id: 'cyberpunk', 
      name: 'Cyberpunk', 
      icon: CyberpunkNeonIcon,
      description: 'Neon-lit futuristic scenes',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff0080 100%)',
      example: 'Neon lights, dark streets, tech aesthetics',
      contextExamples: {
        'animal': 'neon lighting, high-contrast cyberpunk color grading, chrome highlights, retain original subject',
        'person': 'neon lighting, high-contrast cyberpunk color grading, chrome highlights, retain original subject',
        'landscape': 'neon lighting, high-contrast cyberpunk color grading, chrome highlights, retain original subject',
        'object': 'neon lighting, high-contrast cyberpunk color grading, chrome highlights, retain original subject',
        'default': 'neon lighting, high-contrast cyberpunk color grading, chrome highlights, retain original subject'
      } as Record<string, string>
    },
    { 
      id: 'oil-painting', 
      name: 'Oil Painting', 
      icon: OilPaintingIcon,
      description: 'Classic oil painting texture',
      gradient: 'linear-gradient(135deg, #8B4513 0%, #DAA520 50%, #F4A460 100%)',
      example: 'Rich textures, classical art style',
      contextExamples: {
        'animal': 'oil painting style, thick brush strokes, canvas texture, preserve subject and composition',
        'person': 'oil painting style, thick brush strokes, canvas texture, preserve subject and composition',
        'landscape': 'oil painting style, thick brush strokes, canvas texture, preserve subject and composition',
        'object': 'oil painting style, thick brush strokes, canvas texture, preserve subject and composition',
        'default': 'oil painting style, thick brush strokes, canvas texture, preserve subject and composition'
      } as Record<string, string>
    },
    { 
      id: 'studio-ghibli', 
      name: 'Studio Ghibli', 
      icon: StudioGhibliIcon,
      description: 'Magical Ghibli-inspired art',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #89f7fe 100%)',
      example: 'Whimsical, nature-inspired, magical',
      contextExamples: {
        'animal': 'ghibli-inspired soft shading, gentle color palette, clean lines, keep same subject and pose',
        'person': 'ghibli-inspired soft shading, gentle color palette, clean lines, keep same subject and pose',
        'landscape': 'ghibli-inspired soft shading, gentle color palette, clean lines, keep same subject and pose',
        'object': 'ghibli-inspired soft shading, gentle color palette, clean lines, keep same subject and pose',
        'default': 'ghibli-inspired soft shading, gentle color palette, clean lines, keep same subject and pose'
      } as Record<string, string>
    },
    { 
      id: 'photorealistic', 
      name: 'Photorealistic', 
      icon: PhotorealisticIcon,
      description: 'Ultra-realistic photography',
      gradient: 'linear-gradient(135deg, #2C3E50 0%, #34495E 50%, #BDC3C7 100%)',
      example: 'Sharp details, lifelike quality',
      contextExamples: {
        'animal': 'highly detailed photographic style, natural skin/fur texture, realistic lighting, keep original composition',
        'person': 'highly detailed photographic style, natural skin/fur texture, realistic lighting, keep original composition',
        'landscape': 'highly detailed photographic style, natural skin/fur texture, realistic lighting, keep original composition',
        'object': 'highly detailed photographic style, natural skin/fur texture, realistic lighting, keep original composition',
        'default': 'highly detailed photographic style, natural skin/fur texture, realistic lighting, keep original composition'
      } as Record<string, string>
    },
    { 
      id: 'watercolor', 
      name: 'Watercolor', 
      icon: WatercolorIcon,
      description: 'Soft watercolor painting',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      example: 'Soft blends, artistic brush strokes',
      contextExamples: {
        'animal': 'watercolor painting style, soft blends, flowing colors, gentle brushstrokes, preserve subject and composition',
        'person': 'watercolor painting style, soft blends, flowing colors, gentle brushstrokes, preserve subject and composition',
        'landscape': 'watercolor painting style, soft blends, flowing colors, gentle brushstrokes, preserve subject and composition',
        'object': 'watercolor painting style, soft blends, flowing colors, gentle brushstrokes, preserve subject and composition',
        'default': 'watercolor painting style, soft blends, flowing colors, gentle brushstrokes, preserve subject and composition'
      } as Record<string, string>
    }
  ]

  // Context detection function
  const detectContentContext = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        // Create a canvas to analyze the image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve('default')
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Simple content detection based on image analysis
        // This is a basic implementation - in production, you'd use a more sophisticated AI model
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Analyze colors and patterns to make educated guesses
        let redSum = 0, greenSum = 0, blueSum = 0
        let pixelCount = 0

        for (let i = 0; i < data.length; i += 4) {
          redSum += data[i]
          greenSum += data[i + 1]
          blueSum += data[i + 2]
          pixelCount++
        }

        const avgRed = redSum / pixelCount
        const avgGreen = greenSum / pixelCount
        const avgBlue = blueSum / pixelCount

        // Simple heuristics for content detection
        // More green/blue might indicate landscape
        if (avgGreen > avgRed && avgGreen > avgBlue) {
          resolve('landscape')
        }
        // More balanced colors might indicate person or object
        else if (Math.abs(avgRed - avgGreen) < 30 && Math.abs(avgGreen - avgBlue) < 30) {
          resolve('person')
        }
        // Warm colors might indicate animal or object
        else if (avgRed > avgBlue) {
          resolve('animal')
        }
        else {
          resolve('object')
        }
      }
      img.onerror = () => resolve('default')
      img.src = imageData
    })
  }

  // Get context-aware example for a style
  const getContextAwareExample = (styleId: string, context: string): string => {
    const style = aiAsBrushStyles.find(s => s.id === styleId)
    if (!style) return 'Transform this image into something amazing...'
    
    return style.contextExamples?.[context] || style.contextExamples?.default || style.example
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      addNotification('Invalid file type', 'Only images and videos are supported', 'warning')
      return
    }
    
    // Validate file size (8MB limit)
    if (file.size > 8 * 1024 * 1024) {
      addNotification(
        'File too large', 
        `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB - limit is 8MB. Please compress your file or use a smaller one.`, 
        'warning'
      )
      return
    }

    // Validate file format
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi']
    
    if (file.type.startsWith('image/') && !validImageTypes.includes(file.type)) {
      addNotification('Unsupported image format', 'Please use JPEG, PNG, GIF, or WebP', 'warning')
      return
    }
    
    if (file.type.startsWith('video/') && !validVideoTypes.includes(file.type)) {
      addNotification('Unsupported video format', 'Please use MP4, WebM, MOV, or AVI', 'warning')
      return
    }
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = e.target?.result as string
      setUploadedMedia(result) // Keep for preview
      setUploadedFile(file) // Store original file for Cloudinary
      setSidebarMode('upload')
      setActiveTab('prompt') // Default to prompt tab
      
      // Show upload progress notification
      addNotification(
        'File Ready', 
        `${file.name} (${(file.size / 1024).toFixed(1)}KB) ready for transformation`, 
        'processing'
      )
      
      // Smart detection: If it's an image, detect context and suggest appropriate prompts
      if (file.type.startsWith('image/')) {
        let context: string = 'default'
        try {
          context = await detectContentContext(result)
          const suggestedPrompt = getContextAwareExample('oil-painting', context) // Default to oil painting for suggestion
          setCustomPrompt(suggestedPrompt)
          
          // Show context-aware notification
          const contextNames: Record<string, string> = {
            'animal': 'animal',
            'person': 'person',
            'landscape': 'landscape',
            'object': 'object',
            'default': 'content'
          }
          addNotification(
            'Content Detected', 
            `Detected ${contextNames[context] || 'content'} - AI presets will be tailored to your upload!`, 
            'info'
          )
        } catch (error) {
          console.warn('Context detection failed, using fallback:', error)
          setCustomPrompt('Transform this image into something amazing...')
        }
      } else if (file.type.startsWith('video/')) {
        setCustomPrompt('Transform this video with a cinematic style...')
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle style selection for #AiAsABrush
  const handleStyleSelect = async (styleId: string) => {
    // Clear any existing debounce
    if (styleClickDebounce) {
      clearTimeout(styleClickDebounce)
    }
    
    // Debounce the actual selection by 250ms
    const timeout = setTimeout(() => {
      performStyleSelect(styleId)
    }, 250)
    
    setStyleClickDebounce(timeout)
  }
  
  const performStyleSelect = async (styleId: string) => {
    const style = aiAsBrushStyles.find(s => s.id === styleId)
    if (style) {
      setSelectedStyle(style.name)
      
      let promptToUse = style.example // Default prompt
      
      // Detect content context if we have uploaded media
      if (uploadedMedia && uploadedFile) {
        let context: string = 'default'
        try {
          context = await detectContentContext(uploadedMedia)
          const contextAwareExample = getContextAwareExample(styleId, context)
          promptToUse = contextAwareExample // Use context-aware prompt
          setCustomPrompt(contextAwareExample)
          
          console.log(`🎨 Style: ${style.name}, Context: ${context}, Prompt: ${contextAwareExample}, File: ${uploadedFile.name}`)
        } catch (error) {
          console.warn('Context detection failed, using fallback:', error)
          setCustomPrompt(style.example)
        }
      } else {
        setCustomPrompt(style.example)
      }
      
      // Auto-generate when style is selected in #AiAsABrush mode
      if (activeTab === 'aiasabrush' && uploadedMedia && uploadedFile) {
        if (promptToUse.trim()) {
          // In-flight guard: prevent double-clicks and races
          if (presetInFlight) {
            console.log('🚫 Preset already in flight, ignoring click')
            return
          }
          
          // Use reliable preset runner with locked asset state
          try {
            setPresetInFlight(true)
            setIsGenerating(true)
            
            const currentAsset = {
              url: uploadedMedia,
              width: 1024, // Default size, will be adjusted by backend
              height: 1024,
              id: `upload_${Date.now()}`,
              file: uploadedFile // Pass the original file for upload if needed
            }
            
            console.log('🎨 Triggering preset:', style.name, 'for asset:', currentAsset.url.substring(0, 50) + '...')
            
            const data = await runPresetWithJobId(currentAsset, style.name)
            console.log("🔍 AIML echo:", data.echo)
            
            // Comprehensive assertion to catch any preset issues
            console.assert(
              data.echo?.mode === "i2i" && 
              data.result_url && 
              data.result_url !== data.source_url,
              "Preset must return stylized I2I result",
              { got: data }
            )
            
            // Validate transformation occurred
            if (!data.result_url || data.result_url === data.source_url) {
              throw new Error("No transformation detected (result equals source). Try higher strength.")
            }
            
            // Add cache-busting and save result
            const displayUrl = `${data.result_url}${data.result_url.includes("?") ? "&" : "?"}t=${Date.now()}`
            
            // ACTUALLY ADD TO GALLERY (no more TODO!)
            const newItem = {
              id: `preset_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              url: displayUrl,
              type: "photo" as const,
              kind: "result",
              prompt: data.echo?.presetName || style.name,
              meta: data.echo,
              createdAt: new Date().toISOString()
            }
            
            // Add to gallery using proper gallery service
            addToGallery(newItem)
            console.log('✅ Added to gallery:', { url: displayUrl.substring(0, 50) + '...', type: "photo" })
            
            // Optional: persist to DB AFTER success
            try {
              const resp = await signedFetch("/.netlify/functions/record-asset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: data.result_url,          // save RAW result_url (no ?t= cachebuster)
                  resource_type: "image",        // <-- IMPORTANT: use "image" not "photo"
                  meta: data.echo
                })
              })

              const payload = await resp.json().catch(() => null)
              if (!resp.ok) {
                console.error("record-asset failed:", payload)
                addNotification("Save failed", payload?.message || "Couldn't save to your profile.", "error")
              } else {
                console.log('✅ Saved to database')
                addNotification("Saved", "Added to your profile.", "success")
              }
            } catch (dbError) {
              console.error('⚠️ Database save error:', dbError)
              addNotification("Save failed", "Network error saving to profile.", "error")
            }
            
            addNotification('Preset Applied!', `${style.name} style applied successfully`, 'success')
            
            // IMPORTANT: Preset completed - DO NOT auto-trigger any other generation
            console.log('✅ Preset completed successfully. No further generation should occur.')
            
            // Reset filters to show the new item immediately
            setCreatorFilter(null)
            setCurrentFilter('all')
            
            // Clear uploaded media state to prevent triggering variation pipeline later
            setUploadedMedia(null)
            setUploadedFile(null)
            // Note: Keep sidebar open so user can see the result and continue working
            
            // CRITICAL: Return immediately to prevent any follow-up calls
            return
            
          } catch (error) {
            console.error('Preset generation failed:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            
            // Show specific error message for data URL issues
            if (errorMessage.includes('data URL') || errorMessage.includes('non-fetchable')) {
              addNotification('Upload Required', 'Please save your image to Cloudinary first, then try the preset again.', 'warning')
            } else if (errorMessage.includes('Provider error 429') || errorMessage.includes('rate limit')) {
              addNotification('Provider Busy', 'AI service is experiencing high demand. Please try again in a moment.', 'warning')
            } else if (errorMessage.includes('Provider error 5')) {
              addNotification('Provider Busy', 'AI service temporarily unavailable. Please try again.', 'warning')
            } else {
              addNotification('Generation Failed', errorMessage, 'error')
            }
            
            // CRITICAL: Return immediately on error to prevent any follow-up calls
            return
          } finally {
            setPresetInFlight(false)
            setIsGenerating(false)
          }
        }
      }
    }
  }

  // Helper to check if URL is HTTP(S)
  const isHttpUrl = (u?: string) => typeof u === "string" && /^https?:\/\//i.test(u)

  // Helper to convert data URL to blob
  const dataUrlToBlob = async (dataUrl: string) => {
    const r = await fetch(dataUrl)
    return await r.blob()
  }

  // Ensure asset is uploaded to Cloudinary before sending to AIML
  const ensureCloudinaryAsset = async (asset: { url: string; width?: number; height?: number; file?: File; id?: string }) => {
    if (isHttpUrl(asset.url)) {
      console.log('✅ Asset already has HTTPS URL:', asset.url.slice(0, 50) + '...')
      // normalize to the shape runPreset expects
      return { secure_url: asset.url, width: asset.width || 1024, height: asset.height || 1024, public_id: null }
    }
    
    console.log('📤 Converting data URL to Cloudinary asset...')
    
    const currentUserId = authService.getCurrentUser()?.id || userId
    const folder = `users/${currentUserId || "unknown"}`
    
    const uploaded = await uploadToCloudinary(
      asset.file ?? asset.url, // file if you have it, otherwise data URL
      folder
    )
    
    if (!uploaded?.secure_url) {
      console.error('Cloudinary upload failed payload:', uploaded)
      throw new Error('Cloudinary upload failed: no secure_url')
    }
    
    console.log('✅ Uploaded to Cloudinary:', String(uploaded.secure_url).slice(0, 50) + '...')
    
    return { 
      secure_url: uploaded.secure_url, 
      width: uploaded.width, 
      height: uploaded.height, 
      public_id: uploaded.public_id 
    }
  }

  // Direct AIML API call with job tracking (bypassing cloudinary.js complications)
  const runPresetWithJobId = async (asset: { url: string; width?: number; height?: number; id?: string; file?: File }, presetName: string) => {
    // Generate unique job ID for this preset run
    const jobId = crypto.randomUUID()
    console.log('🏷️ Starting preset job:', jobId)
    
    // Ensure we have a Cloudinary URL
    const cloudinaryAsset = await ensureCloudinaryAsset(asset)
    console.log('🎯 Using secure URL for I2I:', cloudinaryAsset.secure_url.slice(0, 50) + '...')
    
    // Get preset configuration
    const { PRESETS } = await import('../config/freeMode')
    const preset = PRESETS[presetName]
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`)
    }
    
    // Call AIML API directly with job tracking
    const response = await signedFetch("/.netlify/functions/aimlApi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: cloudinaryAsset.secure_url,  // Use Cloudinary URL
        width: cloudinaryAsset.width,
        height: cloudinaryAsset.height,
        prompt: preset.prompt,
        negative_prompt: preset.negative,
        strength: preset.strength ?? 0.85,
        steps: 40,
        guidance_scale: 7.5,
        presetName: presetName,
        jobId,                        // Send jobId
        source: "preset"              // Send source
      })
    })
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Preset failed")
    }

    const data = await response.json()
    console.log("Server sent jobId:", data?.echo?.jobId)
    console.log("Client sent jobId:", jobId)
    
    // Tripwire: only accept if it's the same request we sent
    if (data?.echo?.jobId !== jobId || data?.echo?.source !== "preset") {
      console.warn("🚨 Ignoring stale/mismatched result", { 
        want: jobId, 
        got: data?.echo?.jobId, 
        wantSource: "preset", 
        gotSource: data?.echo?.source 
      })
      throw new Error("Job ID mismatch - ignoring stale result")
    }
    
    console.log('✅ Job ID confirmed:', jobId)
    return data
  }

  // Helper function to restore pending generation state after authentication
  const restorePendingGeneration = async () => {
    try {
      const pendingGenerationData = localStorage.getItem('pendingGeneration')
      if (!pendingGenerationData) return

      const generationState = JSON.parse(pendingGenerationData)
      
      // Check if the saved state is recent (within 30 minutes)
      const timeDiff = Date.now() - generationState.timestamp
      if (timeDiff > 30 * 60 * 1000) {
        localStorage.removeItem('pendingGeneration')
        return
      }

      // Restore the generation state
      if (generationState.uploadedMedia) {
        setUploadedMedia(generationState.uploadedMedia)
      }
      if (generationState.sidebarMode) {
        setSidebarMode(generationState.sidebarMode)
      }
      if (generationState.remixedMedia) {
        setRemixedMedia(generationState.remixedMedia)
      }
      if (generationState.remixPrompt) {
        setRemixPrompt(generationState.remixPrompt)
      }
      if (generationState.selectedVariation) {
        setSelectedVariation(generationState.selectedVariation)
      }
      if (generationState.styleName) {
        setSelectedStyle(generationState.styleName)
      }

      // Clean up the saved state
      localStorage.removeItem('pendingGeneration')

      // Show notification that state was restored
      addNotification('Welcome back!', 'Your upload has been restored. You can now continue generating.', 'success')

      // Auto-trigger generation if we had a prompt
      if (generationState.prompt) {
        setTimeout(() => {
          if (generationState.sidebarMode === 'remix' && generationState.remixPrompt) {
            // Restore remix generation
            handleRemixGenerate()
          } else {
            // Restore regular generation
            handleGenerateWithPrompt(generationState.prompt, generationState.styleName, { source: 'restored' })
          }
        }, 1000) // Small delay to let UI update
      }
    } catch (error) {
      console.error('Failed to restore pending generation:', error)
      localStorage.removeItem('pendingGeneration')
    }
  }

  // Helper function to handle generation with a specific prompt
  const handleGenerateWithPrompt = async (prompt: string, styleName?: string, context?: { source?: 'preset' | 'custom' | 'restored' }) => {
    if (!prompt.trim()) {
      addNotification('Prompt required', 'Please enter a prompt', 'warning')
      return
    }

    // Guard: DO NOT auto-generate after presets (but allow restored generations)
    if (context?.source === 'preset') {
      console.log('🚫 Blocked auto-generation after preset completion')
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save current generation state before redirecting to auth
      const generationState = {
        prompt,
        styleName: styleName || selectedStyle,
        uploadedMedia,
        uploadedFile: uploadedFile ? {
          name: uploadedFile.name,
          type: uploadedFile.type,
          size: uploadedFile.size
        } : null,
        sidebarMode,
        remixedMedia,
        remixPrompt,
        selectedVariation,
        timestamp: Date.now()
      }
      localStorage.setItem('pendingGeneration', JSON.stringify(generationState))
      
      addNotification('Login Required', 'Please sign in to generate content', 'warning')
      navigate('/auth')
      return
    }

    // Check content moderation before generation
    try {
      const moderationResult = await contentModerationService.checkPrompt(prompt)
      if (!moderationResult.isAppropriate) {
        addNotification('Content blocked', `${moderationResult.reason} - Please revise your prompt`, 'warning')
        return
      }
    } catch (error) {
      console.error('Content moderation check failed:', error)
      // Continue with generation if moderation fails
    }

    setIsGenerating(true)

    try {
      // Determine type first for token check
      let type: 'photo' | 'video' = 'photo'
      
      if (uploadedFile) {
        const isVideo = uploadedFile.type.startsWith('video/')
        if (isVideo) type = 'video'
      }

      // Check token availability first
      const tokenCheck = await tokenService.canGenerate(userId, userTier, type, 'high')
      
      if (!tokenCheck.canGenerate) {
        if (tokenCheck.reason?.includes('Daily limit')) {
          addNotification('Daily limit reached', `${tokenCheck.remainingTokens || 0} tokens remaining`, 'warning')
        } else if (tokenCheck.reason?.includes('Rate limited')) {
          addNotification('Too many requests', 'Please wait 30 seconds between generations', 'warning')
        } else if (tokenCheck.reason?.includes('Service temporarily unavailable')) {
          addNotification('Service unavailable', 'High demand - please try again later', 'error')
        } else {
          addNotification('Generation blocked', tokenCheck.reason || 'Unable to generate', 'error')
        }
        setIsGenerating(false)
        return
      }

    // Show processing notification
    addNotification('Processing Your Media', 'Creating content...', 'processing')

      let result: any
      
      if (uploadedFile) {
        // Check if user uploaded a file (I2I/V2V scenario)
        const isImage = uploadedFile.type.startsWith('image/')
        const isVideo = uploadedFile.type.startsWith('video/')
        
        // Check prompt for transformation keywords
        const transformationKeywords = [
          'transform', 'convert', 'change', 'turn into', 'make it', 'style', 
          'apply', 'filter', 'effect', 'enhance', 'modify', 'alter'
        ]
        
        const hasTransformationKeywords = transformationKeywords.some(keyword => 
          prompt.toLowerCase().includes(keyword)
        )
        
        // Check if this is an AI preset - those are handled by the new runPreset function
        const isAIPresetGeneration = styleName && activeTab === 'aiasabrush'
        
        if (isAIPresetGeneration) {
          // AI presets are now handled in handleStyleSelect, not here
          console.log(`🎨 AI preset generation should be handled by handleStyleSelect, not custom prompt generation`)
          addNotification('Use AI Brush', 'AI presets are applied automatically when selected', 'info')
          return
        }
        
        // Check for transformation keywords to use I2I/V2V
        if (isImage && hasTransformationKeywords) {
          console.log(`🖼️ Using AIML I2I for image transformation. Prompt: "${prompt.substring(0, 50)}..."`)
          
          // Use AIML I2I for image transformation
          const currentAsset = {
            url: uploadedMedia || '',
            width: 1024,
            height: 1024,
            file: uploadedFile,
            id: `transform_${Date.now()}`
          }
          
          const data = await runPresetWithJobId(currentAsset, 'Custom Transform')
          
          result = {
            success: true,
            result: {
              id: `i2i_${Date.now()}`,
              url: data.result_url,
              prompt: prompt,
              type: 'photo',
              tokensUsed: 2
            }
          }
        } else if (isVideo && hasTransformationKeywords) {
          // Video transformation - for now fall back to text generation
          console.log(`🎥 Video transformation not yet implemented with AIML API`)
          addNotification('Video Transform', 'Video transformation coming soon', 'info')
          return
        } else {
          // We have uploaded media but no transformation keywords - could be remix/variation
          if (uploadedMedia && isImage) {
            console.log(`🖼️ Using I2I for image variation. Prompt: "${prompt.substring(0, 50)}..."`)
            const request: GenerationRequest = {
              prompt,
              type: 'photo',
              quality: 'high',
              style: styleName || selectedStyle,
              userId: userId,
              userTier: userTier,
              imageUrl: uploadedMedia,  // 🔥 Pass the image for I2I - server will pick model
              samples: selectedVariation // Number of variations to generate
            }
            result = await aiGenerationService.generateContent(request)
          } else {
            console.log(`📝 Using text-to-image generation. Prompt: "${prompt.substring(0, 50)}..."`)
            // Regular text-to-image
            const request: GenerationRequest = {
              prompt,
              type: 'photo',
              quality: 'high',
              style: styleName || selectedStyle,
              userId: userId,
              userTier: userTier,
              samples: selectedVariation // Number of variations to generate
            }
            result = await aiGenerationService.generateContent(request)
          }
        }
      } else {
        // No uploaded media - regular text-to-image generation
        console.log(`📝 Text-to-image generation. Prompt: "${prompt.substring(0, 50)}..."`)
      const request: GenerationRequest = {
        prompt,
          type: 'photo',
          quality: 'high',
        style: styleName || selectedStyle,
        userId: userId,
          userTier: userTier,
          samples: selectedVariation // Number of variations to generate
        }
        result = await aiGenerationService.generateContent(request)
      }
      
      if (result.success && result.result) {
        // Generate a media URL for the notification and user profile
        const mediaUrl = result.result.url || uploadedMedia || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QbGFjZWhvbGRlciBJbWFnZTwvdGV4dD4KPC9zdmc+'
        const aspectRatio = 4/3 // Default aspect ratio
        const width = 800
        const height = Math.round(width / aspectRatio)
        
        // Use the component-level userSettings

        // Save to user media profile (assign TTL if guest)
        await userMediaService.saveMedia({
          userId: userId,
          type: result.result.type || type,
          url: mediaUrl,
          prompt: prompt,
          style: activeTab === 'aiasabrush' ? (styleName || selectedStyle) : undefined,
          aspectRatio: aspectRatio,
          width: width,
          height: height,
          tokensUsed: result.result.tokensUsed || 2,
          isPublic: userSettings.shareToFeed,
          allowRemix: userSettings.allowRemix,
          tags: prompt.split(' ').slice(0, 3), // Extract first 3 words as tags
          metadata: {
            quality: 'high',
            generationTime: 2000,
            modelVersion: 'v2.0'
          }
        }, userSettings)
        
        // Refresh public feed if media was shared to feed
        if (userSettings.shareToFeed) {
          await refreshPublicFeed()
        }
        
        addNotification('Your Media is Ready', 'Content generated successfully', 'complete', mediaUrl, 'image')
        
        // Reset filters to show the new item immediately
        setCreatorFilter(null)
        setCurrentFilter('all')
        
        // Deduct tokens after successful generation
        await tokenService.generateContent(userId, userTier, type, 'high', prompt, '127.0.0.1', 'browser-device')
        console.log('Generated result and saved to profile:', result.result)
      } else {
        if (result.error?.includes('timeout')) {
          addNotification('Generation timeout', 'Request took too long - please try again', 'error')
        } else if (result.error?.includes('quota')) {
          addNotification('Service limit reached', 'AI service quota exceeded', 'error')
        } else if (result.error?.includes('inappropriate')) {
          addNotification('Content policy violation', 'Please revise your prompt', 'warning')
        } else {
          addNotification('Generation failed', result.error || 'Please try again', 'error')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed'
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        addNotification('Connection error', 'Check your internet connection', 'error')
      } else if (errorMessage.includes('unauthorized')) {
        addNotification('Authentication error', 'Please sign in again', 'error')
      } else {
        addNotification('Generation error', errorMessage, 'error')
      }
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Reset sidebar to initial state
  const resetSidebar = () => {
    setUploadedMedia(null)
    setUploadedFile(null)
    setSidebarMode('idle')
    setActiveTab('prompt')
    setCustomPrompt('')
    setSelectedStyle('')
    setRemixedMedia(null)
    setRemixPrompt('')
    setIsRemixing(false)
  }

  // Clerk handles authentication - no custom login needed

  
  const handleLogout = async () => {
    try {
      authService.logout()
      setIsAuthenticated(false)
      setUserTier(UserTier.REGISTERED)
      
      // Clear any uploaded media state
      setUploadedMedia(null)
      setUploadedFile(null)
      resetSidebar()
      
      addNotification('Signed out successfully', '', 'info')
    } catch (error) {
      console.error('Logout error:', error)
      addNotification('Sign out failed', '', 'error')
    }
  }

  const handleLike = async (_id: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      addNotification('Login Required', 'Please sign in to like media', 'warning')
      navigate('/auth')
      return
    }
    
    const user = authService.getCurrentUser()
    const currentUserId = user?.id || localStorage.getItem('stefna_guest_id') || 'guest-anon'
    const { liked } = await userMediaService.toggleLike(_id, currentUserId)
    setLikedItems(prev => {
      const updated = new Set(prev)
      if (liked) updated.add(_id); else updated.delete(_id)
      return updated
    })
  }

  const handleRemix = (_id: string) => {
    // Require login for remix functionality
    if (!isAuthenticated) {
      addNotification('Login Required', 'Please sign in to remix media', 'warning')
      navigate('/auth')
      return
    }

    // Get the item to remix
    const allItems = generateItems(Math.min(items, maxItems))
    const itemToRemix = allItems.find(item => item.id.toString() === _id)
    
    if (itemToRemix) {
      // Use a placeholder URL for remix - will be replaced with actual media URL
      const mediaUrl = `#` // Placeholder - should use actual media URL
      handleRemixMedia(mediaUrl)
      addNotification('Remix Started', 'Preparing remix interface...', 'info')
    }
  }

  const handleSaveToDraft = () => {
    // Only allow saving to draft if we have uploaded media but haven't generated yet
    if (uploadedMedia && !isGenerating && !draftMedia) {
      setDraftMedia(uploadedMedia)
      addNotification('Saved to Drafts', 'Media saved as draft', 'success')
    }
  }

  const handleDownload = (id: string) => {
    addNotification('Download Started', 'Preparing download...', 'info')
    // In real app, this would trigger actual download
    setTimeout(() => {
      addNotification('Download Complete', 'Media downloaded successfully', 'success')
    }, 1000)
  }

  const handleDelete = async (id: string) => {
    try {
    if (!isAuthenticated) {
        addNotification('Login Required', 'Please sign in to delete media', 'warning')
      navigate('/auth')
      return
    }

      const authToken = localStorage.getItem('auth_token') || authService.getToken() || '';
      if (!authToken) {
        addNotification('Authentication Error', 'Please sign in again', 'error')
        return
      }

      await deleteAsset(id, { token: authToken })
      addNotification('Media Deleted', 'Item removed from collection and cloud storage', 'info')
    } catch (error) {
      console.error('Delete error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete media'
      addNotification('Delete Failed', errorMessage, 'error')
    }
  }

  const handleGenerate = async () => {
    const prompt = customPrompt || typewriterText || 'AI generated content'
    // Delegate to handleGenerateWithPrompt to avoid code duplication
    await handleGenerateWithPrompt(prompt, undefined, { source: 'custom' })
  }



  // Enhanced notification system with system monitoring
  const [notifications, setNotifications] = useState<Array<{
    id: number
    title: string
    message: string
    type: 'success' | 'info' | 'warning' | 'error' | 'processing' | 'complete' | 'system'
    timestamp: string
    mediaUrl?: string
    mediaType?: 'image' | 'video'
    persistent?: boolean
  }>>([])

  const addNotification = (
    title: string,
    message?: string,
    type: 'success' | 'info' | 'warning' | 'error' | 'processing' | 'complete' | 'system' = 'info',
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    persistent?: boolean
  ) => {
    // Home screen policy: only show generation-related types
    const allowedTypes: Array<typeof type> = ['processing', 'error', 'complete']
    if (!allowedTypes.includes(type)) {
      // Suppress all other notifications on home
      return
    }

    const notification = {
      id: Date.now(),
      title,
      message: message || '',
      type,
      timestamp: new Date().toISOString(),
      mediaUrl,
      mediaType,
      persistent
    }

    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep only 5 notifications

    // Auto-remove after appropriate time unless persistent
    if (!persistent && type !== 'error') {
      const autoRemoveTime = 5000 // 5 seconds for all notifications
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, autoRemoveTime)
    }

    // Also log to console for debugging
    console.log(`${type.toUpperCase()}: ${title} - ${message}`)
  }

  // System monitoring notifications disabled on home
  useEffect(() => {
    // intentionally disabled per policy
  }, [])

  // Service health notifications disabled on home
  useEffect(() => {
    // intentionally disabled per policy
  }, [])

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }



  // Remix functionality
  const handleRemixMedia = (mediaUrl: string) => {
    setRemixedMedia(mediaUrl)
    setRemixPrompt('')
    setIsRemixing(true)
    setSidebarMode('remix')
    setActiveTab('prompt') // Default to prompt tab for remix
  }

  const handleRemixGenerate = async () => {
    if (!remixPrompt.trim()) {
      addNotification('Remix prompt required', 'Please enter a remix prompt', 'warning')
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save current remix state before redirecting to auth
      const generationState = {
        prompt: remixPrompt,
        styleName: selectedStyle,
        uploadedMedia: null, // No regular upload in remix mode
        uploadedFile: null,
        sidebarMode,
        remixedMedia,
        remixPrompt,
        selectedVariation,
        timestamp: Date.now()
      }
      localStorage.setItem('pendingGeneration', JSON.stringify(generationState))
      
      addNotification('Login Required', 'Please sign in to remix content', 'warning')
      navigate('/auth')
      return
    }

    // Check content moderation before remix generation
    try {
      const moderationResult = await contentModerationService.checkPrompt(remixPrompt)
      if (!moderationResult.isAppropriate) {
        addNotification('Content blocked', `${moderationResult.reason} - Please revise your remix prompt`, 'warning')
        return
      }
    } catch (error) {
      console.error('Content moderation check failed:', error)
      // Continue with generation if moderation fails
    }

    setIsGenerating(true)

    // Show processing notification
    addNotification('Processing Your Media', 'Creating remix...', 'processing')

    try {
      // Determine content type based on remixed media
      let type: 'photo' | 'video' = 'photo'
      
      if (remixedMedia) {
        // Check if user uploaded a video
        const isVideo = remixedMedia.startsWith('data:video/')
        if (isVideo) {
          type = 'video'
        }
      }
      
      // Note: No manual model selection - let server choose based on imageUrl presence

      // Check token availability for remix
      const tokenCheck = await tokenService.canGenerate(userId, userTier, type, 'high')
      
      if (!tokenCheck.canGenerate) {
        if (tokenCheck.reason?.includes('Daily limit')) {
          addNotification('Daily limit reached', `${tokenCheck.remainingTokens || 0} tokens remaining`, 'warning')
        } else if (tokenCheck.reason?.includes('Rate limited')) {
          addNotification('Too many requests', 'Please wait 30 seconds between generations', 'warning')
        } else if (tokenCheck.reason?.includes('Service temporarily unavailable')) {
          addNotification('Service unavailable', 'High demand - please try again later', 'error')
        } else {
          addNotification('Remix blocked', tokenCheck.reason || 'Unable to remix', 'error')
        }
        setIsGenerating(false)
        return
      }

      const request: GenerationRequest = {
        prompt: remixPrompt,
        type,
        quality: 'high', // Always HD quality
        style: selectedStyle,
        userId: userId,
        userTier: userTier,
        // Note: modelId removed - let server choose model based on imageUrl presence
        imageUrl: remixedMedia ? remixedMedia : undefined, // Pass any remixed media URL for I2I
        videoUrl: remixedMedia?.startsWith('data:video/') ? remixedMedia : undefined,
        samples: selectedVariation // Number of variations to generate
      }

      const result = await aiGenerationService.generateContent(request)
      
      if (result.success && result.result) {
        // Generate a media URL for the notification and user profile
        const mediaUrl = result.result.url || remixedMedia || uploadedMedia || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QbGFjZWhvbGRlciBJbWFnZTwvdGV4dD4KPC9zdmc+'
        const aspectRatio = 4/3 // Default aspect ratio
        const width = 800
        const height = Math.round(width / aspectRatio)
        
        // Save remix to user media profile
        await userMediaService.saveRemix(
          userId,
          'original-media-id', // In real app, this would be the actual original media ID
          mediaUrl,
          remixPrompt,
          aspectRatio,
          width,
          height,
          2, // tokens used
          activeTab === 'aiasabrush' ? selectedStyle : undefined
        )
        
        addNotification('Your Media is Ready', 'Remix generated successfully', 'complete', mediaUrl, 'image')
        
        // Reset filters to show the new item immediately
        setCreatorFilter(null)
        setCurrentFilter('all')
        
        // Deduct tokens after successful remix
        await tokenService.generateContent(userId, userTier, type, 'high', remixPrompt, '127.0.0.1', 'browser-device')
        console.log('Generated remix result and saved to profile:', result.result)
      } else {
        if (result.error?.includes('timeout')) {
          addNotification('Remix timeout', 'Request took too long - please try again', 'error')
        } else if (result.error?.includes('quota')) {
          addNotification('Service limit reached', 'AI service quota exceeded', 'error')
        } else if (result.error?.includes('inappropriate')) {
          addNotification('Content policy violation', 'Please revise your remix prompt', 'warning')
        } else {
          addNotification('Remix failed', result.error || 'Please try again', 'error')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Remix generation failed'
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        addNotification('Connection error', 'Check your internet connection', 'error')
      } else if (errorMessage.includes('unauthorized')) {
        addNotification('Authentication error', 'Please sign in again', 'error')
      } else {
        addNotification('Remix error', errorMessage, 'error')
      }
    } finally {
      setIsGenerating(false)
    }
  }



  // Interface for content items
  interface ContentItem {
    id: number
    label: string
    icon: any // Simplified for Lucide icons
    gradient: string
    aspectRatio: number
    media?: any // Store full media object for actions
  }

  // State for public media feed
  const [publicMedia, setPublicMedia] = useState<any[]>([])
  
  // Load public media feed
  useEffect(() => {
    const loadPublicMedia = async () => {
      try {
        // Get all public media from all users
        const allUsers = await userMediaService.getAllUsers()
        const publicMediaItems = []
        
        for (const userId of allUsers) {
          const userMedia = await userMediaService.getUserMedia(userId)
          // Filter only public media
          const publicUserMedia = userMedia.filter(media => media.isPublic)
          publicMediaItems.push(...publicUserMedia)
        }
        
        // Sort by timestamp (newest first) and limit
        const sortedMedia = publicMediaItems
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50)
        
        setPublicMedia(sortedMedia)
      } catch (error) {
        console.error('Failed to load public media:', error)
        setPublicMedia([])
      }
    }
    
    loadPublicMedia()
  }, [])

  // Function to refresh public media feed (after new generation)
  const refreshPublicFeed = async () => {
    try {
      const allUsers = await userMediaService.getAllUsers()
      const publicMediaItems = []
      
      for (const userId of allUsers) {
        const userMedia = await userMediaService.getUserMedia(userId)
        const publicUserMedia = userMedia.filter(media => media.isPublic)
        publicMediaItems.push(...publicUserMedia)
      }
      
      const sortedMedia = publicMediaItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50)
      
      setPublicMedia(sortedMedia)
    } catch (error) {
      console.error('Failed to refresh public media:', error)
    }
  }
  
  // Convert UserMedia to ContentItem format for display
  const generateItems = (count: number): ContentItem[] => {
    let filteredMedia = publicMedia

    // Apply creator filter
    if (creatorFilter) {
      filteredMedia = publicMedia.filter(media => media.userId === creatorFilter)
    }

    // Apply content type filter
    if (currentFilter !== 'all') {
      filteredMedia = filteredMedia.filter(media => {
        if (currentFilter === 'images') return media.type === 'photo'
        if (currentFilter === 'videos') return media.type === 'video'
        return true
      })
    }

    return filteredMedia.slice(0, count).map(media => ({
      id: parseInt(media.id.replace(/\D/g, '')) || Date.now(), // Extract number from ID
      label: media.prompt.substring(0, 50) + (media.prompt.length > 50 ? '...' : ''),
      icon: Image, // Default icon
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Default gradient
      aspectRatio: media.aspectRatio || 1,
      media: media // Store full media object for actions
    }))
  }

  // Calculate max items for real content
  const maxItems = 50

  const [hasReachedLimit, setHasReachedLimit] = useState(false)
  const isContentLimited = !isAuthenticated && hasReachedLimit
  
  // Filter and notification states
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<'all' | 'images' | 'videos'>('all')
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null) // Filter by specific creator
  const [notificationCount, setNotificationCount] = useState(0)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterOpen && !(event.target as Element).closest('.filter-dropdown')) {
        setFilterOpen(false)
      }
      if (userDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setUserDropdownOpen(false)
      }
      if (notificationDropdownOpen && !(event.target as Element).closest('.notification-dropdown')) {
        setNotificationDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen, userDropdownOpen, notificationDropdownOpen])

  // Scroll handler
  const handleScroll = () => {
    if (!contentRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current
    
    // Check if scrolled to bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
    if (!isAuthenticated && items >= maxItems) {
        setHasReachedLimit(true)
      } else if (items < 100) { // Limit to 100 items total
        setItems(prev => Math.min(prev + 10, 100))
      }
    }

    // Gate after ~6 rows for guests
    if (!isAuthenticated) {
      const approxRowHeight = 280
      const threshold = 6 * approxRowHeight
      if (scrollTop > threshold) {
        setGateOpen(true)
        contentRef.current.scrollTo({ top: threshold - 20 })
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-black relative">
      {/* Top Right Navigation Buttons */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {/* Gallery Button - Moved before filter */}
              <button
                onClick={() => navigate('/gallery')}
          className="flex items-center justify-center w-10 h-10 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
                title="Gallery"
              >
          <Image size={22} />
              </button>

        {/* Filter Dropdown - Only for logged-in users */}
        {isAuthenticated && (
          <div className="relative filter-dropdown">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center justify-center w-10 h-10 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
              title="Filter content"
            >
              <Filter size={18} />
            </button>
            {filterOpen && (
              <div 
                className="absolute top-12 right-0 rounded-2xl shadow-2xl overflow-hidden min-w-[120px] backdrop-blur-sm"
                style={{ backgroundColor: '#333333' }}
              >
                <button
                  onClick={() => { setCurrentFilter('images'); setFilterOpen(false) }}
                  className={`w-full p-3 text-sm transition-colors flex items-center justify-center gap-2 hover:bg-white/10 hover:rounded-full m-1 ${
                    currentFilter === 'images' ? 'bg-white/20 text-white rounded-full' : 'text-white/80'
                  }`}
                >
                  <Image size={16} />
                  <span>Images</span>
                </button>
                <button
                  onClick={() => { setCurrentFilter('videos'); setFilterOpen(false) }}
                  className={`w-full p-3 text-sm transition-colors flex items-center justify-center gap-2 hover:bg-white/10 hover:rounded-full m-1 ${
                    currentFilter === 'videos' ? 'bg-white/20 text-white rounded-full' : 'text-white/80'
                  }`}
                >
                  <Video size={16} />
                  <span>Videos</span>
                </button>
          </div>
            )}
          </div>
        )}
        
        {/* Notification Bell - Only for logged-in users */}
            {isAuthenticated && (
          <div className="relative notification-dropdown">
              <button
              onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              className="relative flex items-center justify-center w-10 h-10 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
              title="Notifications"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
              </button>
            {notificationDropdownOpen && (
              <div 
                className="absolute top-12 right-0 rounded-2xl shadow-2xl overflow-hidden w-80 backdrop-blur-sm"
                style={{ backgroundColor: '#333333' }}
              >
                <div className="p-4">
                  {notificationCount === 0 ? (
                    <div className="text-center py-8">
                      <Bell size={48} className="mx-auto text-white/20 mb-4" />
                      <p className="text-white/60 text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <p className="text-white text-sm">Sample notification</p>
                        <p className="text-white/60 text-xs mt-1">Just now</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* User Avatar Dropdown - Only for authenticated users */}
        {isAuthenticated ? (
          <div className="relative user-dropdown">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
              title="User menu"
            >
              <span className="text-white text-sm font-medium">
                U
              </span>
            </button>
            {userDropdownOpen && (
              <div 
                className="absolute top-12 right-0 rounded-2xl shadow-2xl overflow-hidden min-w-[140px] backdrop-blur-sm"
                style={{ backgroundColor: '#333333' }}
              >
                <button
                  onClick={() => { navigate('/profile'); setUserDropdownOpen(false) }}
                  className="w-full px-4 py-3 text-sm text-left transition-colors flex items-center gap-2 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  onClick={() => { 
                    authService.logout()
                    setIsAuthenticated(false)
                    setUserDropdownOpen(false)
                    navigate('/')
                  }}
                  className="w-full px-4 py-3 text-sm text-left transition-colors flex items-center gap-2 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={16} />
                  Logout
            </button>
          </div>
            )}
        </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 text-black bg-white hover:bg-gray-200 transition-colors rounded-full"
          >
            Login
          </button>
        )}
      </div>
      
      {/* Notification System */}
      {notifications.length > 0 && (
        <div className="fixed top-16 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`w-80 bg-gray-900 rounded-xl shadow-2xl transition-all duration-300 overflow-hidden ${
                notification.type === 'complete' ? 'cursor-pointer hover:bg-gray-800' : ''
              }`}
              onClick={() => {
                if (notification.type === 'complete' && notification.mediaUrl) {
                  // Navigate to profile page with All Media tab
                  navigate('/profile', { state: { activeTab: 'all-media' } })
                  removeNotification(notification.id)
                }
              }}
            >
              <div className="flex items-center space-x-3 p-3">
                {/* Media Preview - Smaller */}
                {notification.mediaUrl && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    {notification.mediaType === 'video' ? (
                      <video
                        src={notification.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={notification.mediaUrl}
                        alt="Generated media"
                        className="w-full h-full object-cover"
                      />
                  )}
                </div>
                )}
                
                {/* Content - Simplified */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{notification.title}</p>
                  {notification.type === 'complete' && (
                    <p className="text-xs text-green-400">Click to view</p>
                  )}
                </div>
                
                {/* Close Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    removeNotification(notification.id)
                  }}
                  className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      

      {/* Redesigned Sidebar - 40% for better content ratio */}
      <div className="w-[40%] bg-black sticky top-0 h-screen flex flex-col">
        {/* Idle State - Upload Button */}
        {sidebarMode === 'idle' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <button 
                onClick={handleUploadClick}
                className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 mx-auto relative group animate-pulse-shadow"
                aria-label="Upload media"
              >
                <Plus size={28} className="text-white group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File input"
            />
          </div>
        )}

        {/* Active States - Upload & Remix */}
        {(sidebarMode === 'upload' || sidebarMode === 'remix') && (
          <div className="flex flex-col h-full">
            {/* Media Preview Header */}
            <div className="px-8 py-6 pb-10 pt-12 border-b border-white/10">
              {/* Media Preview */}
              <div className="relative">
                <div className="aspect-video rounded-lg overflow-hidden bg-white/5">
                  <img 
                    src={sidebarMode === 'upload' ? uploadedMedia || '' : remixedMedia || ''} 
                    alt={sidebarMode === 'upload' ? 'Uploaded media' : 'Media to remix'}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Close Button - Top Right Corner */}
                  <button 
                  onClick={resetSidebar}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label="Close and return to upload"
                >
                  <X size={16} className="text-white" />
                  </button>
                
                {sidebarMode === 'remix' && (
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                    <span className="text-white/80 text-xs font-medium">REMIX</span>
              </div>
            )}
          </div>
              </div>
              
            {/* Tab Navigation */}
            <div className="flex border-b border-white/10">
                    <button 
                onClick={() => setActiveTab('prompt')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'prompt' 
                    ? 'text-white bg-white/5' 
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
                aria-pressed={activeTab === 'prompt'}
              >
                Custom Prompt
                {activeTab === 'prompt' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
                    </button>
                    <button 
                onClick={() => setActiveTab('aiasabrush')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'aiasabrush' 
                    ? 'text-white bg-white/5' 
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
                aria-pressed={activeTab === 'aiasabrush'}
                >
                  #AiAsABrush
                {activeTab === 'aiasabrush' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
                    </button>
                </div>
                
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto relative">
                            {/* Custom Prompt Tab */}
              {activeTab === 'prompt' && (
                <div className="p-4 space-y-4">
                                    {/* Prompt Input Section */}
                  <div className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={sidebarMode === 'remix' ? remixPrompt : customPrompt}
                        onChange={(e) => sidebarMode === 'remix' ? setRemixPrompt(e.target.value) : setCustomPrompt(e.target.value)}
                        placeholder={typewriterText || "Transform this image into something amazing..."}
                        className="w-full h-24 p-3 pr-12 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 resize-none text-sm focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                        aria-label="Enter your prompt"
                        style={{
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }}
                      />
                      {/* Character Counter */}
                      <div className="absolute bottom-2 right-2 text-white/40 text-xs">
                        {(sidebarMode === 'remix' ? remixPrompt : customPrompt).length}/500
                      </div>
                    </div>
                  </div>

                  {/* Variations Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <label className="text-white/90 text-xs font-medium">
                          Variations
                        </label>
                </div>
                      <div className="flex space-x-1">
                        {[1, 2].map((num) => (
                          <button 
                            key={num}
                            onClick={() => setSelectedVariation(num)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                              selectedVariation === num
                                ? 'bg-white text-black shadow-md scale-105'
                                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white border border-white/20 hover:scale-105'
                            }`}
                            aria-pressed={selectedVariation === num}
                            aria-label={`Generate ${num} variation${num > 1 ? 's' : ''}`}
                          >
                            {num}
                          </button>
                  ))}
                </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Right after variations */}
                  <div className="flex justify-end space-x-2 pt-2">
                    {/* Save to Draft Button - Only show when we have uploaded media but haven't generated */}
                    {uploadedMedia && !isGenerating && !draftMedia && (
                    <button 
                        onClick={handleSaveToDraft}
                        className="w-12 h-12 bg-white/10 text-white rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center border border-white/20 group"
                        aria-label="Save to Draft"
                        title="Save to Draft"
                      >
                        <FileText size={20} />
                    </button>
                    )}
                    
                    <button 
                      onClick={sidebarMode === 'remix' ? handleRemixGenerate : handleGenerate}
                      disabled={isGenerating || (!customPrompt.trim() && !remixPrompt.trim())}
                      className="w-12 h-12 bg-white text-black rounded-full hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 group"
                      aria-label={`Create ${sidebarMode === 'remix' ? 'remix' : 'edit'}`}
                      title={`Create ${sidebarMode === 'remix' ? 'Remix' : 'Edit'}`}
                    >
                      {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      ) : (
                        <ArrowUp size={20} />
                      )}
                    </button>
                </div>
          </div>
        )}

              {/* #AiAsABrush Tab */}
              {activeTab === 'aiasabrush' && (
                <div className="p-3 space-y-3">
                                    <div className="space-y-3">
                    <div className="text-center space-y-2">
                      <p className="text-white/60 text-sm">
                        Instantly transform with our signature #AiAsABrush presets
                      </p>
              </div>
              
                                        <div className="grid grid-cols-2 gap-3">
                      {aiAsBrushStyles.map((style) => (
                  <button 
                          key={style.id}
                          onClick={() => handleStyleSelect(style.id)}
                  disabled={isGenerating}
                          className={`group relative p-0 rounded-xl border transition-all text-left hover:scale-105 overflow-hidden ${
                            selectedStyle === style.name
                              ? 'border-white/60 ring-2 ring-white/30'
                              : 'border-white/20 hover:border-white/40'
                          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                          aria-label={`Apply ${style.name} style - ${style.description}`}
                        >
                          {/* Visual Preview Background */}
                          <div 
                            className="absolute inset-0 opacity-20"
                            style={{ background: style.gradient }}
                          />
                          
                          {/* Content */}
                          <div className="relative p-3 space-y-2">
                            {/* Header */}
                                                        <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <style.icon size={32} className="text-white" />
              </div>
                                                            <div className="flex-1 min-w-0">
                                <div className="text-white font-semibold text-base truncate">
                                  {style.name}
            </div>
                </div>
              </div>

                            
                            
                            {/* Selection Indicator */}
                            {selectedStyle === style.name && (
                              <div className="absolute top-3 right-3">
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                  <Check size={14} className="text-black" />
                      </div>
                    </div>
            )}

                            
                      </div>
                        </button>
                  ))}
                </div>
                    
                                    {selectedStyle && isGenerating && (
                    <div className="text-center pt-4">
                      <div className="flex items-center justify-center space-x-2 text-white/80">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span className="text-sm">Generating with {selectedStyle}...</span>
                </div>
              </div>
            )}
                      </div>
                    </div>
              )}
                </div>
              </div>
            )}
          </div>
        
      {/* Content Area - 60% for better balance */}
      <div className="w-[60%] bg-black">
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className={`p-6 pt-20 ${isAuthenticated ? 'h-screen overflow-y-auto' : isContentLimited ? 'h-screen overflow-hidden' : 'h-screen overflow-y-auto'}`}
        >
          {/* Creator Filter Banner */}
          {creatorFilter && (
            <div className="mb-4 flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg p-3">
              <span className="text-white/80 text-sm">
                Showing content by User {creatorFilter.substring(0, 8)}
              </span>
              <button
                onClick={() => {
                  setCreatorFilter(null)
                  addNotification('Filter cleared', 'All content is now visible', 'info')
                }}
                className="text-white/60 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                Clear filter ✕
              </button>
            </div>
          )}

          {/* Masonry-style Grid - Minimal gaps for human eye */}
          <div className="columns-2 gap-1 mx-auto" style={{ maxWidth: '1200px' }}>
            {generateItems(Math.min(items, maxItems)).map((item) => {
              const IconComponent = item.icon
              return (
                <div key={item.id} className="break-inside-avoid mb-1">
                  <MediaCard
                    id={item.media ? item.media.id : item.id.toString()}
                    type={item.media ? item.media.type : "photo"}
                    title={item.label}
                    prompt={item.media ? item.media.prompt : "AI generated content"}
                    gradient={item.gradient}
                    icon={IconComponent}
                    creatorName={item.media ? `User ${item.media.userId.substring(0, 8)}` : `Creator ${item.id}`}
                    isLoggedIn={isAuthenticated}
                    onLike={handleLike}
                    onRemix={item.media?.allowRemix ? handleRemix : () => {}} // Only show remix if allowed
                    onDownload={handleDownload}
                    onDelete={undefined} // Don't allow deletion of other users' content
                    onShowAuth={() => navigate('/auth')}
                    onFilterAiAsBrush={() => {
                      addNotification('Filtered to show #AiAsABrush content', 'info')
                    }}
                    onFilterCreator={(creatorName) => {
                      // Extract userId from creatorName (format: "User 12345678")
                      const userId = item.media?.userId
                      if (userId) {
                        setCreatorFilter(userId)
                        addNotification(`Showing content by ${creatorName}`, 'success')
                      }
                    }}
                    onShowMedia={(id, _title, prompt) => {
                      const list = generateItems(Math.min(items, maxItems)).map((g) => ({
                        id: g.media ? g.media.id : g.id.toString(),
                        url: g.media ? g.media.url : `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjEyMDAiIHZpZXdCb3g9IjAgMCA4MDAgMTIwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSIxMjAwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iNjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QbGFjZWhvbGRlciBJbWFnZTwvdGV4dD4KPC9zdmc+`,
                        prompt: g.media ? g.media.prompt : (prompt || 'AI generated content'),
                        aspectRatio: g.aspectRatio
                      }))
                      const index = list.findIndex(m => m.id === id)
                      setViewerMedia(list)
                      setViewerIndex(Math.max(0, index))
                      setViewerOpen(true)
                    }}
                    isLiked={likedItems.has(item.media ? item.media.id : item.id.toString())}
                    likesCount={item.media ? item.media.likes : (item.id * 3 + 5)}
                    remixesCount={item.media ? item.media.remixCount : (item.id * 2 + 1)}
                    isAiAsBrush={item.media ? item.media.style?.includes('Brush') : (item.id % 2 === 0)}
                                        aspectRatio={item.aspectRatio}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Full-screen media viewer */}
      <FullScreenMediaViewer
        isOpen={viewerOpen}
        media={viewerMedia.map((m) => ({
          id: m.id,
          userId: userId,
          type: 'photo',
          url: m.url,
          prompt: m.prompt,
          style: selectedStyle,
          aspectRatio: m.aspectRatio,
          width: 800,
          height: Math.round(800 / (m.aspectRatio || 1)),
          timestamp: new Date().toISOString(),
          tokensUsed: 0,
          likes: 0,
          remixCount: 0,
          isPublic: userSettings.shareToFeed,
          allowRemix: userSettings.allowRemix,
          tags: [],
          metadata: { quality: 'high', generationTime: 0, modelVersion: 'v2.0' }
        }))}
        startIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
        onLike={(m) => handleLike(m.id)}
        onRemix={(m) => { setViewerOpen(false); navigate('/', { state: { remixUrl: m.url, remixPrompt: m.prompt || '', source: 'home-viewer' } }) }}
        onShowAuth={() => navigate('/auth')}
      />
      <SlideSignupGate isOpen={gateOpen} onClose={() => setGateOpen(false)} onSignup={() => navigate('/auth')} />
                      </div>
  )
}

export default WebsiteLayout 

