# 🎨 25-PRESET ENGINE – Drop-In Feature for Stefna

A smart preset system with 6-theme-based rotations, visual labels, and API-friendly mapping. Your developer won't need to guess anything — just plug and go.

## 🎯 Goals

- ✅ Store all 25 presets as reusable keys
- ✅ Support 6 active rotating presets (per theme config)
- ✅ Allow visual labeling: name + thumbnail
- ✅ Output a consistent object for AI API
- ✅ Smart rotation system with localStorage persistence
- ✅ Advanced search and filtering capabilities
- ✅ Category-based organization
- ✅ Professional-grade preset management

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# All dependencies are already included in your existing setup
npm install
```

### 2. Import and Use
```tsx
import { PresetSelector } from './components/PresetSelector';
import { usePresetEngine } from './hooks/usePresetEngine';

function MyComponent() {
  const { selectPreset, activePresets } = usePresetEngine();
  
  return (
    <PresetSelector 
      onSelect={selectPreset}
      showRotationControls={true}
      showSearch={true}
      showCategories={true}
    />
  );
}
```

## 📁 File Structure

```
src/
├── config/
│   ├── professional-presets.ts     # ✅ Already exists - 25 presets
│   └── presetEngine.ts            # 🆕 Enhanced preset engine
├── components/
│   ├── PresetSelector.tsx         # 🆕 Main preset selector UI
│   └── PresetEngineDemo.tsx      # 🆕 Demo page
└── hooks/
    └── usePresetEngine.ts         # 🆕 Integration hooks
```

## 🔧 Core Components

### 1. Preset Engine (`presetEngine.ts`)
The heart of the system that manages:
- **25 Professional Presets** from your existing system
- **Smart Rotation** with 24h intervals
- **Category Management** across 15 categories
- **API Integration** with consistent output format

### 2. Preset Selector (`PresetSelector.tsx`)
Professional UI component featuring:
- **Visual Grid Layout** with thumbnails
- **Rotation Controls** (force/reset)
- **Advanced Search** by name, description, features
- **Category Filtering** with counts
- **View Modes** (Active, Featured, All)

### 3. Integration Hooks (`usePresetEngine.ts`)
Multiple specialized hooks:
- `usePresetEngine()` - Main preset management
- `usePresetAPI()` - API integration
- `usePresetRotation()` - Rotation management
- `usePresetSearch()` - Search and filtering

## 📊 Output Format

### Preset Selection Returns:
```typescript
{
  presetKey: string,           // 'cinematic_glow', etc.
  displayName: string,         // 'Cinematic Glow'
  category: 'Cinematic' | 'Vibrant' | 'Minimalist' | 'Vintage' | 'Travel' | 'Nature' | 'Portrait' | 'Urban' | 'Black & White' | 'Soft' | 'Warm' | 'Editorial' | 'Clarity' | 'Cool' | 'Moody',
  thumbnail: string,           // '/presets/cinematic_glow.png'
  promptFragment: string,      // 'cinematic lighting, moody depth, soft bokeh'
  strength: number,            // 0.45 (45%)
  model: string,               // 'flux/dev'
  features: string[],          // ['cinematic', 'color_grading', 'warm_highlights']
  description: string          // 'Cinematic grading, warm highlights, deep shadows…'
}
```

### API Usage:
```typescript
// On selection:
const payload = {
  image: uploadedImage,
  presetKey: selectedPreset.key,
  promptAddition: selectedPreset.promptFragment,
  strength: selectedPreset.strength,
  model: selectedPreset.model,
  features: selectedPreset.features,
  category: selectedPreset.category
};

