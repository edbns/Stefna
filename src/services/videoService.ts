/// <reference types="vite/client" />

export interface VideoData {
  id: string;
  url: string;
  thumbnail: string;
  duration: number;
  width: number;
  height: number;
  originalPrompt?: string;
  aiStyle?: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface VideoEffect {
  id: string;
  name: string;
  description: string;
  category: 'artistic' | 'cinematic' | 'viral' | 'abstract';
  preview: string;
  aiModel: string;
  processingTime: number;
}

export interface VideoProcessingResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  processingTime: number;
  tokensUsed: number;
}

class VideoService {
  private videoStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Video Capture Methods
  async startVideoCapture(): Promise<MediaStream> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1080 },
          height: { ideal: 1920 }, // Vertical for TikTok-style
          facingMode: 'user'
        },
        audio: true
      });
      return this.videoStream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('Camera access denied');
    }
  }

  stopVideoCapture(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  // Video Recording
  startRecording(): void {
    if (!this.videoStream) {
      throw new Error('No video stream available');
    }

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.videoStream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        resolve(videoBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Video Upload
  async uploadVideo(file: File): Promise<VideoData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const videoUrl = e.target?.result as string;
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          const videoData: VideoData = {
            id: `video_${Date.now()}`,
            url: videoUrl,
            thumbnail: this.generateThumbnail(video),
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            createdAt: new Date()
          };
          resolve(videoData);
        };
        video.src = videoUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read video file'));
      reader.readAsDataURL(file);
    });
  }

  private generateThumbnail(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  // AI Video Effects
  async applyVideoEffect(videoData: VideoData, effect: VideoEffect, prompt?: string): Promise<VideoProcessingResult> {
    try {
      // Simulate AI video processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      const processedVideoUrl = videoData.url; // In real implementation, this would be the AI-processed video
      const processedThumbnail = videoData.thumbnail; // AI-processed thumbnail

      return {
        success: true,
        videoUrl: processedVideoUrl,
        thumbnailUrl: processedThumbnail,
        processingTime: 3000,
        tokensUsed: 5
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: 0,
        tokensUsed: 0
      };
    }
  }

  // Video Effects Library
  getVideoEffects(): VideoEffect[] {
    return [
      {
        id: 'cinematic',
        name: 'Cinematic',
        description: 'Hollywood-style cinematic look',
        category: 'cinematic',
        preview: '/effects/cinematic.jpg',
        aiModel: 'stable-video-diffusion',
        processingTime: 3000
      },
      {
        id: 'viral',
        name: 'Viral',
        description: 'TikTok-style viral aesthetic',
        category: 'viral',
        preview: '/effects/viral.jpg',
        aiModel: 'pika-labs',
        processingTime: 2500
      },
      {
        id: 'artistic',
        name: 'Artistic',
        description: 'AI-generated artistic style',
        category: 'artistic',
        preview: '/effects/artistic.jpg',
        aiModel: 'runway-ml',
        processingTime: 4000
      },
      {
        id: 'abstract',
        name: 'Abstract',
        description: 'Abstract AI video transformation',
        category: 'abstract',
        preview: '/effects/abstract.jpg',
        aiModel: 'animate-diff',
        processingTime: 3500
      }
    ];
  }

  // Video Feed Methods
  async getVideoFeed(): Promise<VideoData[]> {
    // Mock video feed data
    return [
      {
        id: '1',
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        thumbnail: 'https://picsum.photos/400/600',
        duration: 15,
        width: 1080,
        height: 1920,
        originalPrompt: 'Cinematic sunset vibes',
        aiStyle: 'cinematic',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        user: {
          id: 'user1',
          name: 'CreativeAI',
          avatar: 'https://picsum.photos/50/50'
        }
      },
      {
        id: '2',
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        thumbnail: 'https://picsum.photos/400/600',
        duration: 30,
        width: 1080,
        height: 1920,
        originalPrompt: 'Viral dance challenge',
        aiStyle: 'viral',
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
        user: {
          id: 'user2',
          name: 'VideoArtist',
          avatar: 'https://picsum.photos/50/50'
        }
      }
    ];
  }

  // Social Sharing
  async shareToSocial(videoData: VideoData, platform: 'tiktok' | 'instagram' | 'youtube' | 'snapchat'): Promise<boolean> {
    // Mock social sharing
    console.log(`Sharing video ${videoData.id} to ${platform}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  // Video Analytics
  getVideoStats(videoId: string): { views: number; likes: number; shares: number } {
    return {
      views: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 1000),
      shares: Math.floor(Math.random() * 500)
    };
  }
}

export const videoService = new VideoService(); 