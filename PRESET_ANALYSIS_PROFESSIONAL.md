# 🎨 Professional Presets Analysis (25 presets)
*Engine: Flux i2i | API: AIML | Params: strength only*

## 📊 **System Configuration**
- **Engine/Model**: `flux/dev` (Flux image-to-image)
- **API Endpoint**: `https://api.aimlapi.com/v1/images/generations`
- **Supported Params**: `model`, `prompt`, `image_url`, `strength`, `num_variations`
- **No Negative Prompts**: Not supported by current AIML setup
- **Strength Policy**: Server-clamped to safe ranges

---

## 🚨 **HIGH RISK PRESETS (Immediate Fix Required)**

### **1. mono_drama (B&W Drama)**
- **ID**: `mono_drama`
- **Category**: Black & White
- **Current Strength**: 0.80 ⚠️ **VERY HIGH - HIGH DRIFT RISK**
- **Positive Prompt**: "Convert to black and white with strong contrast, bright highlights, and detailed textures. Ideal for close-up portraits or moody street scenes."
- **Risk Analysis**: B&W conversion at 0.80 strength = major identity loss, facial structure drift
- **Recommended Strength**: 0.22 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.80` → `strength: 0.22`

### **2. noir_classic (Noir Cinema)**
- **ID**: `noir_classic`
- **Category**: Black & White
- **Current Strength**: 0.80 ⚠️ **VERY HIGH - HIGH DRIFT RISK**
- **Positive Prompt**: "High-contrast black and white with sharp detail, deep blacks, and a timeless cinematic mood."
- **Risk Analysis**: Same as mono_drama - extreme contrast + high strength = identity loss
- **Recommended Strength**: 0.22 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.80` → `strength: 0.22`

### **3. cinematic_glow (Cinematic Glow)**
- **ID**: `cinematic_glow`
- **Category**: Cinematic
- **Current Strength**: 0.75 ⚠️ **HIGH - MODERATE DRIFT RISK**
- **Positive Prompt**: "Enhance this image/video with cinematic color grading, warm highlights, deep shadows, and rich blacks. Add a subtle teal-orange tone balance. Keep faces natural."
- **Risk Analysis**: Color grading + teal-orange balance at 0.75 = potential skin tone drift
- **Recommended Strength**: 0.18 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.75` → `strength: 0.18`

---

## ⚠️ **MODERATE RISK PRESETS (Fix Recommended)**

### **4. vivid_pop (Color Pop)**
- **ID**: `vivid_pop`
- **Category**: Vibrant
- **Current Strength**: 0.70 ⚠️ **HIGH - MODERATE DRIFT RISK**
- **Positive Prompt**: "Make colors vibrant and saturated while keeping skin tones realistic. Enhance clarity and add slight contrast for a punchy, Instagram-ready look."
- **Risk Analysis**: Color saturation + clarity boost = potential skin tone drift
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **5. festival_vibes (Vibrant Festival)**
- **ID**: `festival_vibes`
- **Category**: Vibrant
- **Current Strength**: 0.75 ⚠️ **HIGH - MODERATE DRIFT RISK**
- **Positive Prompt**: "Rich saturated colors, warm highlights, and slight vignette for lively festival and street party scenes."
- **Risk Analysis**: Rich colors + vignette at 0.75 = potential identity drift
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.75` → `strength: 0.20`

### **6. neon_nights (Neon Nights)**
- **ID**: `neon_nights`
- **Category**: Vibrant
- **Current Strength**: 0.75 ⚠️ **HIGH - MODERATE DRIFT RISK**
- **Positive Prompt**: "Vivid neon colors, deep blacks, and sharp clarity for night city scenes."
- **Risk Analysis**: Neon colors + sharp clarity at 0.75 = potential identity drift
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.75` → `strength: 0.20`

### **7. vintage_film_35mm (Film Look 35mm)**
- **ID**: `vintage_film_35mm`
- **Category**: Vintage
- **Current Strength**: 0.75 ⚠️ **HIGH - MODERATE DRIFT RISK**
- **Positive Prompt**: "Add a retro 35mm film look with warm faded tones, subtle grain, and soft shadows. Keep details sharp but with a nostalgic mood."
- **Risk Analysis**: Film grain + color shift at 0.75 = potential identity drift
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.75` → `strength: 0.20`

