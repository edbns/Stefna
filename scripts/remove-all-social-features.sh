#!/bin/bash
# Complete removal of ALL social media and unnecessary complex features

echo "🧹 COMPLETE SOCIAL FEATURE REMOVAL"
echo "=================================="
echo ""

# Components to remove
SOCIAL_COMPONENTS=(
  # Social sharing
  "src/components/ShareModal.tsx"
  "src/components/SocialIcons.tsx"
  
  # Notifications (social feature)
  "src/components/NotificationBell.tsx"
  
  # Token/Credit displays (can use simple credit display)
  "src/components/TokenCounter.tsx"
  "src/components/TokenUsageDisplay.tsx"
  "src/components/ProfileTokenDisplay.tsx"
  
  # User tiers/upgrades
  "src/components/AIUsageLimitModal.tsx"
  
  # Other unused
  "src/components/BufferSkeleton.tsx"
  "src/components/ProgressiveImageDemo.tsx"
  "src/components/PresetEngineDemo.tsx"
  "src/components/ValidationSummary.tsx"
)

# Services to check
SOCIAL_SERVICES=(
  "src/services/notificationService.ts"
  "src/services/socialService.ts"
  "src/services/shareService.ts"
)

echo "📋 Components to remove:"
for component in "${SOCIAL_COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo "  ✓ $component"
  else
    echo "  ✗ $component (not found)"
  fi
done

echo ""
echo "🗑️  Removing components..."

# Remove components
for component in "${SOCIAL_COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    rm "$component"
    echo "  ✓ Removed $component"
  fi
done

# Remove services
for service in "${SOCIAL_SERVICES[@]}"; do
  if [ -f "$service" ]; then
    rm "$service"
    echo "  ✓ Removed $service"
  fi
done

echo ""
echo "🔧 Cleaning up imports in HomeNew.tsx..."

# Clean HomeNew.tsx
if [ -f "src/components/HomeNew.tsx" ]; then
  # Remove ShareModal import
  sed -i '' '/import ShareModal/d' src/components/HomeNew.tsx
  
  # Remove share modal state (lines with shareModalOpen, shareModalMedia)
  sed -i '' '/shareModalOpen/d' src/components/HomeNew.tsx
  sed -i '' '/shareModalMedia/d' src/components/HomeNew.tsx
  sed -i '' '/setShareModalOpen/d' src/components/HomeNew.tsx
  sed -i '' '/setShareModalMedia/d' src/components/HomeNew.tsx
  
  # Remove ShareModal component usage
  sed -i '' '/<ShareModal/,/\/>/d' src/components/HomeNew.tsx
fi

echo ""
echo "🔧 Cleaning up imports in ProfileScreen.tsx..."

# Clean ProfileScreen.tsx
if [ -f "src/screens/ProfileScreen.tsx" ]; then
  # Remove imports
  sed -i '' '/import ProfileTokenDisplay/d' src/screens/ProfileScreen.tsx
  sed -i '' '/import.*SocialIcons/d' src/screens/ProfileScreen.tsx
  
  # Remove ProfileTokenDisplay usage
  sed -i '' '/<ProfileTokenDisplay/,/\/>/d' src/screens/ProfileScreen.tsx
fi

echo ""
echo "✅ Social features removed!"
echo ""
echo "📌 What's been removed:"
echo "- Social sharing modals"
echo "- Social media icons"
echo "- Notification system"
echo "- Complex token/credit displays"
echo "- User tier/upgrade modals"
echo "- Demo components"
echo ""
echo "🎯 Stefna is now a pure AI photo editing platform!"
