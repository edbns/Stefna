#!/bin/bash

# AIML API Smoke Tests
# Test both T2I and I2I endpoints to verify the schema fixes

echo "🧪 Testing AIML API endpoints..."
echo "================================"

# Test 1: T2I (Text-to-Image) - Custom Prompt
echo ""
echo "📝 Test 1: Text-to-Image Generation"
echo "-----------------------------------"

# Local test
echo "🌐 Local (Netlify dev):"
curl -sS -X POST http://localhost:8888/.netlify/functions/aimlApi \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "a neon macaw perched on a synthwave palm, cinematic lighting",
    "negative_prompt": "watermark, text, frame",
    "guidance_scale": 7.5,
    "steps": 36,
    "width": 832,
    "height": 1216,
    "userId": "test-user",
    "source": "smoke-test"
  }' | jq '.'

echo ""
echo "☁️  Production:"
curl -sS -X POST https://your-site.netlify.app/.netlify/functions/aimlApi \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "a neon macaw perched on a synthwave palm, cinematic lighting",
    "negative_prompt": "watermark, text, frame",
    "guidance_scale": 7.5,
    "steps": 36,
    "width": 832,
    "height": 1216,
    "userId": "test-user",
    "source": "smoke-test"
  }' | jq '.'

# Test 2: I2I (Image-to-Image) - Remix
echo ""
echo "🎨 Test 2: Image-to-Image Generation"
echo "------------------------------------"

# Local test
echo "🌐 Local (Netlify dev):"
curl -sS -X POST http://localhost:8888/.netlify/functions/aimlApi \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "studio ghibli style, soft rim light, lush greens",
    "image_url": "https://res.cloudinary.com/demo/image/upload/v123/example.jpg",
    "strength": 0.82,
    "steps": 32,
    "userId": "test-user",
    "source": "smoke-test"
  }' | jq '.'

echo ""
echo "☁️  Production:"
curl -sS -X POST https://your-site.netlify.app/.netlify/functions/aimlApi \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "studio ghibli style, soft rim light, lush greens",
    "image_url": "https://res.cloudinary.com/demo/image/upload/v123/example.jpg",
    "strength": 0.82,
    "steps": 32,
    "userId": "test-user",
    "source": "smoke-test"
  }' | jq '.'

echo ""
echo "✅ Smoke tests completed!"
echo ""
echo "Expected results:"
echo "- Status: 200 OK"
echo "- Body: JSON with result_url field"
echo "- No 400 validation errors"
echo ""
echo "If you see 400 errors, check the error message for specific field validation issues."