### **8. retro_polaroid (Instant Retro)**
- **ID**: `retro_polaroid`
- **Category**: Vintage
- **Current Strength**: 0.70 ⚠️ **HIGH - MODERATE DRIFT RISK**
- **Positive Prompt**: "Add warm faded tones, soft focus, and subtle frame edge blur for a retro instant camera feel."
- **Risk Analysis**: Focus changes + color shifts at 0.70 = potential identity drift
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **9. wildlife_focus (Wildlife Detail)**
- **ID**: `wildlife_focus`
- **Category**: Nature
- **Current Strength**: 0.75 ⚠️ **HIGH - MODERATE DRIFT RISK**
- **Positive Prompt**: "Enhance fur, feathers, or scales with natural tones and sharp detail, keeping background slightly blurred."
- **Risk Analysis**: Detail enhancement at 0.75 = potential texture drift
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.75` → `strength: 0.20`

---

## ✅ **LOW RISK PRESETS (Safe, Minor Optimization)**

### **10. bright_airy (Clean Minimal)**
- **ID**: `bright_airy`
- **Category**: Minimalist
- **Current Strength**: 0.65 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Edit with a clean, airy style—soft lighting, pastel tones, balanced whites, and gentle shadows. Perfect for lifestyle, wellness, and yoga shots."
- **Risk Analysis**: Soft lighting + gentle shadows = low identity risk
- **Recommended Strength**: 0.18 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.65` → `strength: 0.18`

### **11. tropical_boost (Tropical Vibes)**
- **ID**: `tropical_boost`
- **Category**: Travel
- **Current Strength**: 0.70 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Boost blues, greens, and warm tones for a tropical, sunny feel. Slight HDR for landscapes, keep people looking natural."
- **Risk Analysis**: Color boosting + HDR = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **12. urban_grit (Urban Grit)**
- **ID**: `urban_grit`
- **Category**: Urban
- **Current Strength**: 0.75 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Apply desaturated blues, deep contrast, and crisp details. Keep shadows strong and highlights clean for an urban city aesthetic."
- **Risk Analysis**: Desaturation + contrast = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.75` → `strength: 0.20`

### **13. dreamy_pastels (Soft Pastel Glow)**
- **ID**: `dreamy_pastels`
- **Category**: Cinematic
- **Current Strength**: 0.65 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Add soft-focus effect, pastel colors, and warm highlights for a dreamy, romantic vibe. Keep details smooth and flattering."
- **Risk Analysis**: Soft focus + pastel colors = low identity risk
- **Recommended Strength**: 0.18 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.65` → `strength: 0.18`

### **14. golden_hour_magic (Golden Hour Magic)**
- **ID**: `golden_hour_magic`
- **Category**: Warm
- **Current Strength**: 0.70 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Simulate golden hour lighting—warm tones, glowing highlights, and soft shadows. Perfect for portraits and sunsets."
- **Risk Analysis**: Lighting simulation = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **15. high_fashion_editorial (Fashion Editorial)**
- **ID**: `high_fashion_editorial`
- **Category**: Editorial
- **Current Strength**: 0.75 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Sleek desaturated tones with strong contrast, minimal noise, and smooth skin retouching. Magazine cover quality."
- **Risk Analysis**: Desaturation + skin retouching = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.75` → `strength: 0.20`

### **16. moody_forest (Forest Mood)**
- **ID**: `moody_forest`
- **Category**: Nature
- **Current Strength**: 0.70 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Deep green tones, soft diffused light, and light fog overlay for a moody forest atmosphere."
- **Risk Analysis**: Color tones + lighting = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **17. desert_glow (Golden Dunes)**
- **ID**: `desert_glow`
- **Category**: Travel
- **Current Strength**: 0.70 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Warm sandy tones, golden highlights, and gentle texture enhancement for desert and dune scenes."
- **Risk Analysis**: Color tones + texture = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **18. crystal_clear (Sharp Clarity)**
- **ID**: `crystal_clear`
- **Category**: Clarity
- **Current Strength**: 0.65 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Enhance sharpness, remove haze, and boost clarity while keeping colors true to life."
- **Risk Analysis**: Sharpness + clarity = low identity risk
- **Recommended Strength**: 0.18 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.65` → `strength: 0.18`

