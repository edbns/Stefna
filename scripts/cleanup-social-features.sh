#!/bin/bash
# Cleanup script to remove all social media features from backend
# Focus: Pure AI photo editing, no social features

echo "🧹 Removing Social Media Features from Backend"
echo "=============================================="
echo ""

# List of files that need cleanup
echo "📋 Files that reference removed features:"
echo ""

# Find all references
grep -r "avatar_url\|avatarUrl\|allow_remix\|allowRemix\|username\|userName" netlify/functions/ --include="*.ts" -n | grep -v "Binary file"

echo ""
echo "🔧 Starting cleanup..."
echo ""

# 1. Fix update-profile.ts
echo "1. Fixing update-profile.ts..."
sed -i '' '
s/username?: string;//g
s/avatar_url?: string;//g
s/allow_remix?: boolean;//g
' netlify/functions/update-profile.ts

sed -i '' "s/username: body.username || \`User \${uid}\`/name: null/" netlify/functions/update-profile.ts

# 2. Fix getUserMedia.ts - remove allowRemix
echo "2. Fixing getUserMedia.ts..."
sed -i '' 's/allowRemix: false,//g' netlify/functions/getUserMedia.ts

# 3. Fix _lib/auth.ts
echo "3. Fixing _lib/auth.ts..."
sed -i '' "s/avatar_url: string | null }>/}>/g" netlify/functions/_lib/auth.ts
sed -i '' 's/avatar_url: null//g' netlify/functions/_lib/auth.ts

# 4. Fix admin-users.ts
echo "4. Fixing admin-users.ts..."
sed -i '' "s/, u.avatar_url//g" netlify/functions/admin-users.ts
sed -i '' 's/avatarUrl: user.avatar_url,//g' netlify/functions/admin-users.ts

echo ""
echo "✅ Backend cleanup complete!"
echo ""
echo "🔍 Verifying cleanup..."
echo ""

# Verify cleanup
REMAINING=$(grep -r "avatar_url\|avatarUrl\|allow_remix\|allowRemix\|username\|userName" netlify/functions/ --include="*.ts" | grep -v "Binary file" | wc -l)

if [ $REMAINING -eq 0 ]; then
    echo "✅ All social media references removed from backend!"
else
    echo "⚠️  Still found $REMAINING references. Manual review needed:"
    grep -r "avatar_url\|avatarUrl\|allow_remix\|allowRemix\|username\|userName" netlify/functions/ --include="*.ts" -n | grep -v "Binary file"
fi

echo ""
echo "📌 Next steps:"
echo "1. Test all functions to ensure they work"
echo "2. Update any frontend code that expects these fields"
echo "3. Consider removing related database columns"
