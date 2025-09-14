// Mobile Browser Floating Footer Component
// Converted from mobile app floating footer
import React from 'react';
import { Plus, Camera, User } from 'lucide-react';

interface MobileFloatingFooterProps {
  onUploadPress: () => void;
  onCameraPress: () => void;
  onProfilePress: () => void;
  className?: string;
}

export default function MobileFloatingFooter({
  onUploadPress,
  onCameraPress,
  onProfilePress,
  className = ''
}: MobileFloatingFooterProps) {
  return (
    <div className={`mobile-floating-footer ${className}`}>
      <button 
        className="footer-button"
        onClick={onUploadPress}
        title="Upload Photo"
      >
        <Plus size={24} />
      </button>
      
      <button 
        className="footer-button"
        onClick={onCameraPress}
        title="Take Photo"
      >
        <Camera size={24} />
      </button>
      
      <button 
        className="footer-button"
        onClick={onProfilePress}
        title="Profile"
      >
        <User size={24} />
      </button>

      <style jsx>{`
        .mobile-floating-footer {
          position: fixed;
          bottom: 20px;
          left: 30px;
          right: 30px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 12px 20px;
          background-color: #1a1a1a;
          border-radius: 25px;
          border: 1px solid #333333;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1000;
        }
        
        .footer-button {
          width: 50px;
          height: 50px;
          border-radius: 25px;
          background-color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #000000;
        }
        
        .footer-button:hover {
          background-color: #f0f0f0;
          transform: scale(1.05);
        }
        
        .footer-button:active {
          transform: scale(0.95);
        }
        
        /* Mobile-specific adjustments */
        @media (max-width: 480px) {
          .mobile-floating-footer {
            left: 20px;
            right: 20px;
            padding: 10px 16px;
          }
          
          .footer-button {
            width: 45px;
            height: 45px;
            border-radius: 22.5px;
          }
        }
      `}</style>
    </div>
  );
}