### **19. ocean_breeze (Coastal Air)**
- **ID**: `ocean_breeze`
- **Category**: Nature
- **Current Strength**: 0.65 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Bright blues, soft whites, and airy highlights for a clean, coastal feel."
- **Risk Analysis**: Color tones + lighting = low identity risk
- **Recommended Strength**: 0.18 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.65` → `strength: 0.18`

### **20. sun_kissed (Warm Glow)**
- **ID**: `sun_kissed`
- **Category**: Warm
- **Current Strength**: 0.70 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Golden warmth, soft shadows, and glowing skin tones for outdoor sunlit photos."
- **Risk Analysis**: Lighting simulation = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **21. frost_light (Winter Chill)**
- **ID**: `frost_light`
- **Category**: Cool
- **Current Strength**: 0.70 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Cool blues and crisp whites for winter and mountain scenes, enhancing snow textures."
- **Risk Analysis**: Color tones + texture = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **22. cultural_glow (Cultural Heritage)**
- **ID**: `cultural_glow`
- **Category**: Travel
- **Current Strength**: 0.70 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Enhance traditional fabrics, patterns, and natural light to showcase cultural richness."
- **Risk Analysis**: Lighting enhancement = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **23. soft_skin_portrait (Natural Portrait)**
- **ID**: `soft_skin_portrait`
- **Category**: Portrait
- **Current Strength**: 0.65 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Smooth skin tones, natural color correction, and soft background blur for professional portraits."
- **Risk Analysis**: Skin smoothing + background blur = low identity risk
- **Recommended Strength**: 0.18 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.65` → `strength: 0.18`

### **24. rainy_day_mood (Rain Mood)**
- **ID**: `rainy_day_mood`
- **Category**: Moody
- **Current Strength**: 0.70 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Cool tones, soft reflections, and subtle raindrop texture for rainy street or nature scenes."
- **Risk Analysis**: Color tones + texture = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

### **25. street_story (Urban Portrait)**
- **ID**: `street_story`
- **Category**: Urban
- **Current Strength**: 0.75 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "High contrast, rich shadows, and enhanced textures for documentary-style street photography."
- **Risk Analysis**: Contrast + textures = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.75` → `strength: 0.20`

### **26. express_enhance (Express Enhance)**
- **ID**: `express_enhance`
- **Category**: Clarity
- **Current Strength**: 0.70 ✅ **MODERATE - LOW DRIFT RISK**
- **Positive Prompt**: "Quickly enhance sharpness, remove haze, and boost clarity for a more polished look."
- **Risk Analysis**: Sharpness + clarity = low identity risk
- **Recommended Strength**: 0.20 (within safe 0.12-0.22 range)
- **Patch**: `strength: 0.70` → `strength: 0.20`

---

## 📊 **SUMMARY STATISTICS**

- **Total Presets**: 26
- **High Risk (Immediate Fix)**: 3 presets (11.5%)
- **Moderate Risk (Fix Recommended)**: 6 presets (23.1%)
- **Low Risk (Minor Optimization)**: 17 presets (65.4%)

## 🚨 **CRITICAL ISSUES**

1. **B&W Conversion at 0.80 strength** = Major identity loss risk
2. **Color grading at 0.75 strength** = Moderate identity drift risk
3. **High strength values (0.65-0.80)** = Outside safe range (0.12-0.22)

## 🔧 **RECOMMENDED ACTIONS**

1. **Immediate**: Fix 3 high-risk presets (strength 0.80 → 0.22)
2. **Priority**: Fix 6 moderate-risk presets (strength 0.70-0.75 → 0.18-0.20)
3. **Optimization**: Adjust 17 low-risk presets to safe ranges
4. **Implement**: Server-side strength clamping to prevent future issues

## 📝 **TECHNICAL NOTES**

- **No negative prompts**: Not supported by current AIML setup
- **Strength clamping**: Already implemented server-side
- **Identity preservation**: Built into prompt templates
- **Mode-specific constraints**: Applied based on preset category
