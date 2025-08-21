# 🌃 Neo Tokyo Glitch Presets Analysis (4 presets)
*Engine: Flux i2i | API: AIML | Params: strength only | Cyberpunk overlays*

## 📊 **System Configuration**
- **Engine/Model**: `flux/dev` (Flux image-to-image)
- **API Endpoint**: `https://api.aimlapi.com/v1/images/generations`
- **Supported Params**: `model`, `prompt`, `image_url`, `strength`, `num_variations`
- **No Negative Prompts**: Not supported by current AIML setup
- **Strength Policy**: Server-clamped to safe ranges (0.20-0.30)
- **Purpose**: Additive cyberpunk overlays, no facial geometry changes

---

## 🛡️ **IDENTITY PRESERVATION GUARDS**

### **Global Single Panel Guard**
```
Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. 
Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. 
Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. 
Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure.
```

---

## ⚠️ **MODERATE RISK PRESETS (Optimization Required)**

### **1. neo_tokyo_base (Base)**
- **ID**: `neo_tokyo_base`
- **Label**: 'Base'
- **Current Strength**: 0.06 ⚠️ **TOO LOW - MAY CAUSE PASSTHROUGH**
- **Positive Prompt**: 
  ```
  Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. 
  Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. 
  Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. 
  Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure. 
  Cinematic city-night palette. Add faint neon rim light around hair edges and a soft neon ambience in the background bokeh. 
  Do not recolor facial skin; no lines over facial skin.
  ```
- **Risk Analysis**: Additive overlays only = low identity risk, but strength too low
- **Current Status**: ⚠️ **NEEDS OPTIMIZATION** - below safe range (0.20-0.30)
- **Recommended Strength**: 0.24 (within safe 0.20-0.30 range)
- **Patch**: `strength: 0.06` → `strength: 0.24`

### **2. neo_tokyo_visor (Glitch Visor)**
- **ID**: `neo_tokyo_visor`
- **Label**: 'Glitch Visor'
- **Current Strength**: 0.06 ⚠️ **TOO LOW - MAY CAUSE PASSTHROUGH**
- **Positive Prompt**: 
  ```
  Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. 
  Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. 
  Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. 
  Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure. 
  Add a translucent HUD visor above the eyes with bright neon UI glyphs and micro text. 
  Eyebrows and eyelashes remain fully visible. Background neon bokeh becomes more saturated.
  ```
- **Risk Analysis**: Additive overlays only = low identity risk, but strength too low
- **Current Status**: ⚠️ **NEEDS OPTIMIZATION** - below safe range (0.20-0.30)
- **Recommended Strength**: 0.24 (within safe 0.20-0.30 range)
- **Patch**: `strength: 0.06` → `strength: 0.24`

### **3. neo_tokyo_tattoos (Tech Tattoos)**
- **ID**: `neo_tokyo_tattoos`
- **Label**: 'Tech Tattoos'
- **Current Strength**: 0.06 ⚠️ **TOO LOW - MAY CAUSE PASSTHROUGH**
- **Positive Prompt**: 
  ```
  Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. 
  Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. 
  Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. 
  Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure. 
  Add ultra-faint silver micro-circuit lines along temples and cheekbones. Hair-thin, semi-transparent; 
  no recolor of skin and no lines over the eye regions.
  ```
- **Risk Analysis**: Additive overlays only = low identity risk, but strength too low
- **Current Status**: ⚠️ **NEEDS OPTIMIZATION** - below safe range (0.20-0.30)
- **Recommended Strength**: 0.24 (within safe 0.20-0.30 range)
- **Patch**: `strength: 0.06` → `strength: 0.24`

### **4. neo_tokyo_scanlines (Scanline FX)**
- **ID**: `neo_tokyo_scanlines`
- **Label**: 'Scanline FX'
- **Current Strength**: 0.05 ⚠️ **TOO LOW - MAY CAUSE PASSTHROUGH**
- **Positive Prompt**: 
  ```
  Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. 
  Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. 
  Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. 
  Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure. 
  Add subtle VHS scanlines and mild RGB split in the BACKGROUND only; never draw lines over facial skin. 
  Boost city neon saturation behind the subject for a strong, colorful mood.
  ```
- **Risk Analysis**: Additive overlays only = low identity risk, but strength too low
- **Current Status**: ⚠️ **NEEDS OPTIMIZATION** - below safe range (0.20-0.30)
- **Recommended Strength**: 0.24 (within safe 0.20-0.30 range)
- **Patch**: `strength: 0.05` → `strength: 0.24`

---

## 📊 **SUMMARY STATISTICS**

