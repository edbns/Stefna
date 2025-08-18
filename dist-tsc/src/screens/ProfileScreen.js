import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, FileText, Settings, Shield, Cookie, ArrowLeft, LogOut, X, User, Globe, Coins, Users } from 'lucide-react';
import { InstagramIcon, XIcon, FacebookIcon, TikTokIcon, ThreadsIcon, YouTubeIcon } from '../components/SocialIcons';
import RemixIcon from '../components/RemixIcon';
import MasonryMediaGrid from '../components/MasonryMediaGrid';
import DraftMediaGrid from '../components/DraftMediaGrid';
import { navigateToEditor } from '../utils/editorNavigation';
import FullScreenMediaViewer from '../components/FullScreenMediaViewer';
import userMediaService from '../services/userMediaService';
import authService from '../services/authService';
import ConfirmModal from '../components/ConfirmModal';
import tokenService from '../services/tokenService';
import { authenticatedFetch } from '../utils/apiClient';
import { useToasts } from '../components/ui/Toasts';
import { uploadToCloudinary } from '../lib/cloudinaryUpload';
import { ensureAndUpdateProfile } from '../services/profile';
import { useProfile } from '../contexts/ProfileContext';
const toAbsoluteCloudinaryUrl = (maybeUrl) => {
    if (!maybeUrl)
        return maybeUrl;
    // Keep absolute http(s) and data/blob URLs as-is
    if (/^https?:\/\//i.test(maybeUrl) || /^(data:|blob:)/i.test(maybeUrl))
        return maybeUrl;
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloud)
        return maybeUrl;
    return `https://res.cloudinary.com/${cloud}/image/upload/${maybeUrl.replace(/^\/+/, '')}`;
};
const ProfileScreen = () => {
    const navigate = useNavigate();
    const { notifyReady, notifyError } = useToasts();
    // const location = useLocation()
    const [activeTab, setActiveTab] = useState('all-media');
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [bulkDeleteConfirmed, setBulkDeleteConfirmed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Use profile context
    const { profileData, updateProfile, refreshProfile } = useProfile();
    // Local state for editing (synced with context)
    const [editingProfileData, setEditingProfileData] = useState({
        name: profileData.name,
        avatar: profileData.avatar,
        shareToFeed: profileData.shareToFeed,
        allowRemix: profileData.allowRemix
    });
    // Sync editing state when profile context changes
    useEffect(() => {
        setEditingProfileData({
            name: profileData.name,
            avatar: profileData.avatar,
            shareToFeed: profileData.shareToFeed,
            allowRemix: profileData.allowRemix
        });
    }, [profileData]);
    // Handle navigation state for activeTab
    useEffect(() => {
        const state = navigate.location?.state;
        if (state?.activeTab) {
            setActiveTab(state.activeTab);
        }
    }, [navigate]);
    // Handle invite modal opening from ProfileTokenDisplay
    useEffect(() => {
        const handleOpenInviteModal = () => {
        };
        window.addEventListener('openInviteModal', handleOpenInviteModal);
        return () => {
            window.removeEventListener('openInviteModal', handleOpenInviteModal);
        };
    }, []);
    // Handle user media updates (after saves)
    useEffect(() => {
        const handleUserMediaUpdated = () => {
            console.log('🔄 User media updated event received, refreshing profile media...');
            loadProfileFromDatabase();
        };
        window.addEventListener('userMediaUpdated', handleUserMediaUpdated);
        return () => {
            window.removeEventListener('userMediaUpdated', handleUserMediaUpdated);
        };
    }, []);
    // Fallback to localStorage when profile loading fails
    const fallbackToLocalStorage = () => {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            try {
                const parsedProfile = JSON.parse(savedProfile);
                updateProfile(parsedProfile);
                // Sync preview photo with saved avatar
                if (parsedProfile.avatar && typeof parsedProfile.avatar === 'string') {
                    setPreviewPhoto(parsedProfile.avatar);
                }
            }
            catch (error) {
                console.error('Failed to load profile data from localStorage:', error);
            }
        }
    };
    // Load profile data from database and localStorage
    const loadProfileFromDatabase = async () => {
        try {
            const token = authService.getToken();
            if (!token)
                return;
            console.log('🔄 Loading profile from database...');
            const response = await fetch('/.netlify/functions/get-user-profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Profile loaded from database:', result);
                // Handle new response format: { ok: true, profile: {...} }
                const userData = result.ok && result.profile ? result.profile : result;
                // Store the real user ID from the database response
                if (userData.id) {
                    setCurrentUserId(userData.id);
                    console.log('✅ Set current user ID from profile:', userData.id);
                }
                const profileData = {
                    name: userData.name || userData.username || '',
                    bio: userData.bio || 'AI artist exploring the boundaries of creativity 🎨',
                    avatar: userData.avatar || userData.avatar_url || '' // Support both field names
                };
                updateProfile(profileData);
                // Sync preview photo with loaded avatar
                if (userData.avatar) {
                    setPreviewPhoto(userData.avatar);
                }
                // Also update localStorage for consistency and offline access
                localStorage.setItem('userProfile', JSON.stringify(profileData));
            }
            else {
                console.warn('⚠️ Failed to load profile from database, falling back to JWT token parsing');
                // Frontend safety net: parse JWT client-side to grab user ID
                try {
                    const token = authService.getToken();
                    if (token) {
                        const payload = JSON.parse(atob(token.split('.')[1] || ''));
                        const ownerId = payload.sub || payload.user_id || payload.userId || payload.uid || payload.id;
                        if (ownerId) {
                            console.log('✅ Extracted user ID from JWT token:', ownerId);
                            setCurrentUserId(ownerId);
                            // Create a minimal profile from JWT data
                            const fallbackProfile = {
                                name: payload.name || payload.username || `user-${ownerId.slice(-6)}`,
                                bio: 'AI artist exploring the boundaries of creativity 🎨',
                                avatar: payload.avatar_url || payload.picture || ''
                            };
                            updateProfile(fallbackProfile);
                            localStorage.setItem('userProfile', JSON.stringify(fallbackProfile));
                            console.log('✅ Created fallback profile from JWT:', fallbackProfile);
                        }
                        else {
                            console.warn('⚠️ JWT token missing user ID, falling back to localStorage');
                            fallbackToLocalStorage();
                        }
                    }
                    else {
                        console.warn('⚠️ No JWT token, falling back to localStorage');
                        fallbackToLocalStorage();
                    }
                }
                catch (jwtError) {
                    console.error('❌ Failed to parse JWT token:', jwtError);
                    fallbackToLocalStorage();
                }
            }
        }
        catch (error) {
            console.error('❌ Failed to load profile from database:', error);
            // Fallback to localStorage on error
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                try {
                    const parsedProfile = JSON.parse(savedProfile);
                    updateProfile(parsedProfile);
                    // Sync preview photo with saved avatar
                    if (parsedProfile.avatar && typeof parsedProfile.avatar === 'string') {
                        setPreviewPhoto(parsedProfile.avatar);
                    }
                }
                catch (parseError) {
                    console.error('Failed to load profile data from localStorage:', parseError);
                }
            }
        }
    };
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [userMedia, setUserMedia] = useState([]);
    const [remixedMedia, setRemixedMedia] = useState([]);
    const [draftMedia, setDraftMedia] = useState([]);
    const [currentUserId, setCurrentUserId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerMedia, setViewerMedia] = useState([]);
    const [viewerStartIndex, setViewerStartIndex] = useState(0);
    const [confirm, setConfirm] = useState({ open: false });
    // Removed tier system - all users get same experience
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [inviteError, setInviteError] = useState('');
    // Load profile data when component mounts and user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // Load profile first, then media (profile sets currentUserId)
            loadProfileFromDatabase().then(() => {
                // Only load media after profile is loaded and currentUserId is set
                if (currentUserId && currentUserId !== 'guest-user') {
                    console.log('✅ Profile loaded, now loading user media for:', currentUserId);
                    loadUserMedia();
                }
                else {
                    // Fallback: if profile didn't set currentUserId, try to load media anyway
                    console.log('⚠️ Profile loaded but no currentUserId set, trying to load media anyway');
                    setTimeout(() => loadUserMedia(), 100);
                }
            });
            // Load persisted user settings (shareToFeed, allowRemix)
            ;
            (async () => {
                try {
                    const token = authService.getToken();
                    if (!token)
                        return;
                    const r = await authenticatedFetch('/.netlify/functions/user-settings', { method: 'GET' });
                    if (r.ok) {
                        const s = await r.json();
                        updateProfile({ shareToFeed: !!s.shareToFeed, allowRemix: !!s.allowRemix });
                    }
                }
                catch (e) {
                    // ignore, fallback to defaults/localStorage
                }
            })();
        }
        else {
            // Fallback to localStorage for non-authenticated users
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                try {
                    const parsedProfile = JSON.parse(savedProfile);
                    updateProfile(parsedProfile);
                }
                catch (error) {
                    console.error('Failed to load profile data from localStorage:', error);
                }
            }
        }
    }, [isAuthenticated]);
    const [referralStats, setReferralStats] = useState(null);
    // const [copiedCode, setCopiedCode] = useState<string | null>(null)
    const [tokenCount, setTokenCount] = useState(0);
    const [showAdminUpgrade, setShowAdminUpgrade] = useState(false);
    // Unified notification system (same as home page)
    const [notifications, setNotifications] = useState([]);
    // Media selection state for bulk operations
    const [selectedMediaIds, setSelectedMediaIds] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    // Media selection helper functions
    const toggleMediaSelection = (mediaId) => {
        setSelectedMediaIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(mediaId)) {
                newSet.delete(mediaId);
            }
            else {
                newSet.add(mediaId);
            }
            return newSet;
        });
    };
    const selectAllMedia = () => {
        const allIds = new Set(userMedia.map(media => media.id));
        setSelectedMediaIds(allIds);
    };
    const deselectAllMedia = () => {
        setSelectedMediaIds(new Set());
    };
    const toggleSelectionMode = () => {
        setIsSelectionMode(prev => !prev);
        if (isSelectionMode) {
            setSelectedMediaIds(new Set()); // Clear selection when exiting
        }
    };
    const deleteSelectedMedia = async () => {
        if (selectedMediaIds.size === 0)
            return;
        try {
            const token = authService.getToken();
            if (!token) {
                addNotification('Delete Failed', 'Authentication required', 'error');
                return;
            }
            // Show confirmation modal
            setShowBulkDeleteModal(true);
            return; // Exit early, the actual deletion will happen when user confirms
        }
        catch (error) {
            console.error('❌ Bulk delete error:', error);
            addNotification('Delete Failed', 'Network or server error', 'error');
        }
    };
    // Actual bulk delete execution (called when user confirms)
    const executeBulkDelete = async () => {
        if (selectedMediaIds.size === 0)
            return;
        try {
            const token = authService.getToken();
            if (!token) {
                addNotification('Delete Failed', 'Authentication required', 'error');
                return;
            }
            // Delete each selected media item
            const deletePromises = Array.from(selectedMediaIds).map(async (mediaId) => {
                try {
                    const response = await authenticatedFetch(`/.netlify/functions/delete-media`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ mediaId })
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to delete media ${mediaId}`);
                    }
                    return { success: true, mediaId };
                }
                catch (error) {
                    console.error(`Failed to delete media ${mediaId}:`, error);
                    return { success: false, mediaId, error };
                }
            });
            const results = await Promise.allSettled(deletePromises);
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.length - successful;
            if (successful > 0) {
                addNotification('Bulk Delete Complete', `Successfully deleted ${successful} media items${failed > 0 ? `, ${failed} failed` : ''}`, 'success');
                // Clear selection and refresh media
                setSelectedMediaIds(new Set());
                setIsSelectionMode(false);
                await loadUserMedia();
            }
            else {
                addNotification('Delete Failed', 'No media items were deleted', 'error');
            }
        }
        catch (error) {
            console.error('❌ Bulk delete error:', error);
            addNotification('Delete Failed', 'Network or server error', 'error');
        }
        finally {
            setShowBulkDeleteModal(false);
        }
    };
    // Load user media from database using new Netlify Function
    const loadUserMedia = async () => {
        try {
            // Get current user ID from auth service or use stored ID from profile
            const user = authService.getCurrentUser();
            const userId = currentUserId || user?.id || 'guest-user';
            // If we have a stored currentUserId, use that (it comes from profile loading)
            if (currentUserId && currentUserId !== 'guest-user') {
                console.log('✅ Using stored currentUserId for media loading:', currentUserId);
            }
            else if (user?.id) {
                setCurrentUserId(user.id);
                console.log('✅ Set currentUserId from auth service:', user.id);
            }
            // Set authentication status and user tier
            if (user) {
                setIsAuthenticated(true);
                // Map user tier from auth service
                // Removed tier system - all users get same experience
                // Load referral stats for authenticated users
                try {
                    // Load referral stats from real database
                    try {
                        const referralRes = await authenticatedFetch('/.netlify/functions/get-referral-stats', { method: 'GET' });
                        if (referralRes.ok) {
                            const stats = await referralRes.json();
                            setReferralStats({
                                invites: stats.referred_count,
                                tokensEarned: stats.credits_from_referrals,
                                referralCode: '' // No codes needed for email-based referrals
                            });
                        }
                        else {
                            // Fallback to client service
                            const stats = await tokenService.getInstance().getReferralStats(userId);
                            setReferralStats(stats);
                        }
                    }
                    catch {
                        // Fallback to client service
                        const stats = await tokenService.getInstance().getReferralStats(userId);
                        setReferralStats(stats);
                    }
                    // Load token count - simplified for new credits system
                    // Prefer server-side quota for accuracy
                    try {
                        const qRes = await authenticatedFetch('/.netlify/functions/getQuota', { method: 'GET' });
                        if (qRes.ok) {
                            const q = await qRes.json();
                            setTokenCount((q.daily_limit || 0) - (q.daily_used || 0));
                        }
                        else {
                            // Fallback to client service
                            const tokenUsage = await tokenService.getInstance().getUserUsage(userId);
                            setTokenCount(tokenUsage.dailyLimit - tokenUsage.dailyUsage);
                        }
                    }
                    catch {
                        const tokenUsage = await tokenService.getInstance().getUserUsage(userId);
                        setTokenCount(tokenUsage.dailyLimit - tokenUsage.dailyUsage);
                    }
                }
                catch (error) {
                    console.error('Failed to load referral stats or token count:', error);
                    // Simplified: all users get same daily limit (30)
                    setTokenCount(30);
                }
            }
            else {
                setIsAuthenticated(false);
                // Removed tier system - all users get same experience
            }
            // Load all user media from database using new Netlify Function
            try {
                const jwt = authService.getToken() || localStorage.getItem('auth_token');
                if (!jwt) {
                    // Guest user: skip server fetch, show local results only
                    console.log('Guest user: skipping getUserMedia server call');
                    const allMedia = await userMediaService.getAllUserMedia(userId);
                    setUserMedia(allMedia);
                }
                else {
                    // Authenticated user: fetch from server with JWT
                    const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?ownerId=${userId}&limit=50`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.status === 401) {
                        // JWT expired/invalid: fallback to local
                        console.log('JWT invalid: falling back to local media');
                        const allMedia = await userMediaService.getAllUserMedia(userId);
                        setUserMedia(allMedia);
                    }
                    else if (response.ok) {
                        const result = await response.json();
                        const dbMedia = result.items || []; // Updated to use 'items' instead of 'media'
                        console.log('📊 Database returned', dbMedia.length, 'media items');
                        // Transform database media to UserMedia format
                        const transformedMedia = dbMedia.map((item) => {
                            console.log(`🔍 Database item ${item.id}:`, {
                                prompt: item.prompt,
                                mode: item.mode,
                                meta: item.meta
                            });
                            return {
                                id: item.id,
                                userId: item.user_id,
                                type: item.resource_type === 'video' ? 'video' : 'photo',
                                url: toAbsoluteCloudinaryUrl(item.result_url) || toAbsoluteCloudinaryUrl(item.url) || item.result_url || item.url,
                                prompt: item.prompt || 'AI Generated Content',
                                aspectRatio: 4 / 3, // Default aspect ratio
                                width: 800,
                                height: 600,
                                timestamp: item.created_at,
                                tokensUsed: 2, // Default token usage
                                likes: 0, // Will be updated when we implement likes
                                remixCount: 0, // Will be updated when we implement remix counts
                                isPublic: item.visibility === 'public',
                                allowRemix: item.allow_remix || false,
                                tags: [],
                                metadata: {
                                    quality: 'high',
                                    generationTime: 0,
                                    modelVersion: '1.0'
                                }
                            };
                        });
                        console.log('📊 Setting userMedia with', transformedMedia.length, 'items');
                        setUserMedia(transformedMedia);
                        // Also derive remixes immediately from the fresh list (avoid stale state)
                        const remixesWithAvatar = transformedMedia
                            .filter(m => m.type === 'remix')
                            .map(remix => ({
                            ...remix,
                            userAvatar: typeof profileData.avatar === 'string' ? profileData.avatar : undefined
                            // Removed tier system - all users get same experience
                        }));
                        console.log('🔄 Setting remixedMedia with', remixesWithAvatar.length, 'items (from transformed)');
                        setRemixedMedia(remixesWithAvatar);
                    }
                    else {
                        console.error('Failed to load user media from database:', response.statusText);
                        // Fallback to local service if database fails
                        const allMedia = await userMediaService.getAllUserMedia(userId);
                        console.log('📊 Fallback: Setting userMedia with', allMedia.length, 'items from local service');
                        setUserMedia(allMedia);
                    }
                }
            }
            catch (error) {
                console.error('Error loading user media:', error);
                // Fallback to local service on any error
                try {
                    const allMedia = await userMediaService.getAllUserMedia(userId);
                    setUserMedia(allMedia);
                }
                catch (fallbackError) {
                    console.error('Fallback media loading also failed:', fallbackError);
                    setUserMedia([]);
                }
            }
            finally {
                // Always clear loading state
                setIsLoading(false);
            }
            // Load remixed media (for now, filter from user media)
            // Derive remixes from current userMedia state on first load
            const remixesBootstrap = userMedia.filter(m => m.type === 'remix');
            const remixesBootstrapWithAvatar = remixesBootstrap.map(remix => ({
                ...remix,
                userAvatar: typeof profileData.avatar === 'string' ? profileData.avatar : undefined
                // Removed tier system - all users get same experience
            }));
            console.log('🔄 Bootstrapping remixedMedia with', remixesBootstrapWithAvatar.length, 'items');
            setRemixedMedia(remixesBootstrapWithAvatar);
            // Ensure we have the latest userMedia for filtering
            console.log('🔄 Current userMedia for filtering (state):', userMedia.length, 'items');
            // Load draft media (empty for now - will be populated when users create drafts)
            setDraftMedia([]);
            // Load drafts from localStorage
            try {
                const user = authService.getCurrentUser();
                if (user?.id) {
                    const key = `user_drafts_${user.id}`;
                    const savedDrafts = localStorage.getItem(key);
                    if (savedDrafts) {
                        const drafts = JSON.parse(savedDrafts);
                        console.log('📝 Loaded drafts from localStorage:', drafts.length);
                        setDraftMedia(drafts);
                    }
                }
            }
            catch (error) {
                console.error('Failed to load drafts from localStorage:', error);
            }
            // Debug: Log final state
            console.log('🎯 Final media state:', {
                userMedia: userMedia.length,
                remixedMedia: remixedMedia.length,
                totalItems: userMedia.length + remixedMedia.length
            });
            setIsLoading(false);
        }
        catch (error) {
            console.error('Failed to load user media:', error);
            setIsLoading(false);
        }
    };
    // Load user media on component mount and when updated
    useEffect(() => {
        loadUserMedia();
        // Listen for user media updates from other components
        const handleUserMediaUpdated = (e) => {
            console.log('🔄 ProfileScreen received userMediaUpdated event, refreshing...');
            // If an optimistic item is provided, prepend it immediately
            const optimistic = e?.detail?.optimistic;
            if (optimistic) {
                setUserMedia(prev => [optimistic, ...prev]);
            }
            const markFailedId = e?.detail?.markFailedId;
            if (markFailedId) {
                setUserMedia(prev => prev.map(m => (m.id === markFailedId ? { ...m, status: 'failed' } : m)));
            }
            const removeId = e?.detail?.removeId;
            if (removeId) {
                setUserMedia(prev => prev.filter(m => m.id !== removeId));
            }
            loadUserMedia();
            // Also refresh drafts specifically
            const user = authService.getCurrentUser();
            if (user?.id) {
                const key = `user_drafts_${user.id}`;
                const savedDrafts = localStorage.getItem(key);
                if (savedDrafts) {
                    const drafts = JSON.parse(savedDrafts);
                    console.log('📝 Refreshing drafts from localStorage:', drafts.length);
                    setDraftMedia(drafts);
                }
            }
        };
        window.addEventListener('userMediaUpdated', handleUserMediaUpdated);
        return () => {
            window.removeEventListener('userMediaUpdated', handleUserMediaUpdated);
        };
    }, []);
    // Monitor activeTab changes to ensure media is properly loaded
    useEffect(() => {
        console.log('🔄 Active tab changed to:', activeTab);
        console.log('📊 Current media state:', {
            userMedia: userMedia.length,
            remixedMedia: remixedMedia.length,
            isLoading
        });
    }, [activeTab, userMedia.length, remixedMedia.length, isLoading]);
    const handlePhotoUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setEditingProfileData(prev => ({ ...prev, avatar: file }));
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewPhoto(e.target?.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleSaveProfile = async () => {
        try {
            setIsSaving(true);
            const profileDataToSave = { ...editingProfileData };
            let avatarUrl = undefined;
            // Handle avatar upload if it's a file
            if (editingProfileData.avatar instanceof File) {
                // Use the existing uploadToCloudinary function which handles signing correctly
                const up = await uploadToCloudinary(editingProfileData.avatar, 'users');
                avatarUrl = up.secure_url;
                profileDataToSave.avatar = avatarUrl;
            }
            else if (typeof editingProfileData.avatar === 'string') {
                avatarUrl = editingProfileData.avatar;
            }
            // Use the new profile service to update
            await ensureAndUpdateProfile({
                username: profileDataToSave.name, // Map name to username for now
                avatar_url: avatarUrl,
                share_to_feed: profileDataToSave.shareToFeed,
                allow_remix: profileDataToSave.allowRemix
            });
            // Update the profile context - this will trigger updates across all components
            updateProfile(profileDataToSave);
            // Update the preview photo state
            if (avatarUrl) {
                setPreviewPhoto(avatarUrl);
            }
            notifyReady({ title: 'Profile Updated', message: 'Your profile has been saved successfully' });
            setShowEditProfileModal(false);
        }
        catch (e) {
            console.error('Save profile failed:', e);
            notifyError({
                title: 'Update failed',
                message: e.message || 'Could not update profile'
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDeleteAccount = () => {
        // Clear all user data
        localStorage.removeItem('userProfile');
        localStorage.removeItem('token_usage');
        localStorage.removeItem('token_generations');
        localStorage.removeItem('referral_codes');
        // Clear auth state
        authService.logout();
        addNotification('Account Deleted', 'Your account has been permanently deleted', 'info');
        setShowDeleteAccountModal(false);
        // Redirect to home page after deletion
        setTimeout(() => {
            navigate('/');
        }, 1000);
    };
    // Media interaction handlers
    const handleMediaClick = (media) => {
        // Don't open full-screen viewer for draft tab
        if (activeTab === 'draft') {
            return;
        }
        const active = activeTab === 'remixed' ? remixedMedia : activeTab === 'draft' ? draftMedia : userMedia;
        const index = active.findIndex(m => m.id === media.id);
        setViewerMedia(active);
        setViewerStartIndex(Math.max(0, index));
        setViewerOpen(true);
    };
    const handleDownload = async (media) => {
        try {
            const resp = await fetch(media.url, { mode: 'cors' });
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ext = media.type === 'video' ? 'mp4' : 'jpg';
            link.download = `stefna-${media.id}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (e) {
            addNotification('Download failed', 'Unable to download file', 'error');
        }
    };
    // Updated share function that updates database visibility
    const handleShare = async (media) => {
        try {
            // Auth guard: require JWT before attempting to change visibility
            if (!authService.getToken()) {
                addNotification('Login Required', 'Please sign in to change visibility', 'warning');
                navigate('/auth');
                return;
            }
            // Update media visibility in database using recordShare
            const response = await authenticatedFetch('/.netlify/functions/recordShare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    asset_id: media.id,
                    shareToFeed: true,
                    allowRemix: media.allowRemix
                })
            });
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Share successful:', result);
                // Update local state with server response
                setUserMedia(prev => prev.map(item => item.id === media.id
                    ? {
                        ...item,
                        visibility: result.asset.visibility,
                        allowRemix: result.asset.allow_remix,
                        env: result.asset.env
                    }
                    : item));
                addNotification('Media Shared', 'Your media is now public!', 'success');
            }
            else {
                const error = await response.json();
                addNotification('Share Failed', error.error || 'Failed to share media', 'error');
            }
        }
        catch (error) {
            console.error('Failed to share media:', error);
            addNotification('Share Failed', 'Failed to share media. Please try again.', 'error');
        }
    };
    // Handle unsharing media (making it private)
    const handleUnshare = async (media) => {
        try {
            // Auth guard: require JWT before attempting to change visibility
            if (!authService.getToken()) {
                addNotification('Login Required', 'Please sign in to change visibility', 'warning');
                navigate('/auth');
                return;
            }
            // Update media visibility in database using recordShare
            const response = await authenticatedFetch('/.netlify/functions/recordShare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    asset_id: media.id,
                    shareToFeed: false,
                    allowRemix: false
                })
            });
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Unshare successful:', result);
                // Update local state with server response
                setUserMedia(prev => prev.map(item => item.id === media.id
                    ? {
                        ...item,
                        visibility: result.asset.visibility,
                        allowRemix: result.asset.allow_remix,
                        env: result.asset.env
                    }
                    : item));
                addNotification('Media Unshared', 'Your media is now private!', 'success');
            }
            else {
                const error = await response.json();
                addNotification('Unshare Failed', error.error || 'Failed to unshare media', 'error');
            }
        }
        catch (error) {
            console.error('Failed to unshare media:', error);
            addNotification('Unshare Failed', 'Failed to unshare media. Please try again.', 'error');
        }
    };
    // Unified notification functions (same as home page)
    // Notifications disabled - replaced with no-op function
    // Notifications disabled - replaced with no-op function
    const addNotification = (title, message, type = 'info', mediaUrl, mediaType, persistent) => {
        // Notifications are disabled on profile page - only show on home page
        console.log(`[NOTIFICATION DISABLED] ${type.toUpperCase()}: ${title} - ${message}`);
    };
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };
    const handleRemix = (media) => {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
            addNotification('Login Required', 'Please sign in to remix media', 'warning');
            navigate('/auth');
            return;
        }
        // Close viewer if open, then navigate to home with remix payload
        setViewerOpen(false);
        navigate('/', { state: { remixUrl: media.url, remixPrompt: media.prompt || '', source: 'profile' } });
    };
    // Deletion handled in specific grid handlers
    const handleDeleteMedia = (media) => {
        setConfirm({ open: true, media });
    };
    const handleEditDraft = (media) => {
        navigateToEditor(navigate, media.url, media.prompt);
    };
    const handleDeleteDraft = (media) => {
        setConfirm({ open: true, media });
    };
    // Invite Friends functionality
    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) {
            setInviteError('Please enter an email address');
            return;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail)) {
            setInviteError('Please enter a valid email address');
            return;
        }
        setIsSendingInvite(true);
        setInviteError('');
        setInviteSuccess('');
        try {
            // Import emailService dynamically to avoid circular dependencies
            const emailService = (await import('../services/emailService')).default;
            const result = await emailService.sendReferralEmail({
                referrerEmail: authService.getCurrentUser()?.email || '',
                referrerName: profileData.name,
                friendEmail: inviteEmail.trim(),
                referralCode: referralStats?.referralCode
            });
            if (result.success) {
                setInviteSuccess('Invitation sent successfully!');
                setInviteEmail('');
                // Update referral stats
                if (referralStats) {
                    const updatedStats = { ...referralStats, invites: referralStats.invites + 1 };
                    setReferralStats(updatedStats);
                }
                addNotification('Invitation Sent', 'Your friend will receive an email invitation shortly', 'success');
            }
            else {
                setInviteError(result.error || 'Failed to send invitation');
                addNotification('Invitation Failed', result.error || 'Failed to send invitation', 'error');
            }
        }
        catch (error) {
            console.error('Failed to send invite:', error);
            setInviteError('Failed to send invitation. Please try again.');
            addNotification('Invitation Failed', 'Failed to send invitation. Please try again.', 'error');
        }
        finally {
            setIsSendingInvite(false);
        }
    };
    const sidebarItems = [
        { id: 'tokens', label: 'Tokens', icon: Coins },
        { id: 'invite-friends', label: 'Invite Friends', icon: Users },
        { id: 'divider_prefs', type: 'divider', label: ' ' },
        { id: 'pref_share', label: 'Share to Feed', type: 'toggle', setting: 'autoShareToFeed' },
        { id: 'pref_remix', label: 'Allow Remix', type: 'toggle', setting: 'allowRemixByDefault' },
        { id: 'divider_media', type: 'divider', label: ' ' },
        { id: 'all-media', label: 'All Media', icon: Image },
        { id: 'remixed', label: 'Remixes', icon: RemixIcon },
        { id: 'draft', label: 'Drafts', icon: FileText },
        { id: 'account', label: 'Account', icon: Settings }
    ];
    // Persist user settings helper
    const updateUserSettings = async (shareToFeed, allowRemix) => {
        const token = authService.getToken();
        if (!token)
            return;
        try {
            const r = await authenticatedFetch('/.netlify/functions/user-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shareToFeed, allowRemix })
            });
            if (r.ok) {
                const s = await r.json();
                updateProfile({ shareToFeed: !!s.shareToFeed, allowRemix: !!s.allowRemix });
            }
        }
        catch (e) {
            // keep local state; will retry next time
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-black flex", children: [_jsxs("div", { className: "w-[20%] bg-black p-4 pt-20 relative sticky top-0 h-screen overflow-y-auto flex flex-col", children: [_jsx("button", { onClick: () => navigate('/'), className: "absolute top-4 left-4 text-white/60 hover:text-white transition-colors duration-300", title: "Go back", children: _jsx(ArrowLeft, { size: 20 }) }), _jsx("button", { onClick: () => {
                            authService.logout();
                            navigate('/');
                        }, className: "absolute top-4 right-4 text-white/60 hover:text-white transition-colors duration-300", title: "Logout", children: _jsx(LogOut, { size: 20 }) }), _jsx("div", { className: "flex-1", children: _jsx("div", { className: "space-y-1", children: sidebarItems.map((item) => {
                                // Handle dividers
                                if (item.type === 'divider') {
                                    return _jsx("div", { className: "h-px bg-white/10 my-2" }, item.id);
                                }
                                // Handle special items
                                if (item.id === 'tokens') {
                                    return (_jsxs("div", { className: "flex items-center justify-between py-1.5 px-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Coins, { size: 16, className: "text-white/60" }), _jsx("span", { className: "text-xs font-medium text-white/60", children: item.label })] }), _jsx("span", { className: "text-xs font-medium text-white", children: tokenCount })] }, item.id));
                                }
                                // Handle toggle items
                                if (item.type === 'toggle') {
                                    const settingValue = item.setting === 'autoShareToFeed' ? profileData.shareToFeed : profileData.allowRemix;
                                    return (_jsxs("div", { className: "flex items-center justify-between py-1.5 px-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [item.setting === 'autoShareToFeed' ? (_jsx(Globe, { size: 16, className: "text-white/60" })) : (_jsx(RemixIcon, { size: 16, className: "text-white/60" })), _jsx("span", { className: "text-xs font-medium text-white/60", children: item.label })] }), _jsx("button", { onClick: () => {
                                                    const newValue = !settingValue;
                                                    if (item.setting === 'autoShareToFeed') {
                                                        updateProfile({ shareToFeed: newValue });
                                                        updateUserSettings(newValue, profileData.allowRemix);
                                                    }
                                                    else {
                                                        updateProfile({ allowRemix: newValue });
                                                        updateUserSettings(profileData.shareToFeed, newValue);
                                                    }
                                                }, className: `relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${settingValue ? 'bg-white' : 'bg-white/20'}`, children: _jsx("span", { className: `inline-block h-3 w-3 transform rounded-full bg-black transition-transform duration-200 ${settingValue ? 'translate-x-5' : 'translate-x-1'}` }) })] }, item.id));
                                }
                                // Handle regular navigation items
                                const IconComponent = item.icon;
                                return (_jsx("div", { children: _jsxs("button", { onClick: () => {
                                            setActiveTab(item.id);
                                            setShowSettingsDropdown(false);
                                        }, className: `w-full py-1.5 px-3 rounded-lg text-left transition-all duration-300 flex items-center justify-start space-x-3 ${activeTab === item.id
                                            ? 'bg-white/20 text-white'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'}`, children: [_jsx("div", { className: "flex items-center justify-center w-5 h-5 flex-shrink-0", children: _jsx(IconComponent, { size: 16, className: "text-current" }) }), _jsx("span", { className: "text-xs font-medium", children: item.label })] }) }, item.id));
                            }) }) }), showBulkDeleteModal && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-sm", onClick: () => setShowBulkDeleteModal(false) }), _jsxs("div", { className: "relative bg-[#222222] border border-white/20 rounded-2xl max-w-lg w-full p-8 shadow-2xl", children: [_jsx("button", { onClick: () => setShowBulkDeleteModal(false), className: "absolute top-4 right-4 text-white/60 hover:text-white transition-colors", children: _jsx(X, { size: 24 }) }), _jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-white text-xl font-bold mb-3", children: "Delete Selected Media" }), _jsxs("p", { className: "text-white/60 text-sm", children: ["Are you sure you want to delete ", selectedMediaIds.size, " media item", selectedMediaIds.size !== 1 ? 's' : '', "? This action cannot be undone."] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { onClick: executeBulkDelete, className: "w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 btn-optimized", children: ["Delete ", selectedMediaIds.size, " Item", selectedMediaIds.size !== 1 ? 's' : ''] }), _jsx("button", { onClick: () => setShowBulkDeleteModal(false), className: "w-full bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 btn-optimized border border-white/20", children: "Cancel" })] })] })] })), _jsx("div", { className: "mt-auto", children: _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "py-2 px-3", children: _jsx("img", { src: "/logo.png", alt: "Stefna Logo", className: "h-8 w-auto" }) }), _jsx("div", { className: "py-2 px-3", children: _jsx("span", { className: "text-xs font-medium text-white/60", children: "Legal" }) }), _jsxs("div", { className: "flex items-center space-x-2 px-3", children: [_jsx("button", { onClick: () => navigate('/privacy'), className: "w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300", title: "Privacy Policy", children: _jsx(Shield, { size: 16, className: "text-white" }) }), _jsx("button", { onClick: () => navigate('/terms'), className: "w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300", title: "Terms of Service", children: _jsx(FileText, { size: 16, className: "text-white" }) }), _jsx("button", { onClick: () => navigate('/cookies'), className: "w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300", title: "Cookies Policy", children: _jsx(Cookie, { size: 16, className: "text-white" }) })] }), _jsx("div", { className: "py-2 px-3", children: _jsx("span", { className: "text-xs font-medium text-white/60", children: "Social Media" }) }), _jsxs("div", { className: "flex items-center space-x-2 px-3", children: [_jsx("a", { href: "https://www.instagram.com/stefnaxyz/", target: "_blank", rel: "noopener noreferrer", className: "w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90", title: "Instagram", children: _jsx(InstagramIcon, { size: 18, className: "text-white" }) }), _jsx("a", { href: "https://x.com/StefnaXYZ", target: "_blank", rel: "noopener noreferrer", className: "w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90", title: "X", children: _jsx(XIcon, { size: 18, className: "text-white" }) }), _jsx("a", { href: "https://www.facebook.com/Stefnaxyz", target: "_blank", rel: "noopener noreferrer", className: "w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90", title: "Facebook", children: _jsx(FacebookIcon, { size: 18, className: "text-white" }) }), _jsx("a", { href: "https://www.tiktok.com/@stefnaxyz", target: "_blank", rel: "noopener noreferrer", className: "w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90", title: "TikTok", children: _jsx(TikTokIcon, { size: 18, className: "text-white" }) }), _jsx("a", { href: "https://www.threads.net/@stefnaxyz", target: "_blank", rel: "noopener noreferrer", className: "w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90", title: "Threads", children: _jsx(ThreadsIcon, { size: 18, className: "text-white" }) }), _jsx("a", { href: "https://www.youtube.com/channel/UCNBAWuWc8luYN8F0dIXX0RA", target: "_blank", rel: "noopener noreferrer", className: "w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90", title: "YouTube", children: _jsx(YouTubeIcon, { size: 18, className: "text-white" }) })] })] }) })] }), _jsxs("div", { className: "w-[80%] bg-black h-screen overflow-y-auto flex flex-col relative", children: [activeTab === 'all-media' && (_jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [!isLoading && userMedia.length > 0 && (_jsxs("div", { className: "mb-6 flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: toggleSelectionMode, className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSelectionMode
                                                    ? 'bg-white text-black hover:bg-white/90'
                                                    : 'bg-white/10 text-white hover:bg-white/20'}`, children: isSelectionMode ? 'Exit Selection' : 'Select Media' }), isSelectionMode && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: selectAllMedia, className: "px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors", children: "Select All" }), _jsx("button", { onClick: deselectAllMedia, className: "px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors", children: "Deselect All" }), _jsxs("span", { className: "text-white/60 text-sm", children: [selectedMediaIds.size, " of ", userMedia.length, " selected"] })] }))] }), isSelectionMode && selectedMediaIds.size > 0 && (_jsxs("button", { onClick: deleteSelectedMedia, className: "px-4 py-2 rounded-lg text-sm font-medium bg-red-500/80 text-white hover:bg-red-500 transition-colors", children: ["Delete Selected (", selectedMediaIds.size, ")"] }))] })), isLoading ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full", children: [_jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse", children: _jsx(Image, { size: 48, className: "text-white/40" }) }), _jsx("p", { className: "text-white/60 text-lg text-center", children: "Loading your media..." })] })) : (() => {
                                console.log('🔍 Rendering all-media tab:', { userMediaLength: userMedia.length, userMedia: userMedia, isLoading });
                                // Don't show "no media" if we're still loading or if we have items
                                return !isLoading && userMedia.length === 0;
                            })() ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full", children: [_jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6", children: _jsx(Image, { size: 48, className: "text-white/40" }) }), _jsx("p", { className: "text-white/60 text-lg text-center", children: "Create your first piece" }), _jsxs("p", { className: "text-white/40 text-sm text-center mt-2", children: ["Your edits will appear here. Defaults: auto-share ", profileData.shareToFeed ? 'ON' : 'OFF', ", allow remix ", profileData.allowRemix ? 'ON' : 'OFF'] }), _jsx("button", { onClick: () => navigate('/'), className: "mt-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors", children: "Create now" })] })) : (_jsx(MasonryMediaGrid, { media: userMedia.map(m => ({
                                    ...m,
                                    aspectRatio: m.width && m.height ? m.width / Math.max(1, m.height) : (m.aspectRatio || 4 / 3),
                                    width: m.width || 800,
                                    height: m.height || Math.round((m.width || 800) / ((m.aspectRatio || 4 / 3)))
                                })), columns: 3, onMediaClick: handleMediaClick, onDownload: handleDownload, onShare: handleShare, onUnshare: handleUnshare, onRemix: handleRemix, onDelete: handleDeleteMedia, showActions: true, className: "pb-20", hideRemixCount: true, hideUserAvatars: true, 
                                // Selection props
                                isSelectionMode: isSelectionMode, selectedMediaIds: selectedMediaIds, onToggleSelection: toggleMediaSelection }))] })), activeTab === 'remixed' && (_jsx("div", { className: "flex-1 overflow-y-auto p-6", children: isLoading ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full", children: [_jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse", children: _jsx(RemixIcon, { size: 48, className: "text-white/40" }) }), _jsx("p", { className: "text-white/60 text-lg text-center", children: "Loading your remixes..." })] })) : (() => {
                            console.log('🔍 Rendering remixed tab:', { remixedMediaLength: remixedMedia.length, remixedMedia: remixedMedia, isLoading });
                            return !isLoading && remixedMedia.length === 0;
                        })() ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full", children: [_jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6", children: _jsx(RemixIcon, { size: 48, className: "text-white/40" }) }), _jsx("p", { className: "text-white/60 text-lg text-center", children: "No remixes yet" }), _jsx("p", { className: "text-white/40 text-sm text-center mt-2", children: "Your remixed media will appear here" })] })) : (_jsx(MasonryMediaGrid, { media: remixedMedia.map(m => ({
                                ...m,
                                aspectRatio: m.width && m.height ? m.width / Math.max(1, m.height) : (m.aspectRatio || 4 / 3),
                                width: m.width || 800,
                                height: m.height || Math.round((m.width || 800) / ((m.aspectRatio || 4 / 3)))
                            })), columns: 3, onMediaClick: handleMediaClick, onDownload: handleDownload, onShare: handleShare, onUnshare: handleUnshare, onRemix: handleRemix, onDelete: handleDeleteMedia, showActions: true, className: "pb-20", hideRemixCount: true, hideUserAvatars: true })) })), activeTab === 'draft' && (_jsx("div", { className: "flex-1 overflow-y-auto p-6", children: isLoading ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full", children: [_jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse", children: _jsx(FileText, { size: 48, className: "text-white/40" }) }), _jsx("p", { className: "text-white/60 text-lg text-center", children: "Loading your drafts..." })] })) : (() => {
                            console.log('🔍 Rendering draft tab:', { draftMediaLength: draftMedia.length, draftMedia: draftMedia, isLoading });
                            return !isLoading && draftMedia.length === 0;
                        })() ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full", children: [_jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6", children: _jsx(FileText, { size: 48, className: "text-white/40" }) }), _jsx("p", { className: "text-white/60 text-lg text-center", children: "No drafts yet" }), _jsx("p", { className: "text-white/40 text-sm text-center mt-2", children: "Your draft media will appear here" })] })) : (_jsx(DraftMediaGrid, { media: draftMedia, columns: 3, onMediaClick: handleMediaClick, onEdit: handleEditDraft, onDelete: handleDeleteDraft, onShare: handleShare, showActions: true, className: "pb-20" })) })), activeTab === 'invite-friends' && (_jsx("div", { className: "flex-1 p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Invite Friends" }), _jsx("p", { className: "text-white/60 text-sm", children: "Share Stefna with friends and earn bonus credits together" })] }), _jsx("div", { className: "bg-[#1a1a1a] border border-[#333333] rounded-xl p-8", children: isAuthenticated && referralStats ? (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-white/5 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-white font-semibold mb-2 text-lg", children: "You Get" }), _jsx("div", { className: "text-white/60", children: "+50 credits after friend's first media" })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-white font-semibold mb-2 text-lg", children: "Friend Gets" }), _jsx("div", { className: "text-white/60", children: "+25 credits on signup" })] })] }), _jsxs("form", { onSubmit: handleSendInvite, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-white/80 text-sm font-medium mb-2", children: "Friend's Email" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "email", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), className: "flex-1 bg-[#2a2a2a] border border-[#444444] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10", placeholder: "Enter friend's email address", disabled: isSendingInvite, required: true }), _jsx("button", { type: "submit", disabled: isSendingInvite || !inviteEmail.trim(), className: "bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: isSendingInvite ? 'Sending...' : 'Send Invite' })] })] }), inviteError && (_jsx("div", { className: "bg-red-500/20 border border-red-500/30 rounded-lg p-3", children: _jsx("p", { className: "text-red-400 text-sm", children: inviteError }) })), inviteSuccess && (_jsx("div", { className: "bg-white/10 border border-white/20 rounded-lg p-3 text-center", children: _jsx("p", { className: "text-white text-sm", children: inviteSuccess }) }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-4", children: [_jsxs("div", { className: "bg-white/5 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-white", children: referralStats.invites }), _jsx("div", { className: "text-white/60 text-sm", children: "Friends Invited" })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-white", children: referralStats.tokensEarned }), _jsx("div", { className: "text-white/60 text-sm", children: "Credits Earned" })] })] })] })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 mx-auto", children: _jsx(Users, { size: 48, className: "text-white/40" }) }), _jsx("p", { className: "text-white/60 text-lg mb-4", children: "Sign up to unlock the invite system!" }), _jsx("p", { className: "text-white/40 text-sm mb-6", children: "Invite friends and earn bonus credits together" }), _jsx("button", { onClick: () => navigate('/auth'), className: "bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-white/90 transition-all duration-300", children: "Sign Up Now" })] })) })] }) })), activeTab === 'account' && (_jsx("div", { className: "flex-1 p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Account Settings" }), _jsx("p", { className: "text-white/60 text-sm", children: "Manage your AI media preferences and account security" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-[#1a1a1a] border border-[#333333] rounded-xl p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 text-white flex items-center", children: [_jsx(User, { size: 20, className: "mr-2" }), "Account Information"] }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-white/80 text-sm font-medium mb-2", children: "Email Address" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "email", value: authService.getCurrentUser()?.email || 'user@example.com', disabled: true, className: "flex-1 bg-[#2a2a2a] border border-[#444444] rounded-lg px-4 py-3 text-white/60 cursor-not-allowed" }), _jsx("button", { onClick: () => {
                                                                                    // Redirect to auth page for email change
                                                                                    navigate('/auth');
                                                                                }, className: "bg-white text-black font-semibold py-3 px-4 rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap", children: "Change" })] })] }) })] }), _jsxs("div", { className: "bg-[#1a1a1a] border border-[#333333] rounded-xl p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 text-white flex items-center", children: [_jsx(Image, { size: 20, className: "mr-2" }), "AI Media Preferences"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-white font-medium text-sm", children: "Auto-share to Feed" }), _jsx("div", { className: "text-white/60 text-xs", children: "Automatically share your AI media to the public feed" })] }), _jsx("button", { onClick: () => updateProfile({ shareToFeed: !profileData.shareToFeed }), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${profileData.shareToFeed ? 'bg-white' : 'bg-white/20'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${profileData.shareToFeed ? 'translate-x-6' : 'translate-x-1'}` }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-white font-medium text-sm", children: "Allow Remixes" }), _jsx("div", { className: "text-white/60 text-xs", children: "Let other users remix your AI creations" })] }), _jsx("button", { onClick: () => updateProfile({ allowRemix: !profileData.allowRemix }), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${profileData.allowRemix ? 'bg-white' : 'bg-white/20'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${profileData.allowRemix ? 'translate-x-6' : 'translate-x-1'}` }) })] })] })] }), _jsxs("div", { className: "bg-[#1a1a1a] border border-[#333333] rounded-xl p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 text-white flex items-center", children: [_jsx(Coins, { size: 20, className: "mr-2" }), "Media Statistics"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-white", children: userMedia.length }), _jsx("div", { className: "text-white/60 text-xs", children: "Total Media" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-white", children: tokenCount }), _jsx("div", { className: "text-white/60 text-xs", children: "Tokens Available" })] })] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-[#1a1a1a] border border-[#333333] rounded-xl p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 text-white flex items-center", children: [_jsx(Shield, { size: 20, className: "mr-2" }), "Account Security"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-white font-medium text-sm", children: "Two-Factor Authentication" }), _jsx("div", { className: "text-white/60 text-xs", children: "Secure your account with OTP verification" })] }), _jsx("div", { className: "bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full", children: "Enabled" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-white font-medium text-sm", children: "Session Management" }), _jsx("div", { className: "text-white/60 text-xs", children: "Manage active login sessions" })] }), _jsx("button", { onClick: () => {
                                                                                authService.logout();
                                                                                navigate('/');
                                                                            }, className: "bg-white/10 text-white text-sm px-3 py-1 rounded-lg hover:bg-white/20 transition-colors", children: "Logout" })] })] })] }), _jsxs("div", { className: "bg-[#1a1a1a] border border-[#333333] rounded-xl p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 text-white flex items-center", children: [_jsx(FileText, { size: 20, className: "mr-2" }), "Data Management"] }), _jsxs("div", { className: "space-y-4", children: [_jsx("button", { onClick: () => {
                                                                        // TODO: Implement data export
                                                                        notifyError({ title: 'Coming Soon', message: 'Data export will be available soon' });
                                                                    }, className: "w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-medium py-3 px-4 rounded-lg border border-[#444444] hover:border-[#555555] transition-colors", children: "Export My Media" }), _jsx("button", { onClick: () => {
                                                                        // TODO: Implement data deletion
                                                                        notifyError({ title: 'Coming Soon', message: 'Data deletion will be available soon' });
                                                                    }, className: "w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-medium py-3 px-4 rounded-lg border border-[#444444] hover:border-[#555555] transition-colors", children: "Delete My Data" })] })] }), _jsxs("div", { className: "bg-[#1a1a1a] border border-[#333333] rounded-xl p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-white mb-4 flex items-center", children: [_jsx(Shield, { size: 20, className: "mr-2" }), "Danger Zone"] }), _jsx("p", { className: "text-white/60 text-sm mb-4", children: "These actions cannot be undone. Your account and all AI media will be permanently deleted." }), _jsx("button", { onClick: () => setShowDeleteAccountModal(true), className: "w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors", children: "Delete Account" })] })] })] })] }) })), _jsx(FullScreenMediaViewer, { isOpen: viewerOpen, media: viewerMedia, startIndex: viewerStartIndex, onClose: () => setViewerOpen(false), onRemix: (m) => handleRemix(m), onShowAuth: () => navigate('/auth') })] }), _jsx(ConfirmModal, { isOpen: confirm.open, title: "Delete media?", message: "This action cannot be undone.", confirmText: "Delete", cancelText: "Cancel", onClose: () => setConfirm({ open: false }), onConfirm: async () => {
                    if (confirm.media) {
                        const mediaToDelete = confirm.media;
                        console.log('🗑️ Deleting media:', mediaToDelete.id);
                        try {
                            // Delete from server first
                            const jwt = authService.getToken();
                            let serverDeleteSuccess = false;
                            if (jwt) {
                                try {
                                    const r = await fetch('/.netlify/functions/delete-media', {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: mediaToDelete.id })
                                    });
                                    if (r.ok) {
                                        serverDeleteSuccess = true;
                                        console.log('✅ Server delete successful');
                                    }
                                    else {
                                        console.warn('⚠️ Server delete failed:', r.status, r.statusText);
                                    }
                                }
                                catch (serverError) {
                                    console.error('❌ Server delete error:', serverError);
                                }
                            }
                            // Update local state immediately for better UX
                            const isDraft = draftMedia.some(draft => draft.id === mediaToDelete.id);
                            if (isDraft) {
                                // Remove from draft media
                                setDraftMedia(prev => prev.filter(item => item.id !== mediaToDelete.id));
                                // Draft Deleted - no notification needed
                            }
                            else {
                                // Remove from user media immediately
                                setUserMedia(prev => prev.filter(item => item.id !== mediaToDelete.id));
                                // Also remove from remixed media if it exists there
                                setRemixedMedia(prev => prev.filter(item => item.id !== mediaToDelete.id));
                                // Update local storage as backup
                                try {
                                    await userMediaService.deleteMedia(currentUserId, mediaToDelete.id);
                                }
                                catch (localError) {
                                    console.warn('⚠️ Local storage delete failed:', localError);
                                }
                                // Media Deleted - no notification needed
                            }
                            console.log('✅ Local state updated, media removed from UI');
                        }
                        catch (error) {
                            console.error('❌ Delete operation failed:', error);
                            // Delete Failed - no notification needed
                        }
                    }
                    // Always close the modal
                    setConfirm({ open: false });
                } }), false && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-sm", onClick: () => setShowEditProfileModal(false) }), _jsxs("div", { className: "relative bg-[#222222] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl", children: [_jsx("button", { onClick: () => setShowEditProfileModal(false), className: "absolute top-4 right-4 text-white/60 hover:text-white transition-colors", children: _jsx(X, { size: 24 }) }), _jsx("div", { className: "mb-6", children: _jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-24 h-24 rounded-full overflow-hidden bg-white/10 flex items-center justify-center", children: previewPhoto ? (_jsx("img", { src: previewPhoto, alt: "Profile preview", className: "w-full h-full object-cover" })) : (_jsx(User, { size: 32, className: "text-white/40" })) }), _jsxs("label", { className: "absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-white/90 transition-colors", children: [_jsx("svg", { className: "w-4 h-4 text-black", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) }), _jsx("input", { type: "file", accept: "image/*", onChange: handlePhotoUpload, className: "hidden" })] })] }) }) }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Name" }), _jsx("input", { type: "text", value: editingProfileData.name, onChange: (e) => setEditingProfileData(prev => ({ ...prev, name: e.target.value })), className: "w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40", placeholder: "Enter your name" })] }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center justify-between space-x-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-1", children: [_jsx("label", { className: "text-sm font-medium text-white", children: "Share to Feed" }), _jsx("button", { onClick: () => setEditingProfileData(prev => ({ ...prev, shareToFeed: !prev.shareToFeed })), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingProfileData.shareToFeed ? 'bg-white' : 'bg-white/20'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${editingProfileData.shareToFeed ? 'translate-x-6' : 'translate-x-1'}` }) })] }), editingProfileData.shareToFeed && (_jsxs("div", { className: "flex items-center justify-between flex-1", children: [_jsx("label", { className: "text-sm font-medium text-white", children: "Allow Remix" }), _jsx("button", { onClick: () => setEditingProfileData(prev => ({ ...prev, allowRemix: !prev.allowRemix })), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingProfileData.allowRemix ? 'bg-white' : 'bg-white/20'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${editingProfileData.allowRemix ? 'translate-x-6' : 'translate-x-1'}` }) })] }))] }) }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: handleSaveProfile, disabled: isSaving, className: "w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center", children: isSaving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" }), "Saving..."] })) : ('Save Changes') }), _jsx("button", { onClick: () => setShowEditProfileModal(false), className: "w-full bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors border border-white/20", children: "Cancel" })] })] })] })), showDeleteAccountModal && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-sm", onClick: () => setShowDeleteAccountModal(false) }), _jsxs("div", { className: "relative bg-[#222222] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl", children: [_jsx("button", { onClick: () => setShowDeleteAccountModal(false), className: "absolute top-4 right-4 text-white/60 hover:text-white transition-colors", children: _jsx(X, { size: 24 }) }), _jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-red-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) }) }) }), _jsx("h1", { className: "text-xl font-bold text-white mb-2", children: "Delete Account" }), _jsx("p", { className: "text-white/60", children: "This action cannot be undone" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: handleDeleteAccount, className: "w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors", children: "Delete Account Permanently" }), _jsx("button", { onClick: () => setShowDeleteAccountModal(false), className: "w-full bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors border border-white/20", children: "Cancel" })] })] })] }))] }));
};
export default ProfileScreen;
