export type MediaType = 'image' | 'video';

export type FeedItem = {
  id: string;
  cloudinary_public_id: string;
  media_type: MediaType;
  published_at: string;
  preset_key: string | null;
  source_public_id: string | null;
};

export type UserMediaItem = {
  id: string;
  cloudinary_public_id: string;
  media_type: MediaType;
  is_public: boolean;
  created_at: string;
  preset_key: string | null;
  source_public_id: string | null;
};
