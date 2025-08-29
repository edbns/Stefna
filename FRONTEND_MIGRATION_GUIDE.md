# 🎯 Frontend Migration Guide: Unified Generation Endpoints

## 📋 Overview

We've simplified the generation architecture from **12+ separate functions** to **2 unified endpoints**. This reduces complexity and makes the system more maintainable.

## 🔄 Migration Strategy

### Before (Complex)
```typescript
// Old way - had to know 12+ different endpoints
const neoGlitchResponse = await fetch('/.netlify/functions/start-glitch-job', {
  method: 'POST',
  body: JSON.stringify({ sourceUrl, prompt, presetKey })
});

const statusResponse = await fetch(`/.netlify/functions/poll-glitch-job?jobId=${jobId}`);

// Similar pattern for each generation type...
```

### After (Simplified)
```typescript
// New way - single endpoint for all generation types
const generateResponse = await fetch('/.netlify/functions/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': authToken },
  body: JSON.stringify({
    type: 'neo-glitch', // or 'emotion-mask', 'presets', etc.
    prompt: 'Your prompt here',
    presetKey: 'preset-name',
    sourceAssetId: 'source-url-or-id'
  })
});

// Single status endpoint for all job types
const statusResponse = await fetch(`/.netlify/functions/status?jobId=${jobId}`);
```

---

## 🚀 Step-by-Step Migration

### Step 1: Update Generation Calls

Replace generation function calls with the unified endpoint:

```typescript
// OLD - Neo Glitch specific
async function generateNeoGlitch(prompt: string, presetKey: string, sourceUrl: string) {
  const response = await authenticatedFetch('/.netlify/functions/start-glitch-job', {
    method: 'POST',
    body: JSON.stringify({ sourceUrl, prompt, presetKey })
  });
  return response.json();
}

// NEW - Unified approach
async function generateMedia(type: string, prompt: string, presetKey: string, sourceAssetId: string) {
  const response = await authenticatedFetch('/.netlify/functions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, prompt, presetKey, sourceAssetId })
  });
  return response.json();
}

// Usage examples:
const neoGlitchJob = await generateMedia('neo-glitch', prompt, presetKey, sourceUrl);
const emotionMaskJob = await generateMedia('emotion-mask', prompt, presetKey, faceUrl);
const presetsJob = await generateMedia('presets', prompt, presetKey, sourceUrl);
```

### Step 2: Update Status Polling

Replace type-specific status functions with the unified status endpoint:

```typescript
// OLD - Type-specific status functions
async function pollNeoGlitchJob(jobId: string) {
  const response = await authenticatedFetch(`/.netlify/functions/poll-glitch-job?jobId=${jobId}`);
  return response.json();
}

async function getEmotionMaskStatus(jobId: string) {
  const response = await authenticatedFetch(`/.netlify/functions/emotion-mask-status?jobId=${jobId}`);
  return response.json();
}

// NEW - Single status function
async function getJobStatus(jobId: string, type?: string) {
  const url = type
    ? `/.netlify/functions/status?jobId=${jobId}&type=${type}`
    : `/.netlify/functions/status?jobId=${jobId}`;

  const response = await authenticatedFetch(url);
  return response.json();
}

// Usage:
const status = await getJobStatus(jobId); // Auto-detects type
const neoGlitchStatus = await getJobStatus(jobId, 'neo-glitch'); // Explicit type
```

### Step 3: Update Response Handling

The new endpoints return consistent response formats:

```typescript
// Generate Response
interface GenerateResponse {
  success: boolean;
  jobId: string;
  runId: string;
  type: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
}

// Status Response
interface StatusResponse {
  success: boolean;
  jobId: string;
  status: 'processing' | 'completed' | 'failed' | 'not_found';
  type?: string;
  imageUrl?: string;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 📝 Code Examples

### Complete Migration Example

```typescript
// OLD CODE (before migration)
class OldGenerationService {
  async generateNeoGlitch(prompt: string, presetKey: string, sourceUrl: string) {
    // Start job
    const startResponse = await authenticatedFetch('/.netlify/functions/start-glitch-job', {
      method: 'POST',
      body: JSON.stringify({ sourceUrl, prompt, presetKey })
    });

    if (!startResponse.ok) throw new Error('Failed to start job');

    const { jobId } = await startResponse.json();

    // Poll for completion
    return this.pollJob(jobId, 'neo-glitch');
  }

  async pollJob(jobId: string, type: string) {
    const maxAttempts = 60;
    const pollInterval = 3000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await authenticatedFetch(`/.netlify/functions/poll-glitch-job?jobId=${jobId}`);
      const status = await statusResponse.json();

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Generation failed');
      }
    }

    throw new Error('Generation timeout');
  }
}

