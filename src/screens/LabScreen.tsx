import React from 'react'
import { Helmet } from 'react-helmet-async'
import { GooeyText } from '@/components/ui/gooey-text-morphing'
import { SparklesCore } from '@/components/ui/sparkles'

const MORPH_TEXTS = ['Music', 'Fashion', 'Culture']

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

const SPOTIFY_ARTIST_EMBED =
  'https://open.spotify.com/embed/artist/0h4zpa0iYWK5bzLO19F8Bo?utm_source=generator&theme=0'

const LabScreen: React.FC = () => {
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

      <div className="lab-page relative min-h-[100dvh] overflow-x-hidden bg-black font-figtree text-white">
        {/* Ambient background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 h-full w-full">
            <SparklesCore
              id="lab-sparkles"
              background="transparent"
              minSize={0.6}
              maxSize={1.4}
              particleDensity={100}
              className="h-full w-full"
              particleColor="#FFFFFF"
              speed={1}
            />
          </div>
          <div className="lab-ambient-glow absolute left-1/2 top-[28%] h-[min(70vw,520px)] w-[min(90vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="lab-ambient-grid absolute inset-0 opacity-[0.35]" />
        </div>

        <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6">
          {/* Hero */}
          <section className="flex flex-col items-center pt-6 text-center sm:pt-10">
            <img
              src="/logo-new.png"
              alt="StefnaXYZ"
              className="mb-8 h-auto w-[min(42vw,148px)] select-none rounded-2xl object-contain sm:mb-10 sm:w-[min(34vw,168px)]"
              width={168}
              height={84}
              draggable={false}
            />

            <div className="w-full max-w-4xl">
              <GooeyText
                texts={MORPH_TEXTS}
                morphTime={1.1}
                cooldownTime={0.3}
                className="h-[min(14vw,110px)] w-full font-figtree sm:h-[min(12vw,130px)]"
                textClassName="font-bold"
              />
            </div>

            {/* Social links */}
            <nav
              className="mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-2.5 sm:mt-4 sm:gap-3"
              aria-label="Social and streaming links"
            >
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white sm:px-3.5 sm:py-2.5 sm:text-[13px]"
                  aria-label={item.label}
                >
                  <img
                    src={item.icon}
                    alt=""
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] object-contain opacity-90 transition group-hover:opacity-100 [filter:brightness(0)_invert(1)]"
                  />
                  <span className="hidden sm:inline">{item.label}</span>
                </a>
              ))}
            </nav>
          </section>

          <section className="mx-auto mt-14 w-full max-w-xl sm:mt-16" aria-label="Spotify player">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_0_40px_rgba(255,255,255,0.03)]">
              <iframe
                title="Spotify player"
                src={SPOTIFY_ARTIST_EMBED}
                loading="lazy"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="h-[352px] w-full"
              />
            </div>
          </section>

          <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-white/55 sm:text-[13px]">
            <p>
              Contact:{' '}
              <a
                href="mailto:hello@stefna.xyz"
                className="text-white/85 underline decoration-white/25 underline-offset-2 transition hover:decoration-white/60"
              >
                hello@stefna.xyz
              </a>
            </p>
            <p className="mt-1">© 2026 StefnaXYZ. All rights reserved.</p>
          </footer>
        </main>
      </div>
    </>
  )
}

export default LabScreen
