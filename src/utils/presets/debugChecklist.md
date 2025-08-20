# Stefna AIML Debug Checklist

## Fast Debug Steps (in order):

### 1. **FORCE num_variations = 1 everywhere**
- Never omit this parameter
- Never let it default to > 1
- This prevents auto-gridding by providers

### 2. **Strength in [0.06, 0.10] range**
- Start with strength = 0.08 for Emotion/Reaction
- Use strength = 0.07-0.08 for Neo Tokyo Scanlines
- If still problematic, try strength = 0.06

### 3. **Remove anime trigger words**
- Strip "ghibli", "anime", "cartoon", "cel-shaded" from ALL prompts
- Even in negative prompts or runtime additions
- These words can trigger full stylization

### 4. **Pre-blur background faces**
- If background has mirrors/posters with faces
- Lightly blur those areas BEFORE calling i2i
- This prevents the model from seeing "two subjects"

### 5. **Auto-retry for double faces**
If output still shows 2 faces:
- Re-run same prompt with `strength - 0.02` (minimum 0.06)
- Append this temporary tail to the prompt:
  ```
  "SINGLE SUBJECT ONLY; no grid, no split-screen, no collage, do not duplicate the subject."
  ```

## Two-Pass Strategy (Optional):

### Pass 1: Identity Anchor
```typescript
const pass1 = {
  model: preset.model,
  prompt: 'Photorealistic copy of the input portrait. Reproduce the exact same person and facial features. Do NOT stylize, do NOT add overlays, do NOT change expression. SINGLE SUBJECT ONLY; no grid, no collage, no mirror. Keep background intact.',
  image_url,
  strength: 0.06,
  num_variations: 1,
};
```

### Pass 2: Micro-Overlay
```typescript
const pass2 = buildAIMLRequest(preset, image_url); // strength 0.08-0.10
```

## Common Failure Modes:

1. **Heavy Stylization**: Big anime eyes, cartoon skin
   - Solution: Remove anime keywords, lower strength to 0.06-0.08

2. **Grid/Diptych Output**: Two faces in one image
   - Solution: Force num_variations: 1, add "SINGLE SUBJECT ONLY" to prompts

3. **Background Reflection**: Model sees mirror/poster faces
   - Solution: Pre-blur background faces, use stronger single-subject language

## Strength Guidelines:

- **0.06**: Identity anchor (copy exactly)
- **0.07**: Background effects (scanlines, chromatic aberration)
- **0.08**: Micro-expressions, subtle overlays
- **0.09**: Slightly stronger effects
- **0.10**: Maximum safe strength (avoid going higher)

## Model Selection:

- **Primary**: `stable-diffusion-3.5-large-i2i` (best identity preservation)
- **Fallback**: `flux/dev/image-to-image` (keep strength ≤ 0.12)
