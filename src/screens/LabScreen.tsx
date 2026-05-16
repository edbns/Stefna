import React, { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'

const ORBIT_SEC = 168
const ORBIT_RADIUS_PCT = 44

const SOCIAL_LINKS: { href: string; icon: string; label: string }[] = [
  { href: 'https://open.spotify.com/artist/0h4zpa0iYWK5bzLO19F8Bo', icon: '/spotify.svg', label: 'Spotify' },
  { href: 'https://soundcloud.com/stefnaxyz', icon: '/soundcloud.svg', label: 'SoundCloud' },
  { href: 'https://music.apple.com/us/artist/stefnaxyz/1871970163', icon: '/applemusic.svg', label: 'Apple Music' },
  { href: 'https://www.youtube.com/channel/UCNBAWuWc8luYN8F0dIXX0RA', icon: '/youtube.svg', label: 'YouTube' },
  { href: 'https://music.youtube.com/@StefnaXYZ', icon: '/youtubemusic.svg', label: 'YouTube Music' },
  { href: 'https://www.instagram.com/stefnaxyz/', icon: '/instagram.svg', label: 'Instagram' },
  { href: 'https://x.com/StefnaXYZ', icon: '/x.svg', label: 'X' },
  { href: 'https://www.facebook.com/Stefnaxyz/', icon: '/facebook.svg', label: 'Facebook' },
  { href: 'https://www.tiktok.com/@stefnaxyz', icon: '/tiktok.svg', label: 'TikTok' },
]

function orbitPosition(index: number, total: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    left: 50 + ORBIT_RADIUS_PCT * Math.cos(angle),
    top: 50 + ORBIT_RADIUS_PCT * Math.sin(angle),
  }
}

const LabScreen: React.FC = () => {
  const n = SOCIAL_LINKS.length

  const iconPositions = useMemo(
    () => SOCIAL_LINKS.map((_, i) => orbitPosition(i, n)),
    [n]
  )

  return (
    <>
      <Helmet>
        <title>StefnaXYZ | Independent Global Sound Lab</title>
        <meta
          name="description"
          content="StefnaXYZ is an independent music project blending Afro house, deep house, Afrobeats, and R&B into rhythm-driven global sound."
        />
        <link rel="canonical" href="https://stefna.xyz/Lab" />
        <meta property="og:title" content="StefnaXYZ | Independent Global Sound Lab" />
        <meta
          property="og:description"
          content="StefnaXYZ is an independent music project blending Afro house, deep house, Afrobeats, and R&B into rhythm-driven global sound."
        />
        <meta property="og:image" content="https://stefna.xyz/og-image-new.png" />
        <meta property="og:url" content="https://stefna.xyz/Lab" />
        <meta name="twitter:title" content="StefnaXYZ | Independent Global Sound Lab" />
        <meta
          name="twitter:description"
          content="StefnaXYZ is an independent music project blending Afro house, deep house, Afrobeats, and R&B into rhythm-driven global sound."
        />
        <meta name="twitter:image" content="https://stefna.xyz/og-image-new.png" />
      </Helmet>

      <div className="lab-page flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-black font-figtree text-white">
        <section className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible px-3">
          <div
            className="relative aspect-square w-[min(88vmin,380px)] max-h-[min(72vh,380px)] shrink-0"
            aria-label="Social and streaming links"
          >
            {/* Rotating ring of icons */}
            <div
              className="lab-ring-rotate absolute inset-0"
              style={{ animationDuration: `${ORBIT_SEC}s` }}
            >
              {SOCIAL_LINKS.map((item, i) => {
                const pos = iconPositions[i]!
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute z-10 block -translate-x-1/2 -translate-y-1/2 p-1 opacity-90 transition-opacity hover:opacity-100"
                    style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                    aria-label={item.label}
                  >
                    <span className="lab-icon-upright" style={{ animationDuration: `${ORBIT_SEC}s` }}>
                      <img
                        src={item.icon}
                        alt=""
                        width={36}
                        height={36}
                        className="h-8 w-8 object-contain sm:h-9 sm:w-9 [filter:brightness(0)_invert(1)]"
                      />
                    </span>
                  </a>
                )
              })}
            </div>

            {/* Center logo — fixed, does not rotate */}
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center">
              <img
                src="/logo-new.png"
                alt="StefnaXYZ"
                className="mx-auto w-[min(40vw,140px)] max-h-[min(14vh,100px)] object-contain select-none rounded-2xl sm:w-[min(34vw,160px)] sm:max-h-[min(16vh,115px)]"
                width={160}
                height={80}
                draggable={false}
              />
              <p className="mt-3 text-sm font-medium tracking-wide text-white/95 sm:mt-4 sm:text-base">
                Music × Fashion × Culture
              </p>
            </div>
          </div>
        </section>

        <footer className="relative z-20 shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 text-center text-[10px] leading-snug text-white/65 sm:text-[11px]">
          <p>
            Contact:{' '}
            <a
              href="mailto:hello@stefna.xyz"
              className="text-white/90 underline decoration-white/30 underline-offset-2 hover:decoration-white/70"
            >
              hello@stefna.xyz
            </a>
          </p>
          <p className="mt-0.5">© 2026 StefnaXYZ. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}

export default LabScreen