// NEW CODE (after migration)
class UnifiedGenerationService {
  async generateMedia(type: string, prompt: string, presetKey: string, sourceAssetId: string) {
    const response = await authenticatedFetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, prompt, presetKey, sourceAssetId })
    });

    if (!response.ok) throw new Error('Failed to start generation');

    const result = await response.json();

    if (result.success) {
      // Poll for completion using unified status endpoint
      return this.pollJob(result.jobId);
    } else {
      throw new Error(result.message || 'Generation failed');
    }
  }

  async pollJob(jobId: string) {
    const maxAttempts = 60;
    const pollInterval = 3000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await authenticatedFetch(`/.netlify/functions/status?jobId=${jobId}`);
      const status = await statusResponse.json();

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Generation failed');
      }
    }

    throw new Error('Generation timeout');
  }

  // Convenience methods for specific types
  generateNeoGlitch(prompt: string, presetKey: string, sourceUrl: string) {
    return this.generateMedia('neo-glitch', prompt, presetKey, sourceUrl);
  }

  generateEmotionMask(prompt: string, presetKey: string, faceUrl: string) {
    return this.generateMedia('emotion-mask', prompt, presetKey, faceUrl);
  }

  generateWithPreset(prompt: string, presetKey: string, sourceUrl: string) {
    return this.generateMedia('presets', prompt, presetKey, sourceUrl);
  }

  generateGhibliReaction(prompt: string, presetKey: string, sourceUrl: string) {
    return this.generateMedia('ghibli-reaction', prompt, presetKey, sourceUrl);
  }

  generateCustomPrompt(prompt: string, presetKey: string, sourceUrl: string) {
    return this.generateMedia('custom-prompt', prompt, presetKey, sourceUrl);
  }
}
```

---

## 🧪 Testing Your Migration

### 1. Run the Test Script
```bash
# Set your environment variables
export NETLIFY_URL="https://your-netlify-site.netlify.app"
export TEST_USER_TOKEN="your-jwt-token"

# Run the test script
node test-unified-endpoints.js
```

### 2. Manual Testing
```typescript
// Test each generation type
const testCases = [
  { type: 'neo-glitch', prompt: 'Cyberpunk city', presetKey: 'cyberpunk' },
  { type: 'emotion-mask', prompt: 'Happy face', presetKey: 'happy' },
  { type: 'presets', prompt: 'Mountain landscape', presetKey: 'landscape' },
  { type: 'ghibli-reaction', prompt: 'Studio Ghibli style', presetKey: 'ghibli' },
  { type: 'custom-prompt', prompt: 'Custom art style', presetKey: 'custom' }
];

for (const testCase of testCases) {
  console.log(`Testing ${testCase.type}...`);

  const response = await fetch('/.netlify/functions/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      ...testCase,
      sourceAssetId: 'test-source-url.jpg'
    })
  });

  const result = await response.json();
  console.log(`Result: ${JSON.stringify(result, null, 2)}`);
}
```

---

## 📊 Benefits of the New Architecture

### 🎯 **Frontend Benefits**
- **Single API** instead of 12+ endpoints to remember
- **Consistent responses** across all generation types
- **Easier testing** and debugging
- **Future-proof** - adding new types requires no frontend changes

### 🔧 **Backend Benefits**
- **Unified error handling** and logging
- **Shared generation logic** reduces duplication
- **Easier maintenance** - changes in one place
- **Better scalability** - consistent patterns

### 🚀 **Developer Experience**
- **Faster development** of new features
- **Reduced complexity** in API integration
- **Better documentation** and examples
- **Consistent patterns** across the codebase

---

## 🔧 Troubleshooting

### Common Issues

**Q: "Job not found" error**
A: Make sure you're using the correct jobId returned from the generate endpoint.

**Q: "Unauthorized" error**
A: Ensure your JWT token is valid and properly formatted in the Authorization header.

**Q: "Unsupported generation type"**
A: Check that you're using one of the supported types: 'neo-glitch', 'emotion-mask', 'presets', 'ghibli-reaction', 'custom-prompt'

**Q: Status always returns "processing"**
A: The generation might still be running. Wait a few seconds and try again, or check the logs for errors.

### Debug Tips
1. Check the Netlify function logs for detailed error messages
2. Verify your database connection and table schemas
3. Test with the provided test script first
4. Use the browser dev tools to inspect network requests

---

## 🎉 Next Steps

1. **Test the new endpoints** using the provided test script
2. **Migrate your frontend code** gradually (one generation type at a time)
3. **Update your documentation** to reflect the new API
4. **Remove old endpoints** once migration is complete

**Ready to test?** Run `node test-unified-endpoints.js` and let me know the results! 🚀
