// src/services/media.ts
import { supabaseClient as supabase } from '../lib/supabaseClient';
import type { Profile } from './profile';

export interface MediaItem {
  id: string;
  owner_id: string;
  url: string;
  prompt?: string;
  type: 'image' | 'video';
  visibility: 'public' | 'private';
  allow_remix: boolean;
  created_at: string;
  updated_at: string;
  likes?: number;
  remix_count?: number;
  // Profile data attached for UI
  owner_profile?: Profile;
}

/**
 * Get current user's media with profile information attached
 */
export async function getMyMediaWithProfile(): Promise<MediaItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  // 1) Get my profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, share_to_feed, allow_remix')
    .eq('id', user.id)
    .single();

  // 2) Get my media (adjust table name to match your schema)
  const { data: media, error } = await supabase
    .from('media_assets') // or whatever your media table is called
    .select('*')
    .eq('user_id', user.id) // adjust field name to match your schema
    .order('created_at', { ascending: false });

  if (error) throw error;

  // 3) Attach profile for UI
  return (media ?? []).map(m => ({ 
    ...m, 
    owner_profile: profile,
    owner_id: user.id
  }));
}

/**
 * Get public media feed with profile information for each item
 */
export async function getPublicMediaWithProfiles(limit: number = 50): Promise<MediaItem[]> {
  // Get public media with user profiles joined
  const { data: media, error } = await supabase
    .from('media_assets')
    .select(`
      *,
      profiles!inner(
        username,
        avatar_url,
        share_to_feed,
        allow_remix
      )
    `)
    .eq('visibility', 'public')
    .eq('profiles.share_to_feed', true) // Only show media from users who share to feed
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Transform to include owner_profile
  return (media ?? []).map(item => ({
    ...item,
    owner_profile: item.profiles,
    owner_id: item.user_id
  }));
}

/**
 * Get media by specific user with their profile
 */
export async function getUserMediaWithProfile(userId: string): Promise<MediaItem[]> {
  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, share_to_feed, allow_remix')
    .eq('id', userId)
    .single();

  // Get their public media
  const { data: media, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('user_id', userId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Attach profile
  return (media ?? []).map(m => ({ 
    ...m, 
    owner_profile: profile,
    owner_id: userId
  }));
}

/**
 * Like/unlike a media item
 */
export async function toggleMediaLike(mediaId: string): Promise<{ liked: boolean; likeCount: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('media_likes') // assuming you have a likes table
    .select('id')
    .eq('media_id', mediaId)
    .eq('user_id', user.id)
    .single();

  if (existingLike) {
    // Unlike
    await supabase
      .from('media_likes')
      .delete()
      .eq('media_id', mediaId)
      .eq('user_id', user.id);
  } else {
    // Like
    await supabase
      .from('media_likes')
      .insert({
        media_id: mediaId,
        user_id: user.id
      });
  }

  // Get updated like count
  const { count } = await supabase
    .from('media_likes')
    .select('*', { count: 'exact', head: true })
    .eq('media_id', mediaId);

  return {
    liked: !existingLike,
    likeCount: count || 0
  };
}

/**
 * Update media sharing preferences
 */
export async function updateMediaSharing(
  mediaId: string, 
  visibility: 'public' | 'private', 
  allowRemix: boolean
): Promise<MediaItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('media_assets')
    .update({
      visibility,
      allow_remix: allowRemix
    })
    .eq('id', mediaId)
    .eq('user_id', user.id) // Ensure user owns the media
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete media item
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('media_assets')
    .delete()
    .eq('id', mediaId)
    .eq('user_id', user.id); // Ensure user owns the media

  if (error) throw error;
}

/**
 * Create/remix media item
 */
export async function createMediaItem(mediaData: {
  url: string;
  prompt?: string;
  type: 'image' | 'video';
  visibility?: 'public' | 'private';
  allow_remix?: boolean;
  parent_media_id?: string; // For remixes
}): Promise<MediaItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      user_id: user.id,
      url: mediaData.url,
      prompt: mediaData.prompt,
      type: mediaData.type,
      visibility: mediaData.visibility || 'private',
      allow_remix: mediaData.allow_remix || false,
      parent_asset_id: mediaData.parent_media_id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
