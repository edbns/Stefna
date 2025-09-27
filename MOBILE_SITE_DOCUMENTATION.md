# Mobile Site Documentation

## Overview

The mobile site is a responsive version of the Stefna AI art generation platform, optimized for mobile devices with a simplified UI and touch-friendly interactions. It provides the same core functionality as the desktop version but with a streamlined mobile-first design.

## Architecture

### Mobile-Specific Components

#### 1. MobileFloatingNav (`src/components/MobileFloatingNav.tsx`)
- **Purpose**: Floating navigation buttons for mobile users
- **Features**:
  - Upload button (always visible)
  - Login/Profile button (context-aware)
  - Logout button (when authenticated)
  - Loading spinner around profile icon during generation
- **Props**:
  - `isGenerating`: Shows spinner around profile icon
  - `onUploadClick`, `onProfileClick`, `onLoginClick`, `onLogoutClick`: Event handlers

#### 2. LayeredComposer (Mobile Integration)
- **Purpose**: Unified AI art generation interface for both desktop and mobile
- **Mobile Features**:
  - File picker integration
  - Mode selection (Custom, Studio, Presets, Unreal Reflection, Parallel Self, Ghibli Reaction, Neo Tokyo Glitch)
  - Database presets loading
  - Local presets for specific modes
  - Prompt enhancement (magic wand)
  - Touch-friendly UI
- **Key Implementation**:
  - Uses `presetsService.getAvailablePresets()` for database presets
  - Uses local preset files for specific modes
  - Passes `preset.key` (not `preset.id`) for database presets
  - Auto-triggers file picker when opened

#### 3. MobileGalleryScreen (`src/screens/MobileGalleryScreen.tsx`)
- **Purpose**: Mobile-optimized gallery/profile page
- **Features**:
  - 2-column masonry layout
  - Infinite scroll with intersection observer
  - Media viewer with navigation
  - Download, share, and delete actions
  - Generation loading overlay
  - User profile information (tokens, invite, share to feed toggle)
- **Key Implementation**:
  - Uses same infinite scroll pattern as home page
  - Listens to `generation:start` and `generation:done` events
  - Sorts media by `created_at DESC` (newest first)
  - Downloads use proper blob URLs for mobile compatibility

#### 4. MobileFeed (`src/components/MobileFeed.tsx`)
- **Purpose**: Mobile-optimized feed display
- **Features**:
  - Single column layout
  - Infinite scroll support
  - Media type badges
  - Like functionality
- **Props**:
  - `onLastItemRef`: For infinite scroll intersection observer
  - `isLoadingMore`, `hasMoreFeed`: Loading states

### Mobile Detection

#### useIsMobile Hook (`src/hooks/useResponsive.ts`)
```typescript
const isMobile = useIsMobile();
```
- Detects mobile devices based on screen width
- Used throughout the app to conditionally render mobile components

### Mobile Routing

#### MobileRouteGuard (`src/components/MobileRouteGuard.tsx`)
- **Purpose**: Ensures mobile users only access mobile-optimized routes
- **Behavior**: Redirects mobile users away from desktop-only routes
- **Routes**: `/gallery` (mobile gallery), `/auth` (authentication)

## Generation Flow

### Mobile Generation Process

1. **User opens LayeredComposer**:
   - File picker auto-triggers (for editing modes)
   - User selects image from device OR types prompt (for Custom mode)

2. **Mode Selection**:
   - Database presets load for "Presets" mode
   - Local presets load for specific modes (Unreal, Parallel, Ghibli, Neo Tokyo)

3. **Generation Trigger**:
   - `onGenerate` callback in HomeNew.tsx
   - Maps mobile composer parameters to `dispatchGenerate` format
   - Redirects to gallery immediately

4. **Gallery Loading State**:
   - `generationStart()` event dispatched
   - Mobile gallery shows loading overlay
   - User sees "Generating your media..." spinner

5. **Generation Completion**:
   - `generationDone()` event dispatched
   - Loading overlay disappears
   - "Your media is ready" notification appears
   - User can tap notification to view media

### Generation Events System

#### Event Dispatch (`src/lib/generationEvents.ts`)
```typescript
import { generationStart, generationDone } from '../lib/generationEvents';

// When generation starts
generationStart({ kind: 'image' });

// When generation completes
generationDone({ kind: 'image' });
```

#### Event Listening (MobileGalleryScreen)
```typescript
useEffect(() => {
  const handleGenerationStart = () => setIsGenerating(true);
  const handleGenerationEnd = () => setIsGenerating(false);

  window.addEventListener('generation:start', handleGenerationStart);
  window.addEventListener('generation:done', handleGenerationEnd);

  return () => {
    window.removeEventListener('generation:start', handleGenerationStart);
    window.removeEventListener('generation:done', handleGenerationEnd);
  };
}, []);
```

## Preset System

### Database Presets
- **Source**: `presetsService.getAvailablePresets()`
- **Usage**: General "Presets" mode
- **Key**: Use `preset.key` for generation (not `preset.id`)
- **Loading**: Triggered when composer opens and when preset modes are selected

### Local Presets
- **Unreal Reflection**: `src/presets/unrealReflection.ts`
- **Parallel Self**: `src/presets/parallelSelf.ts`
- **Ghibli Reaction**: `src/presets/ghibliReact.ts`
- **Neo Tokyo Glitch**: `src/presets/neoTokyoGlitch.ts`

