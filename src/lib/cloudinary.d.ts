export interface CloudinaryUploadResult {
  resource_type: 'image' | 'video';
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  bytes?: number;
  duration?: number;
  folder?: string;
  id?: string; // DB record ID
}

export interface I2IResult {
  image_url: string;
  result_url: string;
  source_url: string;
  original_asset: CloudinaryUploadResult;
  echo?: {
    userId: string;
    mode: string;
    model: string;
    strength?: number;
    size?: string;
    presetName?: string;
    jobId?: string;
    source?: string;
  };
}

export interface V2VResult {
  video_url?: string;
  job_id?: string;
  status?: string;
  original_asset: CloudinaryUploadResult;
}

export interface UploadOptions {
  token?: string;
  public_id?: string;
}

export interface GenerationOptions {
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  negative_prompt?: string;
  strength?: number;
  token?: string;
  public_id?: string;
}

export interface AssetListOptions {
  token?: string;
  limit?: number;
}

export interface DeleteOptions {
  token?: string;
}

export interface UserAsset {
  id: string;
  url: string;
  resource_type: 'image' | 'video';
  created_at: string;
  public_id: string;
  width?: number;
  height?: number;
  duration?: number;
  meta?: any;
}

export declare function uploadToCloudinary(file: File, opts?: UploadOptions): Promise<CloudinaryUploadResult>;
export declare function listUserAssets(opts?: AssetListOptions): Promise<UserAsset[]>;
export declare function deleteAsset(assetId: string, opts?: DeleteOptions): Promise<{ ok: boolean }>;
export declare function purgeUserAssets(opts?: DeleteOptions): Promise<{ ok: boolean; deleted_assets: number; message: string }>;

// High-res preset functions
export declare function runPresetI2I(asset: CloudinaryUploadResult, presetName: string, opts?: GenerationOptions): Promise<I2IResult>;
export declare function runPresetV2V(asset: CloudinaryUploadResult, presetName: string, fpsActual: number, opts?: GenerationOptions): Promise<V2VResult>;

// Legacy functions for backward compatibility
export declare function runI2I(file: File, prompt: string, opts?: GenerationOptions): Promise<I2IResult>;
export declare function runV2V(file: File, prompt: string, opts?: GenerationOptions): Promise<V2VResult>;
