# Stefna — AI‑Powered Photo & Video Creation Platform

Bringing your photos to life with image‑to‑image (I2I) and image‑to‑video (I2V) transformations.

> **Key rule:** Stefna never does text‑to‑image. **Nothing works without media** (photo/video) supplied by the user or selected from the feed.

---

## 🎯 Core Purpose

Stefna transforms **existing media** into elevated edits or short animated videos. Users upload a photo/video or remix from the public feed, apply a **custom prompt** or a **preset**, and Stefna handles the full I2I/I2V pipeline.

---

## ✨ Main Features

### 🖼️ Media Upload & Animation

* Upload photos for AI editing (I2I)
* Upload videos → **smart frame extraction** → animate via I2V
* Remix any public item (if creator enabled remixing)
* Private **All Media** library + Public Feed

### 🎨 AI‑Powered Transformations

* **Custom Prompts** or one‑click **Preset Styles** (catalog below)
* **Image‑to‑Video**: animate static images with motion (Kling v1.6)
* Always I2I/I2V – never text‑only generation

### 👥 Users & Privacy

* Profiles, preferences, quotas
* **Share to Feed** (on/off)
* **Allow Remix** (requires Share ON)
* RLS‑enforced privacy; users only see their own private media by default

---

## 🔄 Preset System (6‑at‑a‑time Rotation)

Stefna rotates **six active presets** at any time for a focused, uncluttered UX. The rotation is deterministic by day (configurable to weekly). All presets are flagged for **isVideo: true** to ensure compatibility with the I2V pipeline.

**Preset Catalog**

1. Cinematic Glow
2. Bright & Airy
3. Vivid Pop
4. Vintage Film 35mm
5. Tropical Boost
6. Urban Grit
7. Mono Drama
8. Dreamy Pastels
9. Golden Hour Magic
10. High Fashion Editorial
11. Moody Forest
12. Desert Glow
13. Retro Polaroid
14. Crystal Clear
15. Ocean Breeze
16. Festival Vibes
17. Noir Classic
18. Sun‑Kissed
19. Frost & Light
20. Neon Nights
21. Cultural Glow
22. Soft Skin Portrait
23. Rainy Day Mood
24. Wildlife Focus
25. Street Story

> Full prompt definitions live in `src/config/presets.ts`. Example rotation helper below.

```ts
// src/utils/rotation.ts
export function getActivePresets(all: any[], opts?: { now?: Date; groupSize?: number; seed?: number }) {
  const now = opts?.now ?? new Date();
  const n = Math.max(1, Math.min(opts?.groupSize ?? 6, all.length));
  const seed = opts?.seed ?? 0;
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  const start = (dayIndex + seed) % all.length;
  return Array.from({ length: n }, (_, i) => all[(start + i) % all.length]);
}

// For weekly rotation, replace dayIndex with weekIndex:
// const weekIndex = Math.floor(Math.floor(now.getTime() / 86_400_000) / 7);
// const start = (weekIndex + seed) % all.length;
```

**Server example**

```ts
// netlify/functions/getPresets.ts
import { PRESET_LIST } from "../shared/presets"; // your catalog
import { getActivePresets } from "../../src/utils/rotation";

export const handler = async () => {
  const active = getActivePresets(PRESET_LIST, { groupSize: 6 });
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, count: active.length, keys: active.map(p => p.slug), sample: active.slice(0,3) })
  };
};
```

---

## 🏗️ Technical Architecture

* **Frontend:** React (Vite) + TypeScript + Tailwind; responsive and keyboard‑friendly
* **Backend:** Netlify Functions; JWT‑based auth; OTP verification
* **AI Vendor:** AIML API → **Kling v1.6** (image‑to‑video, pro/standard effects)
* **Media:** Cloudinary for secure uploads, hosting, and frame extraction
* **Database:** Supabase (Postgres) with RLS + service role for server work

---

## 🔌 Key Functions & Endpoints

All routes are Netlify Functions (adjust paths to your deploy). Example payloads are JSON.

### Auth & Profile

* `POST /.netlify/functions/request-otp` → email OTP
* `POST /.netlify/functions/verify-otp` → exchange OTP for JWT
* `GET  /.netlify/functions/get-user-profile` → profile data
* `GET  /.netlify/functions/getQuota` → usage/bandwidth limits
* `POST /.netlify/functions/check-tier-promotion` → promo logic

### Media

* `POST /.netlify/functions/cloudinary-sign` → signed upload params
* `GET  /.netlify/functions/getUserMedia` → private library
* `POST /.netlify/functions/delete-media` → delete by id
* `GET  /.netlify/functions/getPublicFeed?limit=50` → public feed

### Generation

* `POST /.netlify/functions/start-gen`

  * Body (image → video): `{ prompt, image_url, resource_type: "image" | "auto", preset, visibility }`
  * Body (video → frame → video): `{ prompt, video_url, resource_type: "video" | "auto", preset, visibility }`
  * Optional vendor settings: `{ fps: 24, duration: 3, quality: "high", stabilization: true }`
