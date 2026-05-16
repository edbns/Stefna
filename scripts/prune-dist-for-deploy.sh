#!/bin/bash
# Shrink dist before Netlify upload (Lab site does not need legacy marketing assets).
set -euo pipefail

if [[ ! -d dist ]]; then
  echo "⚠️  [prune-dist] No dist/ directory — skipping"
  exit 0
fi

echo "🧹 [prune-dist] Removing legacy assets from dist..."

# Unused marketing PNGs (~10MB total)
rm -f \
  dist/images/Feed.png \
  dist/images/Abstract.png \
  dist/images/Remix.png \
  dist/images/"Ai brush.png" \
  dist/images/"Social sharing.png"

# Duplicate / legacy brand files (Lab uses logo-new + fav-icon + og-image-new)
rm -f \
  dist/logonew.png \
  dist/logo-dark.png \
  dist/logo-dark.webp \
  dist/logo.png \
  dist/logo.webp \
  dist/favicon.png \
  dist/favicon.webp \
  dist/og-image.jpg \
  dist/og-image.webp

find dist -name '.DS_Store' -delete 2>/dev/null || true

echo "📦 [prune-dist] dist size after prune:"
du -sh dist
du -sh dist/images 2>/dev/null || true
