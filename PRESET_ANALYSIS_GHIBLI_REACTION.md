# 🌸 Ghibli Reaction Presets Analysis (3 presets)
*Engine: Flux i2i | API: AIML | Params: strength only | Face-only light anime*

## 📊 **System Configuration**
- **Engine/Model**: `flux/dev` (Flux image-to-image)
- **API Endpoint**: `https://api.aimlapi.com/v1/images/generations`
- **Supported Params**: `model`, `prompt`, `image_url`, `strength`, `num_variations`
- **No Negative Prompts**: Not supported by current AIML setup
- **Strength Policy**: Server-clamped to safe ranges (0.12-0.18)
- **Purpose**: Face-only micro-anime stylization, body/background remain photorealistic

---

## 🛡️ **IDENTITY PRESERVATION GUARDS**

### **Global Single Panel Guard**
```
Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. 
Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. 
Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. 
Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure.
```

### **Face-Only Guard**
```
Apply the following effect to the FACE ONLY. Keep body, hair, clothing, neck, and background photorealistic and unchanged.
```

---

## ⚠️ **MODERATE RISK PRESETS (Optimization Required)**

### **1. rx_tears (Tears)**
- **ID**: `rx_tears`
- **Label**: 'Tears'
- **Current Strength**: 0.06 ⚠️ **TOO LOW - MAY CAUSE PASSTHROUGH**
- **Positive Prompt**: 
  ```
  Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. 
  Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. 
  Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. 
  Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure. 
  Apply the following effect to the FACE ONLY. Keep body, hair, clothing, neck, and background photorealistic and unchanged. 
  Add a delicate glossy tear film along the lower eyelids and ONE thin transparent teardrop on ONE cheek (8–12 mm trail) 
  with tiny sparkle highlights in a gentle anime-inspired finish on the face only. Keep body/background photoreal.
  ```
- **Risk Analysis**: Face-only anime stylization = low identity risk, but strength too low
- **Current Status**: ⚠️ **NEEDS OPTIMIZATION** - below safe range (0.12-0.18)
- **Recommended Strength**: 0.14 (within safe 0.12-0.18 range)
- **Patch**: `strength: 0.06` → `strength: 0.14`

### **2. rx_shock (Shock)**
- **ID**: `rx_shock`
- **Label**: 'Shock'
- **Current Strength**: 0.06 ⚠️ **TOO LOW - MAY CAUSE PASSTHROUGH**
- **Positive Prompt**: 
  ```
  Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. 
  Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. 
  Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. 
  Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure. 
  Apply the following effect to the FACE ONLY. Keep body, hair, clothing, neck, and background photorealistic and unchanged. 
  Subtle surprise: slightly raised brows, mild sclera visibility, micro-parted lips without teeth, brighter eye catchlights. 
  Light anime influence limited to facial shading and catchlights; do not stylize neck, clothing, or background.
  ```
- **Risk Analysis**: Face-only anime stylization = low identity risk, but strength too low
- **Current Status**: ⚠️ **NEEDS OPTIMIZATION** - below safe range (0.12-0.18)
- **Recommended Strength**: 0.14 (within safe 0.12-0.18 range)
- **Patch**: `strength: 0.06` → `strength: 0.14`

### **3. rx_sparkle (Sparkle)**
- **ID**: `rx_sparkle`
- **Label**: 'Sparkle'
- **Current Strength**: 0.06 ⚠️ **TOO LOW - MAY CAUSE PASSTHROUGH**
- **Positive Prompt**: 
  ```
  Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. 
  Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. 
  Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. 
  Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure. 
  Apply the following effect to the FACE ONLY. Keep body, hair, clothing, neck, and background photorealistic and unchanged. 
  Add small starry catchlights near the irises and a few miniature sparkles on the cheeks (face only). 
  Keep pores and natural skin texture visible; body and background remain realistic.
  ```
- **Risk Analysis**: Face-only anime stylization = low identity risk, but strength too low
- **Current Status**: ⚠️ **NEEDS OPTIMIZATION** - below safe range (0.12-0.18)
- **Recommended Strength**: 0.14 (within safe 0.12-0.18 range)
- **Patch**: `strength: 0.06` → `strength: 0.14`

---

## 📊 **SUMMARY STATISTICS**

- **Total Presets**: 3
- **High Risk**: 0 presets (0%)
- **Moderate Risk**: 3 presets (100%)
- **Low Risk**: 0 presets (0%)

## 🎯 **CURRENT STATUS: NEEDS OPTIMIZATION**

**All Ghibli Reaction presets have the same issue:**

1. **Strength values**: All at 0.06 (below safe range 0.12-0.18)
2. **Risk**: May cause "passthrough" (no visible change) due to too-low strength
3. **Identity preservation**: Excellent - face-only approach prevents drift
4. **Visual impact**: May be too subtle to notice

## 🔧 **RECOMMENDED ACTIONS**

**Immediate optimization required** - Increase strength values:

1. **rx_tears**: `0.06` → `0.14` (optimal for tear effects)
2. **rx_shock**: `0.06` → `0.14` (optimal for shock expressions)
3. **rx_sparkle**: `0.06` → `0.14` (optimal for sparkle effects)

## 📝 **TECHNICAL NOTES**

- **Purpose**: Eliminate "double face" and anime drift without adapters
- **Approach**: Two-pass system with identity preservation guards
- **Scope**: Face-only micro-anime stylization
- **Body/background**: Remain completely photorealistic
- **Identity preservation**: Built into every prompt template
- **Strength policy**: Server-clamped to 0.12-0.18 range

## 🚀 **ADVANTAGES**

1. **Low drift risk**: Face-only modifications
2. **Identity preservation**: Built-in guards prevent unwanted effects
3. **Consistent results**: Same approach across all ghibli presets
4. **Professional quality**: Subtle anime influence without full stylization
5. **Photorealistic body**: Background and body remain unchanged

## ⚠️ **CURRENT LIMITATIONS**

1. **Strength too low**: 0.06 may cause "passthrough" (no visible change)
2. **Subtle effects**: May be too subtle for users to notice
3. **Limited visual impact**: Current strength may not produce desired anime effects

## 📋 **USAGE RECOMMENDATIONS**

- **Best for**: Portrait photography with subtle anime influence
- **Ideal subjects**: People with clear facial features
- **Avoid**: Subjects with heavy makeup or obscured faces
- **Expected results**: Subtle anime stylization on face only, photorealistic body/background

## 🔧 **OPTIMIZATION IMPACT**

**After strength increase (0.06 → 0.14):**

1. **Visible effects**: Users will see the anime stylization
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

**Ghibli Reaction presets are well-designed but need strength optimization:**

1. **Keep current prompts**: Excellent identity preservation
2. **Increase strength**: 0.06 → 0.14 for all presets
3. **Maintain approach**: Face-only, body/background photorealistic
4. **Monitor results**: Ensure anime effects are visible but not overwhelming