* `GET /.netlify/functions/poll-gen?id=<jobId>:kling-video/v1.6/standard/image-to-video&persist=true`

  * Polls the vendor job and persists results to DB + Cloudinary

> **Note:** The frontend always passes **media first** (image\_url or video\_url). If a video is uploaded, Stefna extracts a representative frame before I2V.

---

## ⚙️ Environment Variables

Create `.env` from `env.example`.

```bash
# Frontend (Vite)
VITE_AIML_API_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_APP_ENV=development
VITE_DEBUG_MODE=true

# Backend (Netlify Functions)
AIML_API_KEY=...
AIML_API_URL=https://api.aimlapi.com
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_CLOUD_NAME=...
JWT_SECRET=...
RESEND_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🚀 Getting Started

```bash
# Clone & install
npm i

# Set env vars
cp env.example .env
# fill in values

# Dev server
npm run dev
```

**Database**

* Run `simple-database-migration.sql` in Supabase SQL editor to create tables, policies, and functions.

**Scripts**

```bash
npm run dev      # local dev
npm run build    # production build
npm run preview  # preview prod build
```

**Structure**

```
src/
├─ components/
├─ screens/
├─ services/      # API and business logic (AIML/Cloudinary/Supabase)
├─ stores/
├─ utils/         # rotation, helpers
└─ config/        # presets

netlify/
└─ functions/     # serverless functions
```

---

## 🎬 Generation Pipeline

1. **Upload media** → Cloudinary (signed)
2. **Detect type**

   * **Image**: I2I edit and optional I2V motion
   * **Video**: extract representative frame → I2V
3. **Apply style**: custom prompt or active preset
4. **Vendor call**: AIML API (Kling v1.6)
5. **Persist**: Save result to Supabase + Cloudinary
6. **Share**: Optionally publish to Public Feed and allow Remix

---

## 🧪 Preset Quality Notes

* All presets use conservative negatives to keep **skin tones natural** and avoid over‑processing
* **isVideo: true** on presets to prevent routing mistakes
* Preset rotation ensures consistent UX while encouraging stylistic variety

---

## 🛠️ Troubleshooting & Logs

### Common frontend logs & what they mean

* `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT` (rum\_collection)

  * Caused by ad‑/tracker‑blockers; **non‑fatal**; generation unaffected.

* `start-v2v error Error: No video source provided`

  * Ensure you send **`image_url`** (for images) **or** **`video_url`** (for videos), plus correct `resource_type`.
  * Confirm Cloudinary URL is public and reachable.

* `start-v2v failed` / `Vendor error creating Kling V2V job` / `All vendor payload variants rejected`

  * Double‑check payload fields: `prompt`, `image_url`/`video_url`, `resource_type`, `preset`, and vendor settings.
  * Validate media: prefer **MP4/H.264**, ≤1080p, reasonable size; avoid exotic codecs.
  * If vendor is throttled or down, **gracefully retry** with backoff and show a user‑friendly message.

### Recommended request shape (video → I2V)

```json
{
  "prompt": "Golden warmth, soft shadows...",
  "video_url": "https://res.cloudinary.com/<cloud>/video/upload/.../clip.mp4",
  "resource_type": "video",
  "preset": "sun_kissed",
  "fps": 24,
  "duration": 3,
  "quality": "high",
  "stabilization": true,
  "visibility": "public"
}
```

### Graceful UI/UX on errors

* Show: "We couldn't start this job. Retrying…" then allow a manual retry
* If repeated vendor reject: suggest re‑encoding to MP4 (H.264) or uploading a still image for I2V

---

## 🔒 Security

* Supabase **RLS** on all user content
* Signed Cloudinary uploads; JWT auth for sessions
* Guests supported via temporary IDs; promotion on login

---

## 📱 UX Principles

* Minimal black‑and‑white UI
* Full‑screen editing surface
* Real‑time status with clear messages (Queued → Processing → Ready)
* Actionable, non‑technical error copy

---

## 🚧 Status

**Completed**

* Full schema + migrations
* I2I/I2V pipeline with frame extraction
* Media library, privacy controls
* Public feed, likes, remixes
* Preset catalog + rotation (six at a time)
* Guest users, usage tracking

**In Progress**

* Frame selection UI (pick a timecode)
* Pro tier effects (advanced I2V models)
* Large‑file performance and resumable uploads
* Advanced preset customization

**Next Steps**

* Local testing & bug fixes
* Production deploy & UAT
* Monitoring & SLOs

---

## 🤝 Contributing

This is a production application—please include tests and keep PRs focused.

## 📄 License

Proprietary. All rights reserved.

## 📞 Support

Contact the development team for help, or consult the docs in this repo.