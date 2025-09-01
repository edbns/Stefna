#!/bin/bash
# Remove unused social media and complex components

echo "🧹 Removing Unused Components from Frontend"
echo "=========================================="
echo ""

# Components to remove
COMPONENTS=(
  "src/components/ContentReportModal.tsx"
  "src/components/AdminUpgrade.tsx"
  "src/components/DiscoverIcon.tsx"
  "src/components/CountdownTimer.tsx"
  "src/components/RemixButton.tsx"
  "src/components/RemixIcon.tsx"
  "src/services/contentModerationService.ts"
)

# Files that might import these components
FILES_TO_CHECK=(
  "src/components/MediaCard.tsx"
  "src/screens/ProfileScreen.tsx"
  "src/components/HomeNew.tsx"
  "src/App.tsx"
)

echo "📋 Components to remove:"
for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo "  ✓ $component"
  else
    echo "  ✗ $component (not found)"
  fi
done

echo ""
echo "🔍 Checking for imports..."

# Check for imports
for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    echo "Checking $file..."
    grep -E "ContentReportModal|AdminUpgrade|DiscoverIcon|CountdownTimer|RemixButton|RemixIcon|contentModerationService" "$file" || true
  fi
done

echo ""
echo "🗑️  Removing components..."

# Remove the components
for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    rm "$component"
    echo "  ✓ Removed $component"
  fi
done

echo ""
echo "🔧 Cleaning up imports..."

# Clean up MediaCard.tsx - remove RemixIcon import and usage
if [ -f "src/components/MediaCard.tsx" ]; then
  echo "Cleaning MediaCard.tsx..."
  # Remove import
  sed -i '' '/import RemixIcon/d' src/components/MediaCard.tsx
  # Remove remix button section (lines around the RemixIcon usage)
  sed -i '' '/{allowRemix && onRemix && (/,/<RemixIcon/d' src/components/MediaCard.tsx
fi

# Clean up ProfileScreen.tsx - remove AdminUpgrade state and usage
if [ -f "src/screens/ProfileScreen.tsx" ]; then
  echo "Cleaning ProfileScreen.tsx..."
  # Remove showAdminUpgrade state
  sed -i '' '/showAdminUpgrade/d' src/screens/ProfileScreen.tsx
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📌 Summary:"
echo "- Removed content reporting (not needed for AI photo editing)"
echo "- Removed admin upgrade tiers (unnecessary complexity)"
echo "- Removed discover icon (social feature)"
echo "- Removed countdown timer (unused)"
echo "- Removed remix buttons/icons (social feature)"
echo "- Removed content moderation service (social feature)"
