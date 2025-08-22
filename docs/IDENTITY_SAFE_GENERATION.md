# Identity-Safe Generation with Replicate

## Overview

Identity-safe generation is a fallback system that uses Replicate's `zsxkib/infinite-you:sim_stage1` model to generate images that preserve facial identity when the primary AI generation fails to meet identity preservation standards.

## Features

- **Face-Safe Generation**: Uses specialized models designed to preserve facial identity
- **Automatic Fallback**: Triggers when IPA (Identity Preservation Assessment) fails
- **Configurable Parameters**: Adjustable strength and guidance for different use cases
- **Real-time Monitoring**: Track generation progress with status polling
- **Error Handling**: Comprehensive error handling and logging

## Setup

### 1. Environment Variables

Add to your Netlify environment variables:

```bash
REPLICATE_API_KEY=your_replicate_api_key_here
```

### 2. Replicate API Key

1. Sign up at [replicate.com](https://replicate.com)
2. Go to your account settings
3. Generate an API token
4. Add it to your Netlify environment variables

### 3. Netlify Function

The function is automatically deployed when you push to GitHub. It's located at:
```
netlify/functions/identity-safe-generation.ts
```

## Usage

### Basic Usage

```typescript
import { runIdentitySafeFallback } from '../utils/identitySafeGeneration';

// Run identity-safe fallback when IPA fails
try {
  const result = await runIdentitySafeFallback(
    "Transform this into a cyberpunk character",
    "https://example.com/source-image.jpg",
    { strength: 0.7, guidance: 7.5 }
  );
  
  console.log('Fallback completed:', result.outputUrl);
} catch (error) {
  console.error('Fallback failed:', error);
}
```

### Advanced Usage

```typescript
import { 
  startIdentitySafeGeneration, 
  waitForPredictionCompletion 
} from '../utils/identitySafeGeneration';

// Start generation
const startResult = await startIdentitySafeGeneration({
  prompt: "Transform this into a cyberpunk character",
  imageUrl: "https://example.com/source-image.jpg",
  strength: 0.6,
  guidance: 8.0
});

// Monitor progress
const finalResult = await waitForPredictionCompletion(startResult.id);

if (finalResult.status === 'succeeded' && finalResult.output) {
  console.log('Generated image:', finalResult.output[0]);
}
```

## Integration with IPA System

### When to Use

Identity-safe generation should be used as a fallback when:

1. **Primary AI generation fails** identity preservation checks
2. **IPA similarity score** is below threshold (e.g., < 0.35)
3. **Multiple retry attempts** with reduced strength fail
4. **User explicitly requests** identity-safe mode

### Implementation Example

```typescript
// In your generateWithIdentityLock function
async function generateWithIdentityLock(prompt: string, sourceImage: string) {
  try {
    // Try primary generation first
    const primaryResult = await primaryAIGeneration(prompt, sourceImage);
    
    // Check identity preservation
    const ipaScore = await checkIdentityPreservation(sourceImage, primaryResult.url);
    
    if (ipaScore.similarity >= 0.35) {
      return primaryResult; // ✅ Identity preserved
    }
    
    // ❌ Identity not preserved, try fallback
    console.log('🔄 Primary generation failed IPA, trying identity-safe fallback...');
    
    const fallbackResult = await runIdentitySafeFallback(
      prompt,
      sourceImage,
      { strength: 0.5, guidance: 8.0 } // Conservative settings
    );
    
    return {
      url: fallbackResult.outputUrl,
      method: 'identity-safe-fallback',
      predictionId: fallbackResult.predictionId
    };
    
  } catch (error) {
    console.error('All generation methods failed:', error);
    throw error;
  }
}
```

## Model Details

### Replicate Model: `zsxkib/infinite-you:sim_stage1`

- **Purpose**: Identity-preserving image-to-image generation
- **Strengths**: Excellent facial identity preservation
- **Use Case**: When you need to maintain the subject's face
- **Limitations**: May be slower than primary models

### Parameters

- **strength**: 0.0-1.0 (default: 0.7)
  - Lower = more identity preservation
  - Higher = more style transformation
- **guidance**: 1.0-20.0 (default: 7.5)
  - Lower = more creative freedom
  - Higher = more prompt adherence
- **num_inference_steps**: 20-100 (default: 50)
  - Higher = better quality, slower generation

## Error Handling

### Common Errors

1. **Missing API Key**: `REPLICATE_API_KEY environment variable not set`
2. **Invalid Parameters**: `Missing required parameters: prompt and imageUrl are required`
3. **API Limits**: Rate limiting or quota exceeded
4. **Network Issues**: Timeout or connection errors

### Error Recovery

```typescript
try {
  const result = await runIdentitySafeFallback(prompt, imageUrl);
  return result;
} catch (error) {
  if (error.message.includes('API not configured')) {
    // Handle missing configuration
    console.warn('Identity-safe generation not available');
    return null;
  }
  
  if (error.message.includes('rate limit')) {
    // Handle rate limiting
    await delay(5000); // Wait 5 seconds
    return await runIdentitySafeFallback(prompt, imageUrl);
  }
  
  // Re-throw other errors
  throw error;
}
```

## Monitoring and Logging

### Console Commands

```javascript
// Check if function is accessible
window.isIdentitySafeGenerationAvailable()

// Monitor generation progress
window.debugIdentitySafeGeneration()
```

### Log Examples

```
🚀 Starting identity-safe generation: prompt: "Transform this into...", strength: 0.7
✅ Identity-safe generation started: predictionId: "abc123", status: "starting"
⏳ Generation still processing, waiting... elapsed: 15s
🎉 Identity-safe generation completed successfully: abc123
```

## Performance Considerations

### Timing

- **Startup**: 2-5 seconds
- **Processing**: 10-60 seconds (depending on complexity)
- **Total**: 15-90 seconds typically

### Optimization

1. **Use appropriate strength** (0.5-0.7 for identity preservation)
2. **Set reasonable guidance** (7.0-8.0 for balanced results)
3. **Implement caching** for repeated requests
4. **Add progress indicators** for user experience

## Troubleshooting

### Function Not Deploying

1. Check Netlify build logs
2. Verify TypeScript compilation
3. Ensure function is in `netlify/functions/` directory

### API Errors

1. Verify `REPLICATE_API_KEY` is set
2. Check Replicate account status
3. Monitor API rate limits

### Generation Failures

1. Check input image format (JPEG, PNG, WebP)
2. Verify prompt length and content
3. Monitor Replicate model status

## Future Enhancements

- **Multiple Fallback Models**: Support for different identity-preserving models
- **Smart Parameter Tuning**: Automatic parameter optimization based on content
- **Batch Processing**: Handle multiple fallback requests efficiently
- **Advanced Monitoring**: Real-time progress tracking and analytics