// Generate enhanced prompt:
const fullPrompt = `photo of a person, ${selectedPreset.promptFragment}, high detail`;
```

## 🎭 Preset Categories

Your 25 presets are organized into **15 professional categories**:

| Category | Count | Examples |
|----------|-------|----------|
| **Cinematic** | 1 | Cinematic Glow |
| **Vibrant** | 2 | Vivid Pop, Festival Vibes |
| **Minimalist** | 1 | Bright & Airy |
| **Vintage** | 2 | Vintage Film 35mm, Retro Polaroid |
| **Travel** | 4 | Tropical Boost, Desert Glow, Ocean Breeze, Cultural Glow |
| **Nature** | 2 | Moody Forest, Wildlife Focus |
| **Portrait** | 1 | Soft Skin Portrait |
| **Urban** | 3 | Urban Grit, Neon Nights, Street Story |
| **Black & White** | 2 | Mono Drama, Noir Classic |
| **Soft** | 1 | Dreamy Pastels |
| **Warm** | 2 | Golden Hour Magic, Sun-Kissed |
| **Editorial** | 1 | High Fashion Editorial |
| **Clarity** | 1 | Crystal Clear |
| **Cool** | 1 | Frost & Light |
| **Moody** | 1 | Rainy Day Mood |

## 🔄 Smart Rotation System

### Automatic Rotation
- **24-hour intervals** for fresh preset selection
- **Category-based rotation** ensures variety
- **localStorage persistence** maintains state

### Manual Control
- **Force Rotation** button for immediate changes
- **Reset Rotation** to return to defaults
- **Real-time status** showing next rotation time

### Rotation Logic
```typescript
// Each category rotates independently
themeRotation: {
  'Cinematic': 0,      // First preset in category
  'Vibrant': 1,        // Second preset in category
  'Portrait': 0,       // First preset in category
  // ... continues for all categories
}
```

## 🔍 Advanced Search & Filtering

### Search Capabilities
- **Name search** - Find presets by display name
- **Description search** - Search within preset descriptions
- **Feature search** - Find presets by specific features
- **Real-time results** - Instant search feedback

### Category Filtering
- **15 category filters** with preset counts
- **All presets view** for complete browsing
- **Active presets** showing current rotation
- **Featured presets** highlighting top selections

### Search Examples
```typescript
// Search by feature
searchPresets('cinematic')     // Returns: Cinematic Glow
searchPresets('vintage')       // Returns: Vintage Film 35mm, Retro Polaroid
searchPresets('portrait')      // Returns: Soft Skin Portrait

// Search by description
searchPresets('warm')          // Returns: Golden Hour Magic, Sun-Kissed
searchPresets('moody')         // Returns: Moody Forest, Rainy Day Mood
```

## 🎨 Visual Design Features

### Thumbnail System
- **Professional previews** for each preset
- **Fallback placeholders** when images unavailable
- **Responsive grid layout** (1-5 columns based on screen size)
- **Hover effects** with scale and shadow animations

### UI Components
- **Category badges** with color coding
- **Strength indicators** with progress bars
- **Feature tags** showing preset capabilities
- **Rotation status** with countdown timers

## 🚀 API Integration

### Direct Integration
```typescript
import { getPresetForAPI, generatePrompt } from '../config/presetEngine';

// Get preset data for API
const presetData = getPresetForAPI('cinematic_glow');

// Generate enhanced prompt
const enhancedPrompt = generatePrompt('photo of a person', 'cinematic_glow');
// Result: "photo of a person, cinematic color grading, warm highlights, deep shadows, rich blacks, subtle teal-orange balance, natural faces, high detail"
```

### Hook-Based Integration
```typescript
import { usePresetAPI } from '../hooks/usePresetEngine';

function MyComponent() {
  const { selectedPreset, apiPayload, generateAPIPayload } = usePresetAPI();
  
  const handleImageUpload = (image: File) => {
    if (selectedPreset) {
      const payload = generateAPIPayload(image, selectedPreset.key);
      // Send to your AI API
      sendToAI(payload);
    }
  };
}
```

## 📱 Responsive Design

### Grid Layout
- **Mobile**: 1 column
- **Small**: 2 columns  
- **Medium**: 3 columns
- **Large**: 4 columns
- **Extra Large**: 5 columns

### Touch-Friendly
- **Large touch targets** for mobile devices
- **Smooth animations** with CSS transitions
- **Accessible controls** with proper ARIA labels

## 🧪 Testing & Development

### Local Testing
```bash
# Build the project
npm run build

