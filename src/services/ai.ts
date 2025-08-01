import { ProcessingJob, AIFilter } from '../types';

// Demo AI filters - in production, these would come from your backend
export const presetFilters: AIFilter[] = [
  {
    id: 'ghibli',
    name: 'Studio Ghibli',
    prompt: 'in the style of studio ghibli, anime, hand-drawn, cel shading, beautiful, artistic',
    description: 'Transform your photo into a Studio Ghibli-style artwork',
    category: 'anime',
    isPopular: true
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    prompt: 'cyberpunk style, neon lights, futuristic, digital art, synthwave aesthetic',
    description: 'Give your photo a futuristic cyberpunk look',
    category: 'futuristic'
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    prompt: 'oil painting, classical art style, renaissance, detailed brushstrokes, artistic',
    description: 'Transform into a classical oil painting',
    category: 'artistic'
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    prompt: 'watercolor painting, soft colors, artistic, hand-painted, gentle brushstrokes',
    description: 'Create a beautiful watercolor effect',
    category: 'artistic'
  },
  {
    id: 'cartoon',
    name: 'Cartoon',
    prompt: 'cartoon style, animated, colorful, stylized, fun and playful',
    description: 'Turn your photo into a fun cartoon',
    category: 'fun',
    isPopular: true
  }
];

export interface AIServiceConfig {
  apiKey?: string;
  baseUrl?: string;
}

class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      baseUrl: 'https://api.replicate.com/v1',
      ...config
    };
  }

  // Simulate AI processing with demo responses
  async processImage(imageDataUrl: string, prompt: string): Promise<ProcessingJob> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ProcessingJob = {
      id: jobId,
      status: 'pending',
      originalImageUrl: imageDataUrl,
      prompt,
      createdAt: new Date()
    };

    // Simulate processing time
    setTimeout(() => this.simulateProcessing(job), 1000);
    
    return job;
  }

  private async simulateProcessing(job: ProcessingJob) {
    // In a real app, this would poll the Replicate API
    // For demo purposes, we'll simulate the processing
    
    const updateProgress = (progress: number, status: ProcessingJob['status'] = 'processing') => {
      job.progress = progress;
      job.status = status;
      // In a real app, you'd update the UI through a callback or state management
    };

    updateProgress(25);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    updateProgress(50);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    updateProgress(75);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, we'll return the original image with a filter overlay effect
    // In production, this would be the actual AI-processed result
    job.resultUrl = this.createDemoFilteredImage(job.originalImageUrl);
    job.status = 'completed';
    job.progress = 100;
  }

  private createDemoFilteredImage(originalDataUrl: string): string {
    // Create a simple filter effect for demo purposes
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise<string>((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Apply a simple color filter for demo
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(138, 43, 226, 0.1)'; // Purple overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = originalDataUrl;
    }) as unknown as string;
  }

  // Real Replicate API integration (commented out for demo)
  /*
  async processImageWithReplicate(imageDataUrl: string, prompt: string): Promise<ProcessingJob> {
    if (!this.config.apiKey) {
      throw new Error('Replicate API key not configured');
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create prediction
      const prediction = await fetch(`${this.config.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.config.apiKey}`
        },
        body: JSON.stringify({
          version: "your-model-version-here", // e.g., SDXL model version
          input: {
            image: imageDataUrl,
            prompt: prompt,
            num_inference_steps: 20,
            guidance_scale: 7.5
          }
        })
      });

      const result = await prediction.json();
      
      return {
        id: jobId,
        status: 'pending',
        originalImageUrl: imageDataUrl,
        prompt,
        createdAt: new Date(),
        // Store prediction ID for polling
        replicateId: result.id
      };
    } catch (error) {
      throw new Error(`Failed to start AI processing: ${error.message}`);
    }
  }

  async checkJobStatus(job: ProcessingJob): Promise<ProcessingJob> {
    if (!job.replicateId) return job;

    try {
      const response = await fetch(`${this.config.baseUrl}/predictions/${job.replicateId}`, {
        headers: {
          'Authorization': `Token ${this.config.apiKey}`
        }
      });

      const result = await response.json();
      
      return {
        ...job,
        status: result.status === 'succeeded' ? 'completed' : 
                result.status === 'failed' ? 'failed' : 'processing',
        resultUrl: result.output?.[0],
        error: result.error
      };
    } catch (error) {
      return {
        ...job,
        status: 'failed',
        error: error.message
      };
    }
  }
  */
}

export const aiService = new AIService();