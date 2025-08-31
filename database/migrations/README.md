# Database Migrations

## Restore Original 25 Rotating Presets

**Problem:** The original 25 rotating presets were accidentally replaced with different presets.

**Solution:** This migration restores the original 25 rotating presets with proper weekly rotation.

### Original Presets (25 total, 5 per week):

#### Week 1 (Rotation Index 1-5):
1. **cinematic_glow** - Cinematic photo with soft lighting
2. **bright_airy** - Bright and airy portrait
3. **vivid_pop** - Vivid photo with bold colors
4. **vintage_film_35mm** - Analog 35mm film style
5. **tropical_boost** - Tropical color enhancement

#### Week 2 (Rotation Index 1-5):
1. **urban_grit** - Street style with strong shadows
2. **mono_drama** - Black and white portrait
3. **dreamy_pastels** - Pastel color tones
4. **golden_hour_magic** - Soft golden hour light
5. **high_fashion_editorial** - High fashion editorial photo

#### Week 3 (Rotation Index 1-5):
1. **moody_forest** - Dark green forest tones
2. **desert_glow** - Warm desert tones
3. **retro_polaroid** - Polaroid look with instant film
4. **crystal_clear** - Ultra clear portrait
5. **ocean_breeze** - Cool oceanic tones

#### Week 4 (Rotation Index 1-5):
1. **festival_vibes** - Energetic, colorful photo
2. **noir_classic** - Classic noir style
3. **sun_kissed** - Golden hour lighting
4. **frost_light** - Cool tones, diffused lighting
5. **neon_nights** - Urban night photo

#### Week 5 (Rotation Index 1-5):
1. **cultural_glow** - Rich skin tones
2. **soft_skin_portrait** - Natural portrait
3. **rainy_day_mood** - Blue-gray tones
4. **wildlife_focus** - Sharp detail on facial features
5. **street_story** - Photojournalism aesthetic

### How to Run the Migration:

**NEW SIMPLIFIED APPROACH:**

1. **Debug first (if having issues):**
   ```sql
   -- Run this to debug any column issues:
   \i database/migrations/debug-preset-issue.sql
   ```

2. **Run the comprehensive fix:**
   ```sql
   -- This handles everything automatically:
   \i database/migrations/fix-preset-system.sql
   ```

3. **Quick verification:**
   ```sql
   -- Simple verification that always works:
   \i database/migrations/simple-verify.sql
   ```

**OLD STEP-BY-STEP (if you prefer manual control):**

1. **Check table structure first:**
   ```sql
   -- Run this to see what columns exist:
   \i database/migrations/check-table-structure.sql
   ```

2. **Add missing columns (if needed):**
   ```sql
   -- Only run this if preset_week or preset_rotation_index columns are missing:
   \i database/migrations/add-missing-preset-columns.sql
   ```

3. **Restore the original presets:**
   ```sql
   -- Run this to restore the 25 original rotating presets:
   \i database/migrations/restore-original-presets.sql
   ```

4. **Verify the results:**
   ```sql
   -- Run this to verify everything worked:
   \i database/migrations/verify-presets.sql
   ```

**Quick verification query:**
```sql
SELECT preset_key, preset_name, preset_week, preset_rotation_index
FROM presets_config
ORDER BY preset_week, preset_rotation_index;
```

### Expected Results:
- **25 total presets** (clean rotating system only)
- **5 presets per week** for 5 weeks
- **Weekly rotation system** working properly
- **Frontend will automatically load** the correct presets

### Standalone Modes (Separate Systems):
- **Ghibli Reaction** (3 presets) - handled separately from main rotation
- **Emotion Mask** (5 presets) - handled separately from main rotation
- **Neo Glitch** (4 presets) - handled separately from main rotation

The main presets mode now uses exactly 25 rotating presets with clean separation from standalone modes.
