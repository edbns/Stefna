import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '../utils/motionShim';
import { Shield } from 'lucide-react';
import { authenticatedFetch } from '../utils/apiClient';

interface MediaUploadAgreementProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onAgreementAccepted?: () => void; // New callback to notify parent
}

export const MediaUploadAgreement: React.FC<MediaUploadAgreementProps> = ({
  isOpen,
  onClose,
  onAccept,
  onAgreementAccepted
}) => {
  const [legalRightsChecked, setLegalRightsChecked] = useState(false);
  const [contentPolicyChecked, setContentPolicyChecked] = useState(false);
  const [hasUserAgreed, setHasUserAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has already agreed (from database) - only once on mount
  useEffect(() => {
    const checkUserAgreement = async () => {
      try {
        const response = await authenticatedFetch('/.netlify/functions/user-settings', {
          method: 'GET'
        });
        
        if (response.ok) {
          const settings = await response.json();
          setHasUserAgreed(settings.mediaUploadAgreed || false);
        }
      } catch (error) {
        console.error('Failed to check user agreement status:', error);
        // Fallback to showing agreement on error
        setHasUserAgreed(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Only check once when component mounts, not every time it opens
    checkUserAgreement();
  }, []); // Empty dependency array - only run once

  // Reset checkboxes when modal opens (only if user hasn't agreed before)
  useEffect(() => {
    if (isOpen && !hasUserAgreed && !isLoading) {
      setLegalRightsChecked(false);
      setContentPolicyChecked(false);
    }
  }, [isOpen, hasUserAgreed, isLoading]);

  // If user has already agreed or still loading, don't show the modal
  if (hasUserAgreed || isLoading) {
    return null;
  }

  if (!isOpen) return null;

  const handleAccept = async () => {
    try {
      // Save user agreement preference to database
      const response = await authenticatedFetch('/.netlify/functions/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareToFeed: true, // Keep existing setting
          mediaUploadAgreed: true
        })
      });

      if (response.ok) {
        setHasUserAgreed(true);
        // Notify parent component that agreement was accepted
        if (onAgreementAccepted) {
          onAgreementAccepted();
        }
        onAccept();
        onClose();
      } else {
        console.error('Failed to save agreement preference');
        // Still proceed with upload even if saving fails
        onAccept();
        onClose();
      }
    } catch (error) {
      console.error('Error saving agreement preference:', error);
      // Still proceed with upload even if saving fails
      onAccept();
      onClose();
    }
  };

  const handleClose = () => {
    // Reset checkboxes when closing
    setLegalRightsChecked(false);
    setContentPolicyChecked(false);
    onClose();
  };

  const isAcceptDisabled = !legalRightsChecked || !contentPolicyChecked;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative max-w-lg w-full p-6 rounded-2xl shadow-2xl shadow-black/20 border border-white/20"
            style={{ backgroundColor: '#333333' }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <Shield size={32} className="text-white" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Media Upload Agreement</h1>
              <p className="text-white/60 text-sm">Please confirm the following before uploading:</p>
            </div>

            {/* Agreement Points */}
            <div className="space-y-4 mb-6">
              {/* Legal Rights */}
              <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <input
                  type="checkbox"
                  id="legal-rights"
                  checked={legalRightsChecked}
                  onChange={(e) => setLegalRightsChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-white bg-white/10 border-white/30 rounded focus:ring-white/50 focus:ring-2"
                />
                <div>
                  <label htmlFor="legal-rights" className="text-white font-medium text-sm mb-1 cursor-pointer">
                    I confirm that I have the legal rights to upload this media
                  </label>
                  <p className="text-white/70 text-xs">
                    I will not upload images of people under 18 or others without their consent, and I hold full rights to the content I upload.
                  </p>
                </div>
              </div>

              {/* Content Policy */}
              <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <input
                  type="checkbox"
                  id="content-policy"
                  checked={contentPolicyChecked}
                  onChange={(e) => setContentPolicyChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-white bg-white/10 border-white/30 rounded focus:ring-white/50 focus:ring-2"
                />
                <div>
                  <label htmlFor="content-policy" className="text-white font-medium text-sm mb-1 cursor-pointer">
                    I agree to follow Stefna's content policy
                  </label>
                  <p className="text-white/70 text-xs">
                    I will not upload media that contains violence, explicit themes, or violates any community guidelines. I understand misuse may result in a ban or loss of access without refund.
                  </p>
                </div>
              </div>

              {/* Creative Tool Notice */}
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/70 text-sm">
                  This is a creative tool — please use it responsibly.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={isAcceptDisabled}
                className={`px-6 py-2.5 rounded-lg transition-colors font-medium ${
                  isAcceptDisabled
                    ? 'text-white/40 bg-white/20 cursor-not-allowed'
                    : 'text-black bg-white/90 hover:bg-white backdrop-blur-md'
                }`}
              >
                Accept
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MediaUploadAgreement;
