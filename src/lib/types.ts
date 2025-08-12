export type MediaType = 'image' | 'video';

export type Asset = {
  id: string;
  user_id: string;
  cloudinary_public_id: string;
  media_type: MediaType;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  is_public: boolean;
  allow_remix: boolean;
  published_at: string | null;
  source_asset_id: string | null;
  preset_key: string | null;
  prompt: string | null;
  created_at: string;
};

export type CreateAssetInput = {
  sourcePublicId: string;   // Cloudinary public ID of the source media
  mediaType: MediaType;
  presetKey?: string | null;
  prompt?: string | null;
  sourceAssetId?: string | null; // if remixing from an existing asset
};

export type ProcessAssetPayload = {
  assetId: string;
  sourcePublicId: string;
  mediaType: MediaType;
  presetKey?: string | null;
  prompt?: string | null;
};

export type PublishAssetInput = {
  assetId: string;
  isPublic: boolean;
  allowRemix: boolean;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
