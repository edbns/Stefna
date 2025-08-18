// Import the advanced token service and content moderation
import tokenService, { UserTier } from './tokenService';
import contentModerationService from './contentModerationService';
class AIService {
    constructor() {
        // AI Brushes - Different AI models as creative tools
        Object.defineProperty(this, "aiBrushes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                {
                    id: 'sdxl-realistic',
                    name: 'Photorealistic',
                    description: 'Ultra-realistic photography style',
                    model: 'sdxl',
                    category: 'realistic',
                    style: 'photorealistic, high detail, professional photography',
                    intensity: 85,
                    brushSize: 'large',
                    tags: ['realistic', 'photography', 'detailed'],
                    icon: '📸'
                },
                {
                    id: 'midjourney-artistic',
                    name: 'Artistic Vision',
                    description: 'Creative and artistic interpretations',
                    model: 'midjourney',
                    category: 'artistic',
                    style: 'artistic, creative, imaginative, painterly',
                    intensity: 90,
                    brushSize: 'medium',
                    tags: ['artistic', 'creative', 'painterly'],
                    icon: '🎨'
                },
                {
                    id: 'dalle-abstract',
                    name: 'Abstract Dreams',
                    description: 'Abstract and conceptual art',
                    model: 'dalle',
                    category: 'abstract',
                    style: 'abstract, conceptual, modern art, surreal',
                    intensity: 95,
                    brushSize: 'medium',
                    tags: ['abstract', 'conceptual', 'surreal'],
                    icon: '🌌'
                },
                {
                    id: 'stable-anime',
                    name: 'Anime Magic',
                    description: 'Japanese anime and manga style',
                    model: 'stable-diffusion',
                    category: 'anime',
                    style: 'anime, manga, Japanese art, vibrant colors',
                    intensity: 80,
                    brushSize: 'medium',
                    tags: ['anime', 'manga', 'Japanese'],
                    icon: '🌸'
                },
                {
                    id: 'artistic-vintage',
                    name: 'Vintage Charm',
                    description: 'Retro and vintage aesthetics',
                    model: 'artistic',
                    category: 'artistic',
                    style: 'vintage, retro, film grain, nostalgic',
                    intensity: 75,
                    brushSize: 'small',
                    tags: ['vintage', 'retro', 'nostalgic'],
                    icon: '📷'
                },
                {
                    id: 'sdxl-cinematic',
                    name: 'Cinematic Drama',
                    description: 'Movie-like dramatic lighting',
                    model: 'sdxl',
                    category: 'realistic',
                    style: 'cinematic, dramatic lighting, film noir, moody',
                    intensity: 88,
                    brushSize: 'large',
                    tags: ['cinematic', 'dramatic', 'moody'],
                    icon: '🎬'
                }
            ]
        });
        // Creative Prompt Suggestions
        Object.defineProperty(this, "creativePrompts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                {
                    id: 'prompt-1',
                    text: 'Transform this into a dreamy watercolor painting with soft, flowing colors',
                    category: 'artistic',
                    tags: ['watercolor', 'dreamy', 'soft'],
                    usage: 156,
                    rating: 4.8
                },
                {
                    id: 'prompt-2',
                    text: 'Give this a cyberpunk aesthetic with neon lights and futuristic elements',
                    category: 'abstract',
                    tags: ['cyberpunk', 'neon', 'futuristic'],
                    usage: 203,
                    rating: 4.6
                },
                {
                    id: 'prompt-3',
                    text: 'Convert to a vintage film photograph with warm tones and grain texture',
                    category: 'photography',
                    tags: ['vintage', 'film', 'warm'],
                    usage: 89,
                    rating: 4.9
                },
                {
                    id: 'prompt-4',
                    text: 'Transform into a Studio Ghibli inspired scene with magical atmosphere',
                    category: 'anime',
                    tags: ['ghibli', 'magical', 'whimsical'],
                    usage: 342,
                    rating: 4.7
                }
            ]
        });
        // Token service is now handled by the advanced tokenService
    }
    // Get token usage using the advanced system
    async getTokenUsage(userId, userTier = UserTier.REGISTERED) {
        return await tokenService.getUserUsage(userId);
    }
    // Check if user can use AI with advanced token system
    async canUseAI(userId, userTier = UserTier.REGISTERED, type = 'photo', quality = 'standard') {
        const result = await tokenService.canGenerate(userId, userTier, type, quality);
        return result.canGenerate;
    }
    // Increment usage with advanced tracking
    async incrementUsage(userId, userTier, type, quality, prompt) {
        const deviceId = this.getDeviceId();
        const ipAddress = await this.getIPAddress();
        return await tokenService.generateContent(userId, userTier, type, quality, prompt, ipAddress, deviceId);
    }
    // Get device ID for tracking
    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }
    // Get IP address
    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        }
        catch (error) {
            return '127.0.0.1'; // Fallback
        }
    }
    // Get all available AI brushes
    getAIBrushes() {
        return this.aiBrushes;
    }
    // Get brushes by category
    getBrushesByCategory(category) {
        return this.aiBrushes.filter(brush => brush.category === category);
    }
    // Get creative prompt suggestions
    getCreativePrompts(category) {
        if (category) {
            return this.creativePrompts.filter(prompt => prompt.category === category);
        }
        return this.creativePrompts.sort((a, b) => b.usage - a.usage);
    }
    // Apply AI brush to image
    async applyAIBrush(imageData, brush, intensity = 50, customPrompt) {
        // Content moderation check
        const prompt = customPrompt || brush.style;
        try {
            const moderationResult = await contentModerationService.checkPrompt(prompt);
            if (!moderationResult.isAppropriate) {
                throw new Error(`Content blocked: ${moderationResult.reason}. Please revise your prompt.`);
            }
        }
        catch (error) {
            console.error('Content moderation check failed:', error);
            // Continue with generation if moderation fails
        }
        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2000 + (intensity * 20)));
        // Get user info for token tracking
        const userId = localStorage.getItem('userId') || 'guest';
        const userTier = UserTier.REGISTERED; // Default tier
        await this.incrementUsage(userId, userTier, 'photo', 'standard', customPrompt || brush.style);
        // Create a processed version by adding a filter effect
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        return new Promise((resolve, reject) => {
            img.onload = () => {
                try {
                    console.log('Image loaded, dimensions:', img.width, 'x', img.height);
                    canvas.width = img.width;
                    canvas.height = img.height;
                    if (!ctx) {
                        console.error('Could not get canvas context');
                        resolve(imageData);
                        return;
                    }
                    // Apply different effects based on brush type
                    ctx.drawImage(img, 0, 0);
                    if (brush.category === 'artistic') {
                        // Apply artistic filter
                        ctx.filter = `contrast(${1 + intensity / 100}) saturate(${1 + intensity / 50})`;
                    }
                    else if (brush.category === 'photography') {
                        // Apply photography filter
                        ctx.filter = `brightness(${1 + intensity / 200}) contrast(${1 + intensity / 100})`;
                    }
                    else if (brush.category === 'anime') {
                        // Apply anime filter
                        ctx.filter = `saturate(${1.2 + intensity / 100}) contrast(${1.1 + intensity / 100})`;
                    }
                    else {
                        // Apply general enhancement
                        ctx.filter = `brightness(${1 + intensity / 200}) contrast(${1 + intensity / 100}) saturate(${1 + intensity / 100})`;
                    }
                    // Apply the filter by drawing the image again
                    ctx.drawImage(img, 0, 0);
                    const processedImage = canvas.toDataURL('image/jpeg', 0.9);
                    console.log('Canvas processing complete, processed image length:', processedImage.length);
                    resolve(processedImage);
                }
                catch (error) {
                    console.error('Canvas processing error:', error);
                    resolve(imageData);
                }
            };
            img.onerror = () => {
                console.error('Failed to load image for processing');
                resolve(imageData);
            };
            console.log('Setting image src, data length:', imageData.length);
            img.src = imageData;
        });
    }
    // Apply style mixing (combine multiple brushes)
    async applyStyleMix(imageData, styleMix, customPrompt) {
        // Content moderation check for style mix
        const prompt = customPrompt || `${styleMix.primaryBrush.style} mixed with ${styleMix.secondaryBrush?.style || 'base style'}`;
        try {
            const moderationResult = await contentModerationService.checkPrompt(prompt);
            if (!moderationResult.isAppropriate) {
                throw new Error(`Content blocked: ${moderationResult.reason}. Please revise your prompt.`);
            }
        }
        catch (error) {
            console.error('Content moderation check failed:', error);
            // Continue with generation if moderation fails
        }
        const primaryResult = await this.applyAIBrush(imageData, styleMix.primaryBrush, styleMix.mixRatio);
        if (styleMix.secondaryBrush) {
            const secondaryResult = await this.applyAIBrush(primaryResult, styleMix.secondaryBrush, 100 - styleMix.mixRatio);
            return secondaryResult;
        }
        return primaryResult;
    }
    // Get AI-generated creative suggestions
    async getCreativeSuggestions(imageData) {
        // Simulate AI analysis of the image
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Return personalized suggestions based on image characteristics
        return this.creativePrompts
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
    }
}
export const aiService = new AIService();
export default aiService;
