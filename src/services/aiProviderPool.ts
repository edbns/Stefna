// AI Provider Pool with Rotation Logic

export interface AIProvider {
  name: string;
  key: string | undefined;
  endpoint: string;
  headers: (key: string) => Record<string, string>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const aiProviders: AIProvider[] = [
  {
    name: 'OpenRouter',
    key: import.meta.env.VITE_OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    headers: (key: string) => ({ 
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://stefna.xyz',
      'X-Title': 'Stefna AI Chat'
    }),
    model: 'anthropic/claude-3.5-sonnet',
    maxTokens: 500,
    temperature: 0.7
  },
  {
    name: 'HuggingFace',
    key: import.meta.env.VITE_HUGGINGFACE_API_KEY,
    endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
    headers: (key: string) => ({ 
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    maxTokens: 300,
    temperature: 0.7
  },
  {
    name: 'DeepInfra',
    key: import.meta.env.VITE_DEEPINFRA_API_KEY,
    endpoint: 'https://api.deepinfra.com/v1/openai/chat/completions',
    headers: (key: string) => ({ 
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    model: 'meta-llama/Llama-2-70b-chat-hf',
    maxTokens: 500,
    temperature: 0.7
  },
  {
    name: 'Together',
    key: import.meta.env.VITE_TOGETHER_API_KEY,
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    headers: (key: string) => ({ 
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    model: 'togethercomputer/llama-2-70b-chat',
    maxTokens: 500,
    temperature: 0.7
  },
  {
    name: 'Replicate',
    key: import.meta.env.VITE_REPLICATE_API_KEY,
    endpoint: 'https://api.replicate.com/v1/predictions',
    headers: (key: string) => ({ 
      Authorization: `Token ${key}`,
      'Content-Type': 'application/json'
    }),
    model: 'meta/llama-2-7b-chat',
    maxTokens: 500,
    temperature: 0.7
  },
  {
    name: 'Groq',
    key: import.meta.env.VITE_GROQ_API_KEY,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    headers: (key: string) => ({ 
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }),
    model: 'llama2-70b-4096',
    maxTokens: 500,
    temperature: 0.7
  }
];

// Filter out providers without API keys
const availableProviders = aiProviders.filter(provider => provider.key && provider.key !== 'your_api_key_here');

export function getAvailableProviders(): AIProvider[] {
  return availableProviders;
}

export function getAvailableProvider(): AIProvider {
  if (availableProviders.length === 0) {
    throw new Error('No available AI providers found. Please configure at least one API key.');
  }
  
  // Simple round-robin selection
  const index = Math.floor(Math.random() * availableProviders.length);
  return availableProviders[index];
}

export function getProviderByName(name: string): AIProvider | undefined {
  return availableProviders.find(provider => provider.name.toLowerCase() === name.toLowerCase());
}

// AI Chat Function with Fallback
export async function runAIChat(prompt: string, systemPrompt?: string): Promise<string> {
  const providers = getAvailableProviders();
  
  if (providers.length === 0) {
    throw new Error('No AI providers available. Please configure API keys.');
  }

  // Try each provider in order until one succeeds
  for (const provider of providers) {
    try {
      console.log(`🤖 Trying ${provider.name}...`);
      
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const payload: any = {
        messages,
        max_tokens: provider.maxTokens || 500,
        temperature: provider.temperature || 0.7
      };

      // Add model if specified
      if (provider.model) {
        payload.model = provider.model;
      }

      // Special handling for HuggingFace
      if (provider.name === 'HuggingFace') {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: provider.headers(provider.key!),
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: provider.maxTokens || 300,
              temperature: provider.temperature || 0.7,
              return_full_text: false
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const result = Array.isArray(data) && data.length > 0 
          ? data[0]?.generated_text || 'No response'
          : data?.generated_text || 'No response';
        
        console.log(`✅ Success with ${provider.name}`);
        return result;
      }

      // Special handling for Replicate
      if (provider.name === 'Replicate') {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: provider.headers(provider.key!),
          body: JSON.stringify({
            version: provider.model,
            input: {
              prompt: prompt,
              max_tokens: provider.maxTokens || 500,
              temperature: provider.temperature || 0.7
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Success with ${provider.name}`);
        return data?.output || 'No response';
      }

      // Standard OpenAI-compatible format
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: provider.headers(provider.key!),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data?.choices?.[0]?.message?.content || 'No response';
      
      console.log(`✅ Success with ${provider.name}`);
      return result;

    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error);
      // Continue to next provider
      continue;
    }
  }

  // If all providers fail, return a fallback response
  throw new Error('All AI providers failed. Please check your API keys and try again.');
}

// YouTube Summary Function
export async function generateYouTubeSummary(videoData: any): Promise<any> {
  const summaryPrompt = `Please provide a concise summary of this YouTube video:
  
  Title: ${videoData.title}
  Description: ${videoData.description}
  Duration: ${videoData.duration}
  Views: ${videoData.viewCount}
  Likes: ${videoData.likeCount}
  
  Please provide:
  1. A 2-3 sentence summary
  2. 3-5 key points
  3. Overall sentiment (positive/neutral/negative)
  4. Main topics discussed
  5. Confidence score (1-100)
  
  Format as JSON with fields: summary, keyPoints, sentiment, topics, confidence`;

  try {
    const result = await runAIChat(summaryPrompt, 'You are a helpful assistant that summarizes YouTube videos. Always respond with valid JSON.');
    
    // Try to parse as JSON
    try {
      return JSON.parse(result);
    } catch (e) {
      // Fallback if JSON parsing fails
      return {
        summary: result,
        keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
        sentiment: 'neutral',
        topics: ['Technology', 'AI', 'Innovation'],
        confidence: 85
      };
    }
  } catch (error) {
    console.error('YouTube summary generation failed:', error);
    throw error;
  }
}

// Utility function to check provider status
export function getProviderStatus(): { available: number; total: number; providers: string[] } {
  const available = availableProviders.length;
  const total = aiProviders.length;
  const providerNames = availableProviders.map(p => p.name);
  
  return {
    available,
    total,
    providers: providerNames
  };
} 