interface AIProvider {
  name: string;
  apiKey: string;
  endpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
  headers: Record<string, string>;
  transformRequest: (prompt: string) => any;
  transformResponse: (response: any) => string;
}

interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class AIService {
  private providers: AIProvider[] = [];
  private failedProviders: Set<string> = new Set();
  private lastSuccessTime: Record<string, number> = {};

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenRouter
    if (import.meta.env.VITE_OPENROUTER_API_KEY) {
      this.providers.push({
        name: 'openrouter',
        apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'anthropic/claude-3.5-sonnet',
        maxTokens: 1000,
        temperature: 0.7,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SocialSpy Dashboard'
        },
        transformRequest: (prompt: string) => ({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for social media analytics. Provide concise, insightful responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
        transformResponse: (response: any) => response.choices?.[0]?.message?.content || 'No response'
      });
    }

    // Hugging Face
    if (import.meta.env.VITE_HUGGINGFACE_API_KEY) {
      this.providers.push({
        name: 'huggingface',
        apiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY,
        endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        model: 'microsoft/DialoGPT-medium',
        maxTokens: 500,
        temperature: 0.7,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformRequest: (prompt: string) => ({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            return_full_text: false
          }
        }),
        transformResponse: (response: any) => {
          if (Array.isArray(response) && response.length > 0) {
            return response[0]?.generated_text || 'No response';
          }
          return response?.generated_text || 'No response';
        }
      });
    }

    // DeepInfra
    if (import.meta.env.VITE_DEEPINFRA_API_KEY) {
      this.providers.push({
        name: 'deepinfra',
        apiKey: import.meta.env.VITE_DEEPINFRA_API_KEY,
        endpoint: 'https://api.deepinfra.com/v1/openai/chat/completions',
        model: 'meta-llama/Llama-2-70b-chat-hf',
        maxTokens: 1000,
        temperature: 0.7,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformRequest: (prompt: string) => ({
          model: 'meta-llama/Llama-2-70b-chat-hf',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for social media analytics. Provide concise, insightful responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
        transformResponse: (response: any) => response.choices?.[0]?.message?.content || 'No response'
      });
    }

    // Together AI
    if (import.meta.env.VITE_TOGETHER_API_KEY) {
      this.providers.push({
        name: 'together',
        apiKey: import.meta.env.VITE_TOGETHER_API_KEY,
        endpoint: 'https://api.together.xyz/v1/chat/completions',
        model: 'togethercomputer/llama-2-70b-chat',
        maxTokens: 1000,
        temperature: 0.7,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformRequest: (prompt: string) => ({
          model: 'togethercomputer/llama-2-70b-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for social media analytics. Provide concise, insightful responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
        transformResponse: (response: any) => response.choices?.[0]?.message?.content || 'No response'
      });
    }

    // Replicate
    if (import.meta.env.VITE_REPLICATE_API_KEY) {
      this.providers.push({
        name: 'replicate',
        apiKey: import.meta.env.VITE_REPLICATE_API_KEY,
        endpoint: 'https://api.replicate.com/v1/predictions',
        model: 'meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9093c369db0f1b1f5b9c2e',
        maxTokens: 1000,
        temperature: 0.7,
        headers: {
          'Authorization': `Token ${import.meta.env.VITE_REPLICATE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformRequest: (prompt: string) => ({
          version: '02e509c789964a7ea8736978a43525956ef40397be9093c369db0f1b1f5b9c2e',
          input: {
            prompt: prompt,
            max_new_tokens: 1000,
            temperature: 0.7,
            top_p: 0.9
          }
        }),
        transformResponse: async (response: any) => {
          // Replicate returns a prediction ID, we need to poll for results
          if (response.id) {
            return await this.pollReplicateResult(response.id);
          }
          return 'No response';
        }
      });
    }

    // Groq
    if (import.meta.env.VITE_GROQ_API_KEY) {
      this.providers.push({
        name: 'groq',
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama2-70b-4096',
        maxTokens: 1000,
        temperature: 0.7,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformRequest: (prompt: string) => ({
          model: 'llama2-70b-4096',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for social media analytics. Provide concise, insightful responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
        transformResponse: (response: any) => response.choices?.[0]?.message?.content || 'No response'
      });
    }

    console.log(`AIService initialized with ${this.providers.length} providers:`, this.providers.map(p => p.name));
  }

  private async pollReplicateResult(predictionId: string): Promise<string> {
    const maxAttempts = 30;
    const delay = 1000; // 1 second

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: {
            'Authorization': `Token ${import.meta.env.VITE_REPLICATE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (result.status === 'succeeded') {
          return Array.isArray(result.output) ? result.output.join('') : result.output || 'No response';
        } else if (result.status === 'failed') {
          throw new Error('Replicate prediction failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error('Error polling Replicate result:', error);
        throw error;
      }
    }

    throw new Error('Replicate prediction timed out');
  }

  private async callProvider(provider: AIProvider, prompt: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const requestBody = provider.transformRequest(prompt);
      
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: provider.headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = await provider.transformResponse(data);

      // Mark as successful
      this.lastSuccessTime[provider.name] = Date.now();
      this.failedProviders.delete(provider.name);

      return {
        content,
        provider: provider.name,
        model: provider.model,
        usage: data.usage
      };
    } catch (error) {
      console.error(`Error calling ${provider.name}:`, error);
      
      // Mark as failed (will be skipped for 5 minutes)
      this.failedProviders.add(provider.name);
      
      throw error;
    }
  }

  private getAvailableProviders(): AIProvider[] {
    const now = Date.now();
    const retryDelay = 5 * 60 * 1000; // 5 minutes

    return this.providers.filter(provider => {
      // Skip if recently failed
      if (this.failedProviders.has(provider.name)) {
        const lastFailure = this.lastSuccessTime[provider.name] || 0;
        if (now - lastFailure < retryDelay) {
          return false;
        }
        // Retry after delay
        this.failedProviders.delete(provider.name);
      }
      return true;
    });
  }

  async getAIResponse(prompt: string): Promise<AIResponse> {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers available. All providers are temporarily unavailable.');
    }

    // Try each provider in order
    for (const provider of availableProviders) {
      try {
        console.log(`Trying ${provider.name}...`);
        const result = await this.callProvider(provider, prompt);
        console.log(`Success with ${provider.name}`);
        return result;
      } catch (error) {
        console.warn(`${provider.name} failed:`, error);
        // Continue to next provider
      }
    }

    // If all providers failed, throw error
    throw new Error('All AI providers failed. Please try again later.');
  }

  // Utility method to get provider status
  getProviderStatus(): Record<string, { available: boolean; lastSuccess?: number }> {
    const now = Date.now();
    const retryDelay = 5 * 60 * 1000; // 5 minutes

    return this.providers.reduce((status, provider) => {
      const isFailed = this.failedProviders.has(provider.name);
      const lastSuccess = this.lastSuccessTime[provider.name];
      const available = !isFailed || (lastSuccess && (now - lastSuccess) >= retryDelay);

      status[provider.name] = {
        available,
        lastSuccess
      };

      return status;
    }, {} as Record<string, { available: boolean; lastSuccess?: number }>);
  }

  // Reset failed providers (useful for testing)
  resetFailedProviders(): void {
    this.failedProviders.clear();
  }
}

// Create singleton instance
const aiService = new AIService();

// Export the main function and service instance
export const getAIResponse = (prompt: string) => aiService.getAIResponse(prompt);
export const getProviderStatus = () => aiService.getProviderStatus();
export const resetFailedProviders = () => aiService.resetFailedProviders();

export default aiService; 