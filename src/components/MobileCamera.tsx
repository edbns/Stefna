// Mobile Browser Camera Component
// Camera integration for mobile browsers using WebRTC
import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, RotateCcw, Upload } from 'lucide-react';

interface MobileCameraProps {
  onPhotoTaken: (file: File, dataUrl: string) => void;
  onClose: () => void;
  className?: string;
}

export default function MobileCamera({
  onPhotoTaken,
  onClose,
  className = ''
}: MobileCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Start camera stream
  const startCamera = async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  };

  // Switch camera (front/back)
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setIsCapturing(false);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and data URL
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        onPhotoTaken(file, dataUrl);
        stopCamera();
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.8);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onPhotoTaken(file, dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  return (
    <div className={`mobile-camera ${className}`}>
      <div className="camera-container">
        {/* Video Stream */}
        <div className="video-container">
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            playsInline
            muted
          />
          
          {/* Camera Controls Overlay */}
          <div className="camera-controls">
            <button 
              className="control-button close-button"
              onClick={onClose}
              title="Close Camera"
            >
              ✕
            </button>
            
            <button 
              className="control-button switch-button"
              onClick={switchCamera}
              title="Switch Camera"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={startCamera} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="bottom-controls">
          {/* Upload Button */}
          <label className="upload-button">
            <Upload size={24} />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>

          {/* Capture Button */}
          <button 
            className={`capture-button ${isCapturing ? 'capturing' : ''}`}
            onClick={capturePhoto}
            disabled={!isStreaming || isCapturing}
            title="Take Photo"
          >
            {isCapturing ? (
              <div className="capture-spinner" />
            ) : (
              <Camera size={24} />
            )}
          </button>

          {/* Placeholder for symmetry */}
          <div className="placeholder-button" />
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <style jsx>{`
        .mobile-camera {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #000000;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }
        
        .camera-container {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .video-container {
          flex: 1;
          position: relative;
          background-color: #000000;
        }
        
        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .camera-controls {
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 10;
        }
        
        .control-button {
          width: 44px;
          height: 44px;
          border-radius: 22px;
          background-color: rgba(0, 0, 0, 0.5);
          border: none;
          color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }
        
        .control-button:hover {
          background-color: rgba(0, 0, 0, 0.7);
        }
        
        .close-button {
          font-size: 18px;
          font-weight: bold;
        }
        
        .error-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: #ffffff;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          backdrop-filter: blur(10px);
        }
        
        .error-message p {
          margin: 0 0 16px 0;
          font-size: 16px;
        }
        
        .retry-button {
          background-color: #ffffff;
          color: #000000;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        
        .bottom-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background-color: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }
        
        .upload-button {
          width: 50px;
          height: 50px;
          border-radius: 25px;
          background-color: rgba(255, 255, 255, 0.2);
          border: none;
          color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .upload-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .capture-button {
          width: 70px;
          height: 70px;
          border-radius: 35px;
          background-color: #ffffff;
          border: 4px solid rgba(255, 255, 255, 0.3);
          color: #000000;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .capture-button:hover {
          transform: scale(1.05);
        }
        
        .capture-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .capture-button.capturing {
          background-color: #ff4444;
          color: #ffffff;
        }
        
        .capture-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 12px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .placeholder-button {
          width: 50px;
          height: 50px;
        }
        
        /* Mobile-specific adjustments */
        @media (max-width: 480px) {
          .camera-controls {
            padding: 0 16px;
          }
          
          .control-button {
            width: 40px;
            height: 40px;
            border-radius: 20px;
          }
          
          .bottom-controls {
            padding: 16px;
          }
          
          .upload-button {
            width: 45px;
            height: 45px;
            border-radius: 22.5px;
          }
          
          .capture-button {
            width: 65px;
            height: 65px;
            border-radius: 32.5px;
          }
          
          .placeholder-button {
            width: 45px;
            height: 45px;
          }
        }
      `}</style>
    </div>
  );
}