- **Total Presets**: 4
- **High Risk**: 0 presets (0%)
- **Moderate Risk**: 4 presets (100%)
- **Low Risk**: 0 presets (0%)

## 🎯 **CURRENT STATUS: NEEDS OPTIMIZATION**

**All Neo Tokyo Glitch presets have the same issue:**

1. **Strength values**: 0.05-0.06 (below safe range 0.20-0.30)
2. **Risk**: May cause "passthrough" (no visible change) due to too-low strength
3. **Identity preservation**: Excellent - additive overlays only
4. **Visual impact**: May be too subtle to notice

## 🔧 **RECOMMENDED ACTIONS**

**Immediate optimization required** - Increase strength values:

1. **neo_tokyo_base**: `0.06` → `0.24` (optimal for neon effects)
2. **neo_tokyo_visor**: `0.06` → `0.24` (optimal for HUD visor)
3. **neo_tokyo_tattoos**: `0.06` → `0.24` (optimal for tech tattoos)
4. **neo_tokyo_scanlines**: `0.05` → `0.24` (optimal for scanline effects)

## 📝 **TECHNICAL NOTES**

- **Purpose**: Eliminate "double face" and anime drift without adapters
- **Approach**: Two-pass system with identity preservation guards
- **Scope**: Additive cyberpunk overlays only
- **No structural changes**: Facial geometry remains unchanged
- **Identity preservation**: Built into every prompt template
- **Strength policy**: Server-clamped to 0.20-0.30 range

## 🚀 **ADVANTAGES**

1. **Low drift risk**: Additive overlays only
2. **Identity preservation**: Built-in guards prevent unwanted effects
3. **Consistent results**: Same approach across all neo tokyo presets
4. **Professional quality**: Cyberpunk aesthetic without identity loss
5. **No facial changes**: Original face structure preserved

## ⚠️ **CURRENT LIMITATIONS**

1. **Strength too low**: 0.05-0.06 may cause "passthrough" (no visible change)
2. **Subtle effects**: May be too subtle for users to notice
3. **Limited visual impact**: Current strength may not produce desired cyberpunk effects

## 📋 **USAGE RECOMMENDATIONS**

- **Best for**: Cyberpunk/tech aesthetic photography
- **Ideal subjects**: Urban portraits, tech enthusiasts, night photography
- **Avoid**: Subjects with heavy makeup or obscured faces
- **Expected results**: Subtle cyberpunk overlays without identity loss

## 🔧 **OPTIMIZATION IMPACT**

**After strength increase (0.05-0.06 → 0.24):**

1. **Visible effects**: Users will see the cyberpunk overlays
2. **No passthrough**: Strength high enough to produce changes
3. **Maintained safety**: Still within identity-preserving range
4. **Better user experience**: Clear visual feedback
5. **Professional results**: Optimal balance of effect and safety

## 📊 **COMPARISON WITH OTHER PRESET TYPES**

| Preset Type | Current Strength | Safe Range | Status | Action Required |
|-------------|------------------|------------|---------|-----------------|
| **Professional** | 0.65-0.80 | 0.12-0.22 | ⚠️ HIGH RISK | Immediate fix |
| **Emotion Mask** | 0.07 | 0.10-0.15 | ✅ OPTIMAL | None |
| **Ghibli Reaction** | 0.06 | 0.12-0.18 | ⚠️ TOO LOW | Increase strength |
| **Neo Tokyo Glitch** | 0.05-0.06 | 0.20-0.30 | ⚠️ TOO LOW | Increase strength |

## 🎯 **FINAL RECOMMENDATION**

**Neo Tokyo Glitch presets are well-designed but need strength optimization:**

1. **Keep current prompts**: Excellent identity preservation
2. **Increase strength**: 0.05-0.06 → 0.24 for all presets
3. **Maintain approach**: Additive overlays only, no structural changes
4. **Monitor results**: Ensure cyberpunk effects are visible but not overwhelming

## 🌟 **SPECIAL FEATURES**

### **Background-Only Effects**
- **neo_tokyo_scanlines**: VHS scanlines and RGB split in background only
- **neo_tokyo_base**: Neon ambience in background bokeh only

### **Face-Safe Overlays**
- **neo_tokyo_visor**: HUD visor above eyes, eyebrows/eyelashes preserved
- **neo_tokyo_tattoos**: Micro-circuit lines on temples/cheekbones, no eye regions

### **No Facial Recoloring**
- All presets explicitly avoid recoloring facial skin
- Maintains natural skin tones and textures
- Preserves original facial features
