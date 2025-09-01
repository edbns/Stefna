#!/bin/bash
# MASSIVE CLEANUP - Remove all redundant services and complexity

echo "🔥 STARTING MASSIVE CLEANUP - NO MORE DRAMA!"
echo "==========================================="
echo ""

# Services to DELETE (keeping only the essentials)
SERVICES_TO_DELETE=(
  # AI/Generation services - we only need simpleGenerationService
  "src/services/aiGenerationService.ts"
  "src/services/advancedAiService.ts"
  "src/services/presetsService.ts"
  "src/services/identityPreservationService.ts"
  "src/services/generationPipeline.ts"
  
  # File/Media services - too many doing the same thing
  "src/services/media.ts"
  "src/services/mediaSource.ts"
  "src/services/source.ts"
  "src/services/sourceFile.ts"
  "src/services/prompt.ts"
  
  # Social/Complex features
  "src/services/captionService.ts"
  "src/services/interactionService.ts"
  "src/services/videoService.ts"
  
  # Unused
  "src/services/infer-params.ts"
  "src/services/presets.ts"
  "src/services/tokenService.ts"
)

# ESSENTIAL services to keep
echo "📋 Services to KEEP (the essentials):"
echo "  ✓ simpleGenerationService.ts - ALL generation goes through this"
echo "  ✓ authService.ts - Authentication"
echo "  ✓ userMediaService.ts - Fetching user's media"
echo "  ✓ uploadSource.ts - Cloudinary uploads"
echo "  ✓ fileUploadService.ts - Basic file handling"
echo "  ✓ authBootstrap.ts - Auth initialization"
echo "  ✓ appBootstrap.ts - App initialization"
echo ""

echo "🗑️  Deleting redundant services..."
for service in "${SERVICES_TO_DELETE[@]}"; do
  if [ -f "$service" ]; then
    rm "$service"
    echo "  ✓ Deleted $service"
  fi
done

echo ""
echo "✅ Services cleaned up!"
echo ""

# Now update imports in HomeNew.tsx
echo "🔧 Updating HomeNew.tsx imports..."

# Create a cleaner version of HomeNew imports
cat > src/components/HomeNew_imports_clean.txt << 'EOF'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, FileText, ArrowUp } from 'lucide-react'
import { authenticatedFetch } from '../utils/apiClient'
import authService from '../services/authService'
import MasonryMediaGrid from './MasonryMediaGrid'
import SkeletonGrid from './SkeletonGrid'
import type { UserMedia } from '../services/userMediaService'
import { useToasts } from './ui/Toasts'
import ProfileIcon from './ProfileIcon'
import { useProfile } from '../contexts/ProfileContext'
import SimpleGenerationService, { GenerationMode } from '../services/simpleGenerationService'
import { useSelectedPreset } from '../stores/selectedPreset'
import { HiddenUploader } from './HiddenUploader'
import { uploadSourceToCloudinary } from '../services/uploadSource'
import { useGenerationMode } from '../stores/generationMode'
import { EmotionMaskPicker } from './EmotionMaskPicker'
import { GhibliReactionPicker } from './GhibliReactionPicker'
import { NeoTokyoGlitchPicker } from './NeoTokyoGlitchPicker'
import { MediaUploadAgreement } from './MediaUploadAgreement'
import { EMOTION_MASK_PRESETS } from '../presets/emotionmask'
import { GHIBLI_REACTION_PRESETS } from '../presets/ghibliReact'
import { NEO_TOKYO_GLITCH_PRESETS } from '../presets/neoTokyoGlitch'
import FullScreenMediaViewer from './FullScreenMediaViewer'
import userMediaService from '../services/userMediaService'

const generateRunId = () => `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
EOF

echo ""
echo "📦 Next steps:"
echo "1. Manually update HomeNew.tsx to use only simpleGenerationService"
echo "2. Break down HomeNew.tsx into smaller components"
echo "3. Remove all complex state management"
echo ""
echo "🎯 Goal: Simple flow -> User picks mode → Upload → Generate → Show result"
