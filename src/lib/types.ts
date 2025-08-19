export type MediaType = 'image' | 'video';
export type Mode = 'i2i'|'txt2img'|'restore'|'story';

export type MediaRecord = {
  id: string;
  ownerUserId: string;
  parentId?: string;               // if this is a remix, points to original media
  createdAt: string;
  // remixCount removed - no more remix functionality
  meta: {
    presetId: string;              // Preset['id']
    mode: Mode;                    // 'i2i' | 'txt2img' | 'restore' | 'story'
    group?: 'story'|'time_machine'|'restore'|null;
    optionKey?: string | null;     // e.g. 'vhs_1980s', 'four_seasons/spring', 'colorize_bw'
    storyKey?: string | null;      // e.g. 'four_seasons'
    storyLabel?: string | null;    // e.g. 'Spring'
  };
};

export type Asset = {
  id: string;
  user_id: string;
  cloudinary_public_id: string | null;
  media_type: MediaType | null;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  is_public: boolean;
  // allow_remix removed
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
  // allowRemix removed
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
