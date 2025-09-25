// Resource ownership validation utilities
// Ensures users can only access their own data

import { qOne } from './_db';

/**
 * Verify that a user owns a specific media item
 * @param userId - The authenticated user's ID
 * @param mediaId - The media item ID to check
 * @param mediaType - The type of media (cyber_siren, ghibli_reaction, etc.)
 * @returns Promise<boolean> - true if user owns the media, false otherwise
 */
export async function verifyMediaOwnership(
  userId: string, 
  mediaId: string, 
  mediaType: string
): Promise<boolean> {
  try {
    let tableName: string;
    
    switch (mediaType) {
      case 'cyber_siren':
        tableName = 'cyber_siren_media';
        break;
      case 'ghibli_reaction':
        tableName = 'ghibli_reaction_media';
        break;
      case 'unreal_reflection':
        tableName = 'unreal_reflection_media';
        break;
      case 'presets':
        tableName = 'presets_media';
        break;
      case 'custom_prompt':
        tableName = 'custom_prompt_media';
        break;
      case 'story':
        tableName = 'story';
        break;
      case 'edit':
        tableName = 'edit_media';
        break;
      default:
        console.error('❌ [Ownership] Unknown media type:', mediaType);
        return false;
    }

    const result = await qOne(`
      SELECT user_id FROM ${tableName} WHERE id = $1
    `, [mediaId]);

    if (!result) {
      console.log('❌ [Ownership] Media not found:', { mediaId, mediaType });
      return false;
    }

    const isOwner = result.user_id === userId;
    if (!isOwner) {
      console.log('❌ [Ownership] User does not own media:', { 
        userId, 
        mediaId, 
        mediaType, 
        ownerId: result.user_id 
      });
    }

    return isOwner;
  } catch (error) {
    console.error('❌ [Ownership] Error verifying media ownership:', error);
    return false;
  }
}

/**
 * Verify that a user owns a specific story
 * @param userId - The authenticated user's ID
 * @param storyId - The story ID to check
 * @returns Promise<boolean> - true if user owns the story, false otherwise
 */
export async function verifyStoryOwnership(userId: string, storyId: string): Promise<boolean> {
  try {
    const result = await qOne(`
      SELECT user_id FROM story WHERE id = $1
    `, [storyId]);

    if (!result) {
      console.log('❌ [Ownership] Story not found:', storyId);
      return false;
    }

    const isOwner = result.user_id === userId;
    if (!isOwner) {
      console.log('❌ [Ownership] User does not own story:', { 
        userId, 
        storyId, 
        ownerId: result.user_id 
      });
    }

    return isOwner;
  } catch (error) {
    console.error('❌ [Ownership] Error verifying story ownership:', error);
    return false;
  }
}

/**
 * Verify that a user owns a specific draft
 * @param userId - The authenticated user's ID
 * @param draftId - The draft ID to check
 * @returns Promise<boolean> - true if user owns the draft, false otherwise
 */
export async function verifyDraftOwnership(userId: string, draftId: string): Promise<boolean> {
  try {
    const result = await qOne(`
      SELECT user_id FROM drafts WHERE id = $1
    `, [draftId]);

    if (!result) {
      console.log('❌ [Ownership] Draft not found:', draftId);
      return false;
    }

    const isOwner = result.user_id === userId;
    if (!isOwner) {
      console.log('❌ [Ownership] User does not own draft:', { 
        userId, 
        draftId, 
        ownerId: result.user_id 
      });
    }

    return isOwner;
  } catch (error) {
    console.error('❌ [Ownership] Error verifying draft ownership:', error);
    return false;
  }
}

/**
 * Verify that a user can access their own profile data
 * @param userId - The authenticated user's ID
 * @param targetUserId - The user ID being accessed
 * @returns boolean - true if user is accessing their own data, false otherwise
 */
export function verifyUserOwnership(userId: string, targetUserId: string): boolean {
  const isOwner = userId === targetUserId;
  if (!isOwner) {
    console.log('❌ [Ownership] User cannot access other user data:', { 
      userId, 
      targetUserId 
    });
  }
  return isOwner;
}

/**
 * Middleware function to verify resource ownership
 * @param resourceType - Type of resource (media, story, draft, user)
 * @param resourceIdParam - Parameter name containing the resource ID
 * @returns Middleware function
 */
export function requireResourceOwnership(resourceType: string, resourceIdParam: string = 'id') {
  return async (event: any, userId: string) => {
    const resourceId = event.queryStringParameters?.[resourceIdParam] || 
                      JSON.parse(event.body || '{}')?.[resourceIdParam];
    
    if (!resourceId) {
      throw new Error(`Missing ${resourceIdParam} parameter`);
    }

    let isOwner = false;
    
    switch (resourceType) {
      case 'media':
        const mediaType = event.queryStringParameters?.type || 
                         JSON.parse(event.body || '{}')?.type;
        if (!mediaType) {
          throw new Error('Missing media type parameter');
        }
        isOwner = await verifyMediaOwnership(userId, resourceId, mediaType);
        break;
      case 'story':
        isOwner = await verifyStoryOwnership(userId, resourceId);
        break;
      case 'draft':
        isOwner = await verifyDraftOwnership(userId, resourceId);
        break;
      case 'user':
        isOwner = verifyUserOwnership(userId, resourceId);
        break;
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    if (!isOwner) {
      throw new Error('Unauthorized: You do not have access to this resource');
    }

    return { resourceId, isOwner };
  };
}
