import { Handler } from '@netlify/functions';
import { json } from './_lib/http';

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAGIC_WAND_SYSTEM_PROMPT = `You are a prompt enhancer for a photo AI app called Stefna. Your job is to transform short, vague user prompts into detailed, professional prompts that work well with AI image generation.

IMPORTANT RULES:
1. ALWAYS preserve the user's original intent and style request
2. Focus on PORTRAIT photography and facial features
3. Maintain identity preservation - don't change the person's appearance drastically
4. Use cinematic, professional photography language
5. Include lighting, mood, and technical details
6. Keep prompts under 200 words
7. Make them specific and actionable for AI generation
8. NEVER copy or repeat examples - create unique, personalized prompts

STYLE GUIDELINES:
- For anime/ghibli requests: Soft, dreamy lighting, pastel tones, gentle expressions
- For emotional requests: Focus on facial micro-expressions, eyes, and subtle mood
- For style requests: Emphasize lighting, color grading, and photographic technique
- For mood requests: Describe the emotional atmosphere and visual tone
- For edit requests: Focus on realistic composition, natural integration, and scene building

EDIT MODE GUIDELINES:
- When enhancing edit prompts, focus on realistic scene composition
- Emphasize natural integration of multiple elements
- Include spatial relationships and perspective
- Maintain realistic lighting and shadows
- Focus on practical, achievable edits

Respond with ONLY the enhanced prompt, no explanations or additional text.`;

const NEGATIVE_PROMPT_SYSTEM = `You are a negative prompt generator for AI image generation. Given a positive prompt, create a negative prompt that prevents common AI artifacts and unwanted elements.

RULES:
1. Focus on preventing AI artifacts (blurry, distorted, deformed, ugly, bad anatomy)
2. Prevent style drift (cartoon, anime, painting, drawing)
3. Maintain realism and natural appearance
4. Keep it concise but comprehensive
5. Don't contradict the positive prompt

EXAMPLE:
Positive: "Portrait in Studio Ghibli style, soft pastel lighting..."
Negative: "blurry, low quality, distorted, deformed, ugly, bad anatomy, cartoon, anime style, painting, drawing, unrealistic, artificial"

Respond with ONLY the negative prompt, no explanations.`;

interface MagicWandRequest {
  prompt: string;
  enhanceNegativePrompt?: boolean;
}

interface MagicWandResponse {
  success: boolean;
  originalPrompt: string;
  enhancedPrompt: string;
  enhancedNegativePrompt?: string;
  confidence: 'high' | 'medium' | 'low';
}

// Helper function to determine if a prompt needs enhancement
function needsEnhancement(prompt: string): boolean {
  const trimmedPrompt = prompt.trim();
  
  // Check length
  if (trimmedPrompt.length < 15) return true;
  
  // Check for vague terms
  const vagueTerms = [
    'style', 'look', 'vibe', 'feel', 'mood', 'aesthetic',
    'ghibli', 'anime', 'cyberpunk', 'vintage', 'retro',
    'sad', 'happy', 'angry', 'scared', 'surprised',
    'eyes', 'face', 'portrait', 'photo', 'picture'
  ];
  
  const words = trimmedPrompt.toLowerCase().split(/\s+/);
  const hasVagueTerms = vagueTerms.some(term => 
    words.some(word => word.includes(term))
  );
  
  // Check for lack of descriptive words
  const descriptiveWords = words.filter(word => 
    word.length > 3 && !['the', 'and', 'with', 'for', 'this', 'that'].includes(word)
  );
  
  return hasVagueTerms || descriptiveWords.length < 2;
}

// OpenAI API call function with fallback
async function callOpenAI(messages: any[], model: string = 'gpt-3.5-turbo') {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Try primary model first, fallback to GPT-4o if needed
  const modelsToTry = model === 'gpt-3.5-turbo' 
    ? ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'] 
    : [model];

  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      console.log(`🔮 [Magic Wand] Trying model: ${currentModel}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature: 0.7,
          max_tokens: 200,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      console.log(`🔮 [Magic Wand] Success with model: ${currentModel}`);
      return data.choices[0].message.content.trim();
      
    } catch (error) {
      console.warn(`🔮 [Magic Wand] Failed with model ${currentModel}:`, error);
      lastError = error as Error;
      
      // If this was the last model to try, throw the error
      if (currentModel === modelsToTry[modelsToTry.length - 1]) {
        throw lastError;
      }
      
      // Otherwise, continue to next model
      continue;
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error('All models failed');
}

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body: MagicWandRequest = JSON.parse(event.body || '{}');
    const { prompt, enhanceNegativePrompt = false } = body;

    if (!prompt || typeof prompt !== 'string') {
      return json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('🔮 [Magic Wand] Processing prompt enhancement');

    // Always enhance when user clicks the button - they want it enhanced!
    console.log('🔮 [Magic Wand] Enhancing prompt with OpenAI...');
    const enhancedPrompt = await callOpenAI([
      { role: 'system', content: MAGIC_WAND_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ]);

    let enhancedNegativePrompt: string | undefined;

    // Optionally enhance negative prompt
    if (enhanceNegativePrompt) {
      console.log('🔮 [Magic Wand] Enhancing negative prompt...');
      enhancedNegativePrompt = await callOpenAI([
        { role: 'system', content: NEGATIVE_PROMPT_SYSTEM },
        { role: 'user', content: `Positive prompt: ${enhancedPrompt}` }
      ]);
    }

    const response: MagicWandResponse = {
      success: true,
      originalPrompt: prompt,
      enhancedPrompt,
      enhancedNegativePrompt,
      confidence: 'medium' as const,
    };

    console.log('🔮 [Magic Wand] Enhanced prompt length:', enhancedPrompt.length);
    if (enhancedNegativePrompt) {
      console.log('🔮 [Magic Wand] Enhanced negative prompt length:', enhancedNegativePrompt.length);
    }

    return json(response);

  } catch (error) {
    console.error('🔮 [Magic Wand] Error:', error);
    return json({ 
      error: 'Failed to enhance prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