# Test the preset engine
node scripts/test-preset-engine.js
```

### Component Testing
```tsx
// Test preset selection
<PresetSelector 
  onSelect={(preset) => console.log('Selected:', preset)}
  showRotationControls={true}
  showSearch={true}
  showCategories={true}
/>

// Test with custom styling
<PresetSelector 
  className="custom-preset-selector"
  showRotationControls={false}
  showSearch={false}
/>
```

## 🔧 Customization Options

### Preset Selector Props
```typescript
interface PresetSelectorProps {
  onSelect: (preset: PresetOption) => void;
  showAllPresets?: boolean;           // Default: false
  showRotationControls?: boolean;     // Default: true
  showSearch?: boolean;               // Default: true
  showCategories?: boolean;           // Default: true
  className?: string;                 // Custom CSS classes
}
```

### Rotation Configuration
```typescript
// Customize rotation interval
const config = {
  rotationInterval: 12, // 12 hours instead of 24
  // ... other options
};
```

## 📊 Performance Features

### Optimization
- **Lazy loading** of preset data
- **Debounced search** for better performance
- **Memoized calculations** for rotation logic
- **Efficient re-renders** with React hooks

### Memory Management
- **localStorage cleanup** on rotation
- **Interval cleanup** in useEffect
- **State optimization** for large preset lists

## 🚀 Deployment

### Netlify Ready
- **No backend required** - works entirely client-side
- **localStorage persistence** maintains user preferences
- **CDN-friendly** thumbnail system
- **Build optimization** for production

### Optional Backend Integration
If you want to store rotation data server-side:
```typescript
// Replace localStorage with API calls
const saveRotationConfig = async (config) => {
  await fetch('/api/preset-rotation', {
    method: 'POST',
    body: JSON.stringify(config)
  });
};
```

## 🔮 Future Enhancements

### Planned Features
- **User preference storage** in database
- **Preset rating system** with user feedback
- **Custom preset creation** by users
- **Preset sharing** between users
- **Advanced analytics** for preset usage

### Extension Points
- **Plugin system** for custom preset types
- **API integrations** with external preset libraries
- **Machine learning** for smart preset recommendations
- **Social features** for preset discovery

## 📚 API Reference

### Core Functions
```typescript
// Get active presets (current rotation)
getActivePresets(): ActivePresetResult[]

// Get preset by key
getPresetByKey(key: ProfessionalPresetKey): PresetOption | undefined

// Search presets
searchPresets(query: string): PresetOption[]

// Force rotation
forceRotation(): void

// Get rotation status
getRotationStatus(): RotationStatus
```

### Hook Functions
```typescript
// Main preset engine hook
usePresetEngine(): PresetEngineState & PresetEngineActions

// API integration hook
usePresetAPI(): { selectedPreset, apiPayload, ... }

// Rotation management hook
usePresetRotation(): { rotationStatus, forceRotation, ... }

// Search and filtering hook
usePresetSearch(): { searchQuery, searchResults, ... }
```

## 🎯 Summary

The **25-PRESET ENGINE** gives you:

✅ **25 Professional Presets** - Ready to use  
✅ **Smart Rotation System** - 6 presets active at once  
✅ **Visual Interface** - Thumbnails and categories  
✅ **API Integration** - Consistent output format  
✅ **Advanced Search** - Find presets quickly  
✅ **Responsive Design** - Works on all devices  
✅ **No Backend Required** - Netlify ready  
✅ **Extensible Architecture** - Easy to customize  

**Your developer can now plug this system directly into your AI generation pipeline with zero guesswork!** 🚀

---

**This completes the 25-PRESET ENGINE!** 🎨✨