### Preset Loading Logic
```typescript
// Load database presets when composer opens
useEffect(() => {
  if (isOpen) {
    loadDatabasePresets();
  }
}, [isOpen]);

// Load presets when preset modes are selected
useEffect(() => {
  if (['presets', 'unrealreflection', 'ghiblireact', 'neotokyoglitch', 'parallelself'].includes(selectedMode)) {
    loadDatabasePresets();
  }
}, [selectedMode]);
```

## Infinite Scroll Implementation

### Home Page Pattern (Copied to Mobile Gallery)
```typescript
// State
const [lastItemRef, setLastItemRef] = useState<HTMLDivElement | null>(null);

// Intersection Observer
useEffect(() => {
  if (!lastItemRef) return;
  
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMoreMedia && !isLoadingMore) {
        loadMoreMedia();
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(lastItemRef);
  return () => observer.disconnect();
}, [lastItemRef, hasMoreMedia, isLoadingMore]);

// Ref Assignment
ref={index === userMedia.length - 1 ? setLastItemRef : null}
```

## Download System

### Mobile Download Implementation
```typescript
const handleDownload = async (media: UserMedia) => {
  try {
    const imageUrl = toAbsoluteCloudinaryUrl(media.url) || media.url;
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `stefna-${media.id}.${media.type === 'video' ? 'mp4' : 'jpg'}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    // Error handling
  }
};
```

### Key Points:
- Uses blob URLs for proper mobile download behavior
- Creates temporary download link
- Cleans up blob URL after download
- Works on both mobile and desktop

## Mobile-Specific Styling

### CSS Classes
- **Full-screen layouts**: `fixed inset-0`
- **Touch-friendly buttons**: Minimum 44px touch targets
- **Mobile spacing**: `px-4 py-4` for consistent padding
- **Masonry layout**: `columns-2 gap-3` for 2-column grid

### Responsive Design
- **Mobile-first**: Components designed for mobile, enhanced for desktop
- **Touch interactions**: No hover states, touch-optimized
- **Viewport**: `user-scalable=no, orientation=portrait` to prevent rotation

## API Integration

### Mobile-Specific Endpoints
- **User Media**: `/.netlify/functions/getUserMedia?userId=${userId}&limit=20&offset=${offset}&sort=created_at&order=desc`
- **Presets**: Uses same `presetsService` as desktop
- **Generation**: Same `dispatchGenerate` function as desktop

### Data Transformation
```typescript
// Transform database media to UserMedia format
const transformedMedia: UserMedia[] = dbMedia.map((item: any) => ({
  id: item.id,
  userId: item.userId,
  type: item.mediaType || item.type || 'photo',
  url: toAbsoluteCloudinaryUrl(item.finalUrl) || item.finalUrl,
  prompt: item.prompt || (item.presetKey ? `Generated with ${item.presetKey}` : 'AI Generated Content'),
  // ... other fields
}));
```

## Error Handling

### Mobile-Specific Error States
- **No media**: Empty state with "No media yet" message
- **Loading errors**: Skeleton loading with error fallback
- **Generation errors**: Toast notifications with retry options
- **Network errors**: Graceful degradation

## Performance Considerations

### Mobile Optimizations
- **Lazy loading**: Images load with `loading="lazy"`
- **Blob cleanup**: Proper cleanup of blob URLs
- **Event cleanup**: Remove event listeners on unmount
- **Intersection observer**: Efficient infinite scroll implementation

### Memory Management
- **Blob URLs**: Always revoked after use
- **Event listeners**: Properly cleaned up
- **State updates**: Batched updates to prevent excessive re-renders

## Testing Checklist

### Mobile Generation Flow
- [ ] File picker opens when composer opens
- [ ] Database presets load and display
- [ ] Local presets work for specific modes
- [ ] Generation redirects to gallery
- [ ] Loading overlay appears during generation
- [ ] Notification appears when complete
- [ ] Media appears in gallery after generation

### Mobile Gallery
- [ ] Infinite scroll loads more media
- [ ] Media sorts by newest first
- [ ] Download saves to device
- [ ] Share works with native share API
- [ ] Delete removes media
- [ ] Media viewer opens and navigates

### Mobile Navigation
- [ ] Floating nav shows correct buttons
- [ ] Upload opens composer
- [ ] Profile opens gallery
- [ ] Login redirects to auth
- [ ] Logout works correctly

## Common Issues and Solutions

### Issue: "Invalid mode" error
**Solution**: Ensure database presets use `preset.key` not `preset.id`

### Issue: Generation not showing loading spinner
**Solution**: Verify `generationStart()` and `generationDone()` events are dispatched

### Issue: Infinite scroll not working
**Solution**: Check intersection observer dependencies and ref assignment

### Issue: Download not working on mobile
**Solution**: Use blob URLs and proper download attributes

### Issue: Presets not loading
**Solution**: Verify `presetsService.getAvailablePresets()` is called correctly

## Future Enhancements

### Potential Improvements
- **Offline support**: Cache media for offline viewing
- **Push notifications**: Real-time generation updates
- **Progressive Web App**: Installable mobile app
- **Advanced gestures**: Swipe navigation, pinch to zoom
- **Dark mode**: System preference detection

### Performance Optimizations
- **Image optimization**: WebP format, responsive images
- **Code splitting**: Lazy load mobile components
- **Service worker**: Background sync for uploads
- **Memory optimization**: Virtual scrolling for large galleries

## Conclusion

The mobile site provides a complete AI art generation experience optimized for mobile devices. It maintains feature parity with the desktop version while offering a streamlined, touch-friendly interface. The implementation follows React best practices with proper state management, event handling, and performance optimizations.

For questions or issues, refer to the component documentation and test the complete generation flow from composer to gallery.

