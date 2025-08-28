import React from 'react';
import { motion, AnimatePresence } from '../utils/motionShim';
import { AlertTriangle, Shield, FileText, CheckCircle } from 'lucide-react';

interface MediaUploadAgreementProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const MediaUploadAgreement: React.FC<MediaUploadAgreementProps> = ({
  isOpen,
  onClose,
  onAccept
}) => {
  if (!isOpen) return null;

  const handleAccept = () => {
    onAccept();
    onClose();
  };

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
                <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">
                    I confirm that I have the legal rights to upload this media
                  </p>
                  <p className="text-white/70 text-xs">
                    I will not upload images of people under 18 or others without their consent, and I hold full rights to the content I upload.
                  </p>
                </div>
              </div>

              {/* Content Policy */}
              <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <FileText size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">
                    I agree to follow Stefna's content policy
                  </p>
                  <p className="text-white/70 text-xs">
                    I will not upload media that contains violence, explicit themes, or violates any community guidelines. I understand misuse may result in a ban or loss of access without refund.
                  </p>
                </div>
              </div>

              {/* Creative Tool Notice */}
              <div className="flex items-start space-x-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertTriangle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">
                    This is a creative tool — please use it responsibly.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 text-black bg-white/90 hover:bg-white backdrop-blur-md rounded-lg transition-colors font-medium"
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
