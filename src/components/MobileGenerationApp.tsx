// Mobile Browser Generation App
// Main component that orchestrates the mobile generation experience
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMediaStore } from '../stores/mediaStore';
import { useGenerationStore } from '../stores/generationStore';
import MobileGallery from './MobileGallery';
import MobileGenerationModes, { GenerationMode } from './MobileGenerationModes';
import MobileFloatingFooter from './MobileFloatingFooter';
import MobileCamera from './MobileCamera';
import { UserMedia } from '../services/userMediaService';

type AppStep = 'gallery' | 'upload' | 'generate' | 'camera' | 'progress';

export default function MobileGenerationApp() {
  const { user, isAuthenticated } = useAuthStore();
  const { media, isLoading, loadUserMedia } = useMediaStore();
  const { 
    isGenerating, 
    presets, 
    loadPresets, 
    startGeneration 
  } = useGenerationStore();

  const [currentStep, setCurrentStep] = useState<AppStep>('gallery');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('presets');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  // Load user media and presets on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserMedia();
      loadPresets();
    }
  }, [isAuthenticated, user?.id, loadUserMedia, loadPresets]);

  // Handle file upload from gallery
  const handleUploadPress = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setSelectedImage(file);
        setPreviewUrl(url);
        setCurrentStep('generate');
      }
    };
    input.click();
  };

  // Handle camera button press
  const handleCameraPress = () => {
    setShowCamera(true);
  };

  // Handle profile button press
  const handleProfilePress = () => {
    // Navigate to profile or show profile modal
    console.log('Profile pressed');
  };

  // Handle photo taken from camera
  const handlePhotoTaken = (file: File, dataUrl: string) => {
    setSelectedImage(file);
    setPreviewUrl(dataUrl);
    setShowCamera(false);
    setCurrentStep('generate');
  };

  // Handle generation
  const handleGenerate = async (presetId?: string, mode?: GenerationMode) => {
    if (!selectedImage || !user?.id) {
      alert('No image selected or user not authenticated');
      return;
    }

    const finalMode = mode || generationMode;

    // Validation based on mode
    if ((finalMode === 'custom-prompt' || finalMode === 'edit-photo') && !customPrompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    try {
      // Start the generation process
      const result = await startGeneration({
        imageUri: previewUrl!,
        mode: finalMode,
        presetId: presetId || undefined,
        customPrompt: customPrompt.trim() || undefined,
      });

      if (result.success) {
        setCurrentStep('progress');
        
        // Poll for completion
        const pollForCompletion = async () => {
          try {
            const response = await fetch(`/.netlify/functions/get-generation-status?jobId=${result.jobId}`);
            const data = await response.json();
            
            if (data.status === 'completed') {
              // Reload media to show new generation
              loadUserMedia();
              setCurrentStep('gallery');
              setSelectedImage(null);
              setPreviewUrl(null);
              setCustomPrompt('');
            } else if (data.status === 'failed') {
              alert('Generation failed: ' + (data.error || 'Unknown error'));
              setCurrentStep('gallery');
            } else {
              // Still processing, poll again
              setTimeout(pollForCompletion, 2000);
            }
          } catch (error) {
            console.error('Error polling generation status:', error);
            setTimeout(pollForCompletion, 5000);
          }
        };
        
        setTimeout(pollForCompletion, 2000);
      } else {
        alert('Generation failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed. Please try again.');
    }
  };

  // Handle media click
  const handleMediaClick = (media: UserMedia) => {
    // Open media viewer or show full screen
    console.log('Media clicked:', media);
  };

  // Handle back navigation
  const handleBack = () => {
    switch (currentStep) {
      case 'generate':
        setCurrentStep('gallery');
        setSelectedImage(null);
        setPreviewUrl(null);
        setCustomPrompt('');
        break;
      case 'camera':
        setShowCamera(false);
        break;
      case 'progress':
        setCurrentStep('gallery');
        break;
      default:
        setCurrentStep('gallery');
    }
  };

  // Show camera component
  if (showCamera) {
    return (
      <MobileCamera
        onPhotoTaken={handlePhotoTaken}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  // Show loading state
  if (!isAuthenticated) {
    return (
      <div className="mobile-app">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please log in to use the mobile generation app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app">
      {/* Header */}
      <div className="app-header">
        <button 
          className="back-button"
          onClick={handleBack}
          style={{ display: currentStep === 'gallery' ? 'none' : 'block' }}
        >
          ← Back
        </button>
        <h1 className="app-title">Stefna</h1>
        <div className="header-spacer" />
      </div>

      {/* Main Content */}
      <div className="app-content">
        {currentStep === 'gallery' && (
          <MobileGallery
            media={media || []}
            isLoading={isLoading}
            onMediaClick={handleMediaClick}
          />
        )}

        {currentStep === 'generate' && selectedImage && (
          <div className="generate-screen">
            {/* Image Preview */}
            <div className="image-preview">
              <img 
                src={previewUrl!} 
                alt="Selected image"
                className="preview-image"
              />
            </div>

            {/* Generation Modes */}
            <MobileGenerationModes
              selectedMode={generationMode}
              onModeChange={setGenerationMode}
              onGenerate={handleGenerate}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
              isGenerating={isGenerating}
              availablePresets={presets}
            />
          </div>
        )}

        {currentStep === 'progress' && (
          <div className="progress-screen">
            <div className="progress-content">
              <div className="progress-spinner" />
              <h2>Generating Your Creation</h2>
              <p>This may take a few moments...</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Footer */}
      <MobileFloatingFooter
        onUploadPress={handleUploadPress}
        onCameraPress={handleCameraPress}
        onProfilePress={handleProfilePress}
      />

      <style jsx>{`
        .mobile-app {
          min-height: 100vh;
          background-color: #000000;
          color: #ffffff;
          display: flex;
          flex-direction: column;
        }
        
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background-color: #1a1a1a;
          border-bottom: 1px solid #333333;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .back-button {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 16px;
          cursor: pointer;
          padding: 8px;
        }
        
        .app-title {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
        }
        
        .header-spacer {
          width: 40px;
        }
        
        .app-content {
          flex: 1;
          overflow-y: auto;
        }
        
        .auth-required {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          text-align: center;
        }
        
        .auth-required h2 {
          margin-bottom: 16px;
          color: #ffffff;
        }
        
        .auth-required p {
          color: #cccccc;
        }
        
        .generate-screen {
          padding: 20px;
        }
        
        .image-preview {
          margin-bottom: 20px;
          border-radius: 12px;
          overflow: hidden;
          background-color: #1a1a1a;
        }
        
        .preview-image {
          width: 100%;
          aspect-ratio: 0.8;
          object-fit: contain;
        }
        
        .progress-screen {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }
        
        .progress-content {
          text-align: center;
        }
        
        .progress-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #333333;
          border-top-color: #ffffff;
          border-radius: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .progress-content h2 {
          margin-bottom: 8px;
          color: #ffffff;
        }
        
        .progress-content p {
          color: #cccccc;
        }
        
        /* Mobile-specific adjustments */
        @media (max-width: 480px) {
          .app-header {
            padding: 12px 16px;
          }
          
          .app-title {
            font-size: 18px;
          }
          
          .generate-screen {
            padding: 16px;
          }
          
          .progress-screen {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
