import React, { useEffect, useState } from 'react';
import { X, Upload, User, Share2, Users } from 'lucide-react';
import { uploadAvatarToCloudinary } from '../lib/cloudinaryUpload';
import { completeOnboarding } from '../services/profile';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  token: string;
  onComplete?: (profile: any) => void;
}

type Step = 1 | 2 | 3;

export default function ProfileSetupModal({ 
  isOpen, 
  onClose, 
  userId, 
  token, 
  onComplete 
}: ProfileSetupModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [username, setUsername] = useState('');
  const [shareToFeed, setShareToFeed] = useState(false);
  const [allowRemix, setAllowRemix] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAvatarUrl('');
      setAvatarFile(null);
      setUsername('');
      setShareToFeed(false);
      setAllowRemix(false);
      setError('');
      setUsernameError('');
    }
  }, [isOpen]);

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image must be smaller than 10MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const url = await uploadAvatarToCloudinary(file, userId);
      setAvatarUrl(url);
      setAvatarFile(file);
      
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const validateUsername = (value: string) => {
    if (!value) {
      setUsernameError('Username is required');
      return false;
    }
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (value.length > 30) {
      setUsernameError('Username must be 30 characters or less');
      return false;
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain lowercase letters, numbers, and underscores');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleUsernameChange = (value: string) => {
    const lowercaseValue = value.toLowerCase();
    setUsername(lowercaseValue);
    validateUsername(lowercaseValue);
  };

  const handleNext = () => {
    if (step === 2 && !validateUsername(username)) {
      return;
    }
    setStep((prev) => Math.min(3, prev + 1) as Step);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const handleSave = async () => {
    if (!validateUsername(username)) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Upload avatar if we have a file
      let finalAvatarUrl = '';
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatarToCloudinary(avatarFile, userId);
      }

      // Complete onboarding using the profile service
      const profile = await completeOnboarding({
        username,
        avatar_url: finalAvatarUrl,
        share_to_feed: shareToFeed,
        allow_remix: shareToFeed ? allowRemix : false
      });
      
      if (onComplete) {
        onComplete(profile);
      }
      
      onClose();
    } catch (err: any) {
      console.error('Profile save error:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Complete Your Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  stepNum === step
                    ? 'bg-black text-white'
                    : stepNum < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepNum < step ? '✓' : stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`w-8 h-0.5 mx-2 transition-colors ${
                    stepNum < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Avatar */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Add a Profile Photo</h3>
              <p className="text-sm text-gray-600 mb-6">
                Help others recognize you in the community
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              )}

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <Upload size={16} />
                  <span className="text-sm font-medium">
                    {uploading ? 'Uploading...' : avatarUrl ? 'Change Photo' : 'Upload Photo'}
                  </span>
                </div>
              </label>

              <p className="text-xs text-gray-500 text-center">
                JPG, PNG or GIF. Max 10MB.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Username */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Choose a Username</h3>
              <p className="text-sm text-gray-600 mb-6">
                This is how others will see you on Stefna
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="yourname"
                className={`w-full px-4 py-3 border rounded-lg text-center text-lg font-medium transition-colors ${
                  usernameError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-black focus:ring-black'
                } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                maxLength={30}
              />
              
              {usernameError && (
                <p className="text-sm text-red-600 text-center">{usernameError}</p>
              )}
              
              <p className="text-xs text-gray-500 text-center">
                3-30 characters. Lowercase letters, numbers, and underscores only.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Sharing Preferences */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <Share2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Sharing Preferences</h3>
              <p className="text-sm text-gray-600 mb-6">
                Control how your creations appear to others
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={shareToFeed}
                  onChange={(e) => {
                    setShareToFeed(e.target.checked);
                    if (!e.target.checked) {
                      setAllowRemix(false);
                    }
                  }}
                  className="mt-1 w-4 h-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2"
                />
                <div>
                  <div className="font-medium text-gray-900">Share to Public Feed</div>
                  <div className="text-sm text-gray-600">
                    Your creations will appear in the community gallery
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                shareToFeed ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
              }`}>
                <input
                  type="checkbox"
                  checked={shareToFeed ? allowRemix : false}
                  disabled={!shareToFeed}
                  onChange={(e) => setAllowRemix(e.target.checked)}
                  className="mt-1 w-4 h-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2 disabled:opacity-50"
                />
                <div>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    Allow Remixing
                    <Users size={16} className="text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Others can use your public media as inspiration for their own creations
                  </div>
                </div>
              </label>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                💡 You can always change these settings later in your profile
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip for now
          </button>

          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={step === 2 && (!!usernameError || !username)}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || !!usernameError || !username}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
