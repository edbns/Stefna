// src/examples/ProfileIntegrationExample.tsx
// Complete example showing how to use the profile and media services

import React, { useEffect, useState } from 'react';
import { 
  updateMyProfile, 
  getMyProfileDirect, 
  ensureAndUpdateProfileDirect,
  type Profile 
} from '../services/profile';
import { 
  getMyMediaWithProfile, 
  getPublicMediaWithProfiles, 
  toggleMediaLike,
  type MediaItem 
} from '../services/media';
import { supabaseClient as supabase } from '../lib/supabaseClient';

export default function ProfileIntegrationExample() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myMedia, setMyMedia] = useState<MediaItem[]>([]);
  const [publicFeed, setPublicFeed] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    initializeProfile();
    loadMediaFeeds();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('🔐 User signed in, checking profile...');
        await handleSignIn();
      } else if (event === 'SIGNED_OUT') {
        console.log('🔓 User signed out');
        setProfile(null);
        setMyMedia([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeProfile = async () => {
    try {
      const currentProfile = await getMyProfileDirect();
      setProfile(currentProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      // Ensure profile exists (creates if needed)
      await ensureAndUpdateProfileDirect({});
      
      // Load profile and media
      await initializeProfile();
      await loadMediaFeeds();
    } catch (error) {
      console.error('Error during sign-in setup:', error);
    }
  };

  const loadMediaFeeds = async () => {
    try {
      const [myMediaData, publicFeedData] = await Promise.all([
        getMyMediaWithProfile().catch(() => []),
        getPublicMediaWithProfiles(20).catch(() => [])
      ]);
      
      setMyMedia(myMediaData);
      setPublicFeed(publicFeedData);
    } catch (error) {
      console.error('Error loading media feeds:', error);
    }
  };

  const handleProfileUpdate = async (profileData: {
    username: string;
    avatarUrl: string | null;
    shareToFeed: boolean;
    allowRemix: boolean;
  }) => {
    try {
      // Method 1: Direct Supabase update
      const updatedProfile = await updateMyProfile(profileData);
      setProfile(updatedProfile);
      
      // Reload media to reflect changes
      await loadMediaFeeds();
      
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  };

  const handleLikeMedia = async (mediaId: string) => {
    try {
      const { liked, likeCount } = await toggleMediaLike(mediaId);
      
      // Update local state
      setPublicFeed(prev => prev.map(item => 
        item.id === mediaId 
          ? { ...item, likes: likeCount }
          : item
      ));
      
      console.log(`${liked ? '❤️' : '💔'} Media ${liked ? 'liked' : 'unliked'}`);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Profile Integration Example</h1>
      
      {/* Profile Section */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current Profile</h2>
        {profile ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              {profile.avatar_url && (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <p><strong>Username:</strong> {profile.username || 'Not set'}</p>
                <p><strong>Share to Feed:</strong> {profile.share_to_feed ? 'Yes' : 'No'}</p>
                <p><strong>Allow Remix:</strong> {profile.allow_remix ? 'Yes' : 'No'}</p>
                <p><strong>Onboarding:</strong> {profile.onboarding_completed ? 'Complete' : 'Pending'}</p>
              </div>
            </div>
          </div>
        ) : (
          <p>No profile found. Please sign in.</p>
        )}
      </div>

      {/* Profile Update Form */}
      {profile && (
        <ProfileUpdateForm 
          currentProfile={profile}
          onUpdate={handleProfileUpdate}
        />
      )}

      {/* My Media */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">My Media ({myMedia.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myMedia.map(item => (
            <MediaCard 
              key={item.id} 
              media={item} 
              showOwnerInfo={false}
              onLike={() => handleLikeMedia(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Public Feed */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Public Feed ({publicFeed.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicFeed.map(item => (
            <MediaCard 
              key={item.id} 
              media={item} 
              showOwnerInfo={true}
              onLike={() => handleLikeMedia(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Profile Update Form Component
function ProfileUpdateForm({ 
  currentProfile, 
  onUpdate 
}: { 
  currentProfile: Profile;
  onUpdate: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    username: currentProfile.username || '',
    avatarUrl: currentProfile.avatar_url || '',
    shareToFeed: currentProfile.share_to_feed,
    allowRemix: currentProfile.allow_remix
  });
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      await onUpdate(formData);
    } catch (error) {
      alert('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-yellow-50 p-4 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Update Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            className="w-full p-2 border rounded"
            placeholder="Enter username"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <input
            type="url"
            value={formData.avatarUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
            className="w-full p-2 border rounded"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.shareToFeed}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                shareToFeed: e.target.checked,
                allowRemix: e.target.checked ? prev.allowRemix : false
              }))}
              className="mr-2"
            />
            Share to Public Feed
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.allowRemix}
              disabled={!formData.shareToFeed}
              onChange={(e) => setFormData(prev => ({ ...prev, allowRemix: e.target.checked }))}
              className="mr-2"
            />
            Allow Remixing
          </label>
        </div>
        
        <button
          type="submit"
          disabled={updating}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {updating ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}

// Media Card Component
function MediaCard({ 
  media, 
  showOwnerInfo, 
  onLike 
}: { 
  media: MediaItem;
  showOwnerInfo: boolean;
  onLike: () => void;
}) {
  return (
    <div className="bg-white p-3 rounded-lg shadow border">
      {/* Media Preview */}
      <div className="aspect-square bg-gray-200 rounded mb-2 overflow-hidden">
        {media.type === 'video' ? (
          <video src={media.url} className="w-full h-full object-cover" />
        ) : (
          <img src={media.url} alt="Media" className="w-full h-full object-cover" />
        )}
      </div>
      
      {/* Owner Info */}
      {showOwnerInfo && media.owner_profile && (
        <div className="flex items-center space-x-2 mb-2">
          {media.owner_profile.avatar_url && (
            <img 
              src={media.owner_profile.avatar_url} 
              alt="Owner" 
              className="w-6 h-6 rounded-full object-cover"
            />
          )}
          <span className="text-sm font-medium">
            {media.owner_profile.username || 'Anonymous'}
          </span>
          {media.visibility === 'public' && (
            <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Public</span>
          )}
          {media.allow_remix && (
            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Remix OK</span>
          )}
        </div>
      )}
      
      {/* Prompt */}
      {media.prompt && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{media.prompt}</p>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onLike}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"
        >
          <span>❤️</span>
          <span>{media.likes || 0}</span>
        </button>
        
        <span className="text-xs text-gray-400">
          {new Date(media.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
