import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, ArrowRight, ArrowUpRight, LayoutGrid, Mail, MoreHorizontal, Orbit, Pause, Play, ShoppingBag, X } from 'lucide-react'
import './lab.css'

export const releases = [
  { slug: 'pecado', title: 'PECADO', id: '0vVpZboC2PqmsWciPHszQX' },
  { slug: 'mamacita', title: 'MAMACITA', id: '0OPXx1SI4bETHVDadgYSJB' },
  { slug: 'papicito', title: 'PAPICITO', id: '2BycG5qfFkSf1ow5rmkRpX' },
  { slug: 'muted', title: 'MUTED', id: '2W2lVlWXVe91KWa5nwgmfU' },
  { slug: 'fuck-it', title: 'FUCK IT', id: '6VPHwItiAZpI9l2FgpdRaX' },
  { slug: 'klima', title: 'KLIMA', id: '18sdfyfBB0I5LUu6EQRfj4' },
  { slug: 'ikywm', title: 'I.K.Y.W.M', id: '3ZSoXRq4s1XoZFuQ7vYiPa' },
  { slug: 'ura-no-kata', title: '裏の型 (URA NO KATA)', id: '1CFsGFMagkTBXtk4ABot5w' },
] as const

type Release = typeof releases[number]
const spotifyUrl = (release: Release) => `https://open.spotify.com/track/${release.id}`
const cover = (slug: string, size = 480) => `/music/${slug}-${size}-v1.webp`
const platformIcon = (icon: string) => `/${icon}.svg`
const STEP = Math.PI * 2 / releases.length
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))
const wrap = (v: number) => ((v % releases.length) + releases.length) % releases.length

const socialLinks = [
  ['Spotify', 'https://open.spotify.com/artist/0h4zpa0iYWK5bzLO19F8Bo', 'spotify'],
  ['Apple Music', 'https://music.apple.com/us/artist/stefnaxyz/1871970163', 'applemusic'],
  ['SoundCloud', 'https://soundcloud.com/stefnaxyz', 'soundcloud'],
  ['YouTube', 'https://www.youtube.com/channel/UCNBAWuWc8luYN8F0dIXX0RA', 'youtube'],
  ['YouTube Music', 'https://music.youtube.com/@StefnaXYZ', 'youtubemusic'],
  ['Instagram', 'https://www.instagram.com/stefnaxyz/', 'instagram'],
  ['TikTok', 'https://www.tiktok.com/@stefnaxyz', 'tiktok'],
  ['X', 'https://x.com/StefnaXYZ', 'x'],
  ['Facebook', 'https://www.facebook.com/Stefnaxyz/', 'facebook'],
]

function SpotifyDialog({ release, close }: { release: Release; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = dialog.current!
    const previous = document.activeElement as HTMLElement | null
    node.showModal()
    node.querySelector<HTMLButtonElement>('button')?.focus()
    return () => { node.close(); previous?.focus() }
  }, [])
  return (
    <dialog className="signal-player" ref={dialog} aria-label={`${release.title} Spotify player`} onCancel={close}
      onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="signal-player-tools">
        <a className="signal-control" href={spotifyUrl(release)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${release.title} in Spotify`}><ArrowUpRight size={21} /></a>
        <button type="button" className="signal-control" aria-label="Close player" onClick={close} autoFocus><X size={21} /></button>
      </div>
      <iframe title={`${release.title} on Spotify`} src={`https://open.spotify.com/embed/track/${release.id}?utm_source=generator&theme=0`}
        width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
    </dialog>
  )
}

function usePreview() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const engineRef = useRef<{ context: AudioContext; analyser: AnalyserNode } | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(false)
  const operation = useRef(0)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      operation.current += 1
      audioRef.current?.pause()
      if (contextRef.current) { void contextRef.current.close().catch(() => {}); contextRef.current = null }
      engineRef.current = null
    }
  }, [])
  const pause = useCallback(() => { operation.current += 1; audioRef.current?.pause() }, [])
  const toggle = useCallback(() => {
    const audio = audioRef.current!
    if (!audio.paused) { pause(); return }
    const attempt = ++operation.current
    setFailed(false)
    // Keep play() in the tap/click call stack. A suspended or interrupted
    // visualizer must never hold native media playback behind an await.
    let playback: Promise<void>
    try {
      playback = audio.play()
    } catch {
      setFailed(true)
      return
    }
    void playback.catch(error => {
      if (mounted.current && attempt === operation.current && error?.name !== 'AbortError') setFailed(true)
    })

    try {
      const AudioContextConstructor = window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextConstructor) return
      const context = contextRef.current || new AudioContextConstructor()
      contextRef.current = context
      const connectVisualizer = () => {
        if (!mounted.current || contextRef.current !== context || audioRef.current !== audio ||
            context.state !== 'running' || engineRef.current) return
        const analyser = context.createAnalyser()
        analyser.fftSize = 128
        // Only reroute audible native media after this context is running.
        analyser.connect(context.destination)
        context.createMediaElementSource(audio).connect(analyser)
        engineRef.current = { context, analyser }
      }
      if (context.state === 'running') connectVisualizer()
      else {
        // Request the unlock during this same user gesture, without waiting
        // for it before play(). Some mobile browsers leave resume() pending.
        void context.resume().then(connectVisualizer).catch(() => {})
      }
    } catch { /* Native audio remains independent of visualizer support. */ }
  }, [pause])
  return { audioRef, engineRef, playing, setPlaying, progress, setProgress, failed, setFailed, toggle, pause }
}

const LabScreen: React.FC = () => {
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState<Release | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [paused, setPaused] = useState(false)
  const [socialOpen, setSocialOpen] = useState(false)
  const sound = usePreview()
  const stage = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const cards = useRef<(HTMLButtonElement | null)[]>([])
  const audioBars = useRef<(HTMLSpanElement | null)[]>([])
  const target = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })
  const lastInput = useRef(0)
  const hover = useRef(false)
  const paint = useRef<() => void>(() => {})
  const activeRef = useRef(0)
  const drag = useRef({ down: false, x: 0, y: 0, origin: 0, moved: false, ended: 0, lastX: 0, time: 0, velocity: 0 })
  const settings = useRef({ paused, expanded, playing: sound.playing, selected: !!selected })
  settings.current = { paused, expanded, playing: sound.playing, selected: !!selected }

  const focusRelease = useCallback((index: number) => {
    const next = wrap(index)
    const desired = -next * STEP
    const turns = Math.round((target.current - desired) / (Math.PI * 2))
    target.current = desired + turns * Math.PI * 2
    activeRef.current = next
    setActive(next)
    lastInput.current = performance.now()
    paint.current()
  }, [])

  const navigate = (direction: number) => { sound.pause(); focusRelease(wrap(Math.round(-target.current / STEP)) + direction) }
  const openRelease = (release: Release, index: number) => {
    if (drag.current.moved && performance.now() - drag.current.ended < 350) return
    sound.pause()
    focusRelease(index)
    setSelected(release)
  }
  const toggleSound = () => {
    if (!sound.playing) { focusRelease(2); setExpanded(false) }
    void sound.toggle()
  }

  useEffect(() => { paint.current() }, [paused, expanded, sound.playing, selected])
  useEffect(() => {
    if (!socialOpen) return
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') setSocialOpen(false) }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [socialOpen])

  useEffect(() => {
    const node = stage.current!
    const surface = canvas.current!
    const context = surface.getContext('2d')
    if (!context) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = node.clientWidth
    let height = node.clientHeight
    let pixelRatio = 1
    let frame = 0
    let lastFrame = 0
    let phase = 0
    let angle = target.current
    let grid = 0
    let mx = 0
    let my = 0
    let energy = 0
    let appeared = false
    const started = performance.now()
    const spectrum = new Uint8Array(64)

    const resize = () => {
      width = node.clientWidth; height = node.clientHeight
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      surface.width = Math.round(width * pixelRatio)
      surface.height = Math.round(height * pixelRatio)
      start()
    }

    // A single small canvas draws an original, rotating torus-knot sculpture.
    // The same frame positions eight DOM covers; no scene or animation packages.
    const render = (now: number) => {
      frame = 0
      if (document.hidden || settings.current.selected) return
      if (now - lastFrame < 1000 / 30) { frame = requestAnimationFrame(render); return }
      const dt = Math.min((now - (lastFrame || now)) / 1000, 0.06)
      lastFrame = now
      const { paused: still, expanded: wall, playing } = settings.current
      const reduced = media.matches
      const moving = !still && !reduced
      const elapsed = (now - started) / 1000
      if (moving) phase += dt * (playing ? 0.45 : 0.16)
      if (moving && !wall && !playing && !hover.current && !drag.current.down && elapsed > 4 && now - lastInput.current > 4200) target.current += dt * 0.095
      const ease = 1 - Math.exp(-dt * 8)
      angle += (target.current - angle) * ease
      grid += ((wall ? 1 : 0) - grid) * ease
      mx += ((reduced ? 0 : pointer.current.x) - mx) * ease
      my += ((reduced ? 0 : pointer.current.y) - my) * ease
      let volume = 0
      if (playing && sound.engineRef.current) {
        sound.engineRef.current.analyser.getByteFrequencyData(spectrum)
        for (let j = 2; j < 18; j += 1) volume += spectrum[j] / 255
        volume /= 16
      }
      energy += (volume - energy) * 0.18
      if (still) energy = 0
      if (reduced) { angle = target.current; grid = wall ? 1 : 0; mx = 0; my = 0; energy = 0 }
      const nearest = wrap(Math.round(-angle / STEP))
      if (nearest !== activeRef.current && !wall && Math.abs(target.current - angle) < STEP * 0.3) { activeRef.current = nearest; setActive(nearest) }

      const mobile = width < 700
      const size = mobile ? Math.min(width * 0.52, height * 0.28, 235) : Math.min(width * 0.235, height * 0.34, 310)
      const radiusX = width * (mobile ? 0.60 : 0.345)
      const radiusY = Math.min(height * (mobile ? 0.165 : 0.19), 155)
      const columns = mobile ? 2 : 4
      const rows = releases.length / columns
      const gap = mobile ? 18 : 34
      const wallSize = Math.min((width - (mobile ? 40 : 130) - gap * (columns - 1)) / columns, (height - 210 - gap * (rows - 1)) / rows, 260)

      cards.current.forEach((card, index) => {
        if (!card) return
        const theta = angle + index * STEP
        const depth = (Math.cos(theta) + 1) / 2
        const reveal = reduced ? 1 : 1 - Math.pow(1 - clamp((elapsed - 0.4 - index * 0.055) / 1.5), 3)
        const floating = moving ? Math.sin(phase * 2 + index * 1.7) * 10 : 0
        const orbitX = Math.sin(theta) * radiusX + mx * 27 * (depth - 0.3)
        const orbitY = Math.cos(theta) * radiusY + floating + my * 16 * depth
        const gridX = (index % columns - (columns - 1) / 2) * (wallSize + gap)
        const gridY = (Math.floor(index / columns) - (rows - 1) / 2) * (wallSize + gap)
        const scale = (0.48 + depth * 0.52) * (1 - grid) + (wallSize / size) * grid
        const x = (orbitX * (1 - grid) + gridX * grid) * reveal
        const y = (orbitY * (1 - grid) + gridY * grid) * reveal
        const z = (depth * 100 - 70) * (1 - grid)
        const rotateY = -Math.sin(theta) * 34 * (1 - grid)
        const rotateZ = (Math.sin(theta) * -9 + Math.sin(phase + index) * (moving ? 1.4 : 0)) * (1 - grid)
        card.style.width = `${size}px`
        card.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${(scale * (0.2 + 0.8 * reveal)).toFixed(4)})`
        card.style.opacity = String(reveal * ((0.25 + depth * 0.75) * (1 - grid) + grid))
        card.style.zIndex = String(Math.round(depth * 80) + 10)
        card.style.filter = `brightness(${((0.55 + depth * 0.45) * (1 - grid) + grid).toFixed(3)})`
      })
      if (reduced || elapsed > 2.5) appeared = true

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)
      const cx = width / 2 + mx * 14
      const cy = height * 0.435 + my * 10
      const magnitude = Math.min(width * (mobile ? 0.68 : 0.285), height * 0.39) * (1 + energy * 0.08)
      const glow = context.createRadialGradient(cx, cy, 0, cx, cy, magnitude * 1.6)
      glow.addColorStop(0, `rgba(255,255,255,${0.035 + energy * 0.025})`)
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)
      const spin = phase * 0.48 + mx * 0.13
      const tilt = -0.34 + Math.sin(phase * 0.4) * 0.15 + my * 0.1
      const cosSpin = Math.cos(spin), sinSpin = Math.sin(spin)
      const cosTilt = Math.cos(tilt), sinTilt = Math.sin(tilt)
      const bands = mobile ? 23 : 35
      const segments = mobile ? 135 : 180
      const revealSculpture = reduced ? 1 : clamp(elapsed / 1.8)
      context.lineWidth = mobile ? 0.65 : 0.8
      for (let band = 0; band < bands; band += 1) {
        const v = band / bands * Math.PI * 2
        const shade = (0.035 + Math.pow(Math.abs(Math.cos(v + phase)), 6) * 0.23 + energy * 0.08) * (1 - grid * 0.78) * revealSculpture
        context.strokeStyle = `rgba(255,255,255,${shade})`
        context.beginPath()
        for (let i = 0; i <= segments; i += 1) {
          const u = i / segments * Math.PI * 2
          const radius = 0.82 + 0.27 * Math.cos(3 * u + phase * 0.5) + Math.cos(v) * (0.105 + energy * 0.035)
          const x = radius * Math.cos(2 * u)
          const y = radius * Math.sin(2 * u)
          const z = 0.37 * Math.sin(3 * u) + Math.sin(v) * 0.11
          const rx = x * cosSpin + z * sinSpin
          const rz = -x * sinSpin + z * cosSpin
          const ry = y * cosTilt - rz * sinTilt
          const depth = y * sinTilt + rz * cosTilt
          const perspective = 3.4 / (3.4 + depth)
          const px = cx + rx * magnitude * perspective
          const py = cy + ry * magnitude * perspective * 0.82
          if (i === 0) context.moveTo(px, py); else context.lineTo(px, py)
        }
        context.stroke()
      }
      audioBars.current.forEach((bar, index) => {
        if (!bar) return
        const value = playing && !reduced && !still ? spectrum[index * 4 + 3] / 255 : 0.1
        bar.style.transform = `scaleY(${0.12 + value * 0.88})`
      })
      const easing = Math.abs(target.current - angle) > 0.001 || Math.abs(grid - (wall ? 1 : 0)) > 0.001 || (!reduced && (Math.abs(pointer.current.x - mx) > 0.01 || Math.abs(pointer.current.y - my) > 0.01))
      if (moving || (playing && !reduced && !still) || easing || !appeared) frame = requestAnimationFrame(render)
    }
    function start() {
      if (!frame && !document.hidden) { lastFrame = 0; frame = requestAnimationFrame(render) }
    }
    paint.current = start
    const visibility = () => {
      cancelAnimationFrame(frame); frame = 0
      if (document.hidden) sound.pause(); else start()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(node)
    document.addEventListener('visibilitychange', visibility)
    media.addEventListener('change', start)
    resize()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      media.removeEventListener('change', start)
      paint.current = () => {}
    }
  }, [])

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (settings.current.expanded || event.button !== 0) return
    const now = performance.now()
    drag.current = { down: true, x: event.clientX, y: event.clientY, origin: target.current, moved: false, ended: 0, lastX: event.clientX, time: now, velocity: 0 }
    lastInput.current = now
  }
  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    pointer.current = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 }
    const state = drag.current
    if (state.down) {
      const dx = event.clientX - state.x
      if (Math.abs(dx) + Math.abs(event.clientY - state.y) > 9 && !state.moved) {
        state.moved = true
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      if (state.moved) {
        const now = performance.now()
        state.velocity = (event.clientX - state.lastX) / Math.max(now - state.time, 1)
        state.lastX = event.clientX; state.time = now
        target.current = state.origin + dx * (rect.width < 700 ? 0.009 : 0.0045)
        lastInput.current = now
      }
    }
    paint.current()
  }
  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const state = drag.current
    if (!state.down) return
    state.down = false
    state.ended = performance.now()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (state.moved) {
      sound.pause()
      const inertia = performance.now() - state.time < 100 ? clamp(state.velocity, -2, 2) * 0.34 : 0
      target.current = Math.round((target.current + inertia) / STEP) * STEP
      lastInput.current = performance.now()
      paint.current()
    }
  }

  return (
    <>
      <Helmet>
        <title>StefnaXYZ — The Lab</title>
        <meta name="description" content="Enter the StefnaXYZ sound lab. Explore PECADO, MAMACITA, PAPICITO, MUTED and more original music. Listen on Spotify and explore the merch store." />
        <link rel="canonical" href="https://stefna.xyz/Lab" />
        <meta property="og:title" content="StefnaXYZ — The Lab" />
        <meta property="og:description" content="Original music. Multi-genre. Multilingual. Enter the lab." />
        <meta property="og:image" content="https://stefna.xyz/og-image-new.png" />
        <meta property="og:url" content="https://stefna.xyz/Lab" />
        <meta name="twitter:title" content="StefnaXYZ — The Lab" />
        <meta name="twitter:description" content="Enter the StefnaXYZ sound lab." />
        <meta name="twitter:image" content="https://stefna.xyz/og-image-new.png" />
      </Helmet>
      <main className={`signal-world${paused ? ' signal-still' : ''}${expanded ? ' signal-expanded' : ''}`} aria-label="StefnaXYZ music lab">
        <h1 className="signal-sr-only">StefnaXYZ — independent music and visual lab</h1>
        <div className="signal-vignette" aria-hidden="true" />
        <div className="signal-intro" aria-hidden="true"><img src="/logo-new.png" alt="" width="80" height="80" /></div>
        <header className="signal-header">
          <button className="signal-home" type="button" aria-label="Return to PECADO" onClick={() => { sound.pause(); setExpanded(false); focusRelease(0) }}><img src="/logo-new.png" alt="StefnaXYZ symbol" width="68" height="68" /></button>
          <nav aria-label="Lab controls">
            <button className="signal-control" type="button" aria-label={expanded ? 'Return to orbit' : 'View all eight covers'} aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? <Orbit size={20} /> : <LayoutGrid size={19} />}</button>
            <a className="signal-control" href="https://syncty.xyz/" target="_blank" rel="noopener noreferrer" aria-label="Merch Store"><ShoppingBag size={20} /></a>
            <button className="signal-control" type="button" aria-label={socialOpen ? 'Close social links' : 'Open social links'} aria-expanded={socialOpen} aria-controls="signal-socials" onClick={() => setSocialOpen(!socialOpen)}>{socialOpen ? <X size={20} /> : <MoreHorizontal size={22} />}</button>
          </nav>
          {socialOpen && <nav className="signal-socials" id="signal-socials" aria-label="Social and streaming links">
            {socialLinks.map(([name, href, icon]) => <a className="signal-control" key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={name}><img src={platformIcon(icon)} alt="" width="19" height="19" /></a>)}
            <a className="signal-control" href="mailto:hello@stefna.xyz" aria-label="Email StefnaXYZ"><Mail size={19} /></a>
          </nav>}
        </header>
        <section className="signal-stage" ref={stage} aria-label="Music covers. Drag or scroll to explore; arrow keys change the selection. Select a cover to open its player." tabIndex={0}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
          onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; hover.current = false; paint.current() }}
          onClickCapture={event => { if (drag.current.moved && performance.now() - drag.current.ended < 350) { event.preventDefault(); event.stopPropagation() } }}
          onWheel={event => { if (!expanded) { sound.pause(); target.current += clamp(event.deltaY + event.deltaX, -140, 140) * 0.003; lastInput.current = performance.now(); paint.current() } }}
          onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1) } }}>
          <canvas className="signal-sculpture" ref={canvas} aria-hidden="true" />
          <div className="signal-equator" aria-hidden="true" />
          <div className="signal-covers">
            {releases.map((release, index) => <button type="button" className={`signal-cover${active === index ? ' signal-cover-active' : ''}`} key={release.id}
              ref={el => { cards.current[index] = el }} aria-label={`Play ${release.title} on Spotify`} onClick={() => openRelease(release, index)}
              onPointerEnter={() => { hover.current = true }} onPointerLeave={() => { hover.current = false }}
              onFocus={() => { hover.current = true; focusRelease(index) }} onBlur={() => { hover.current = false }}>
              <img src={cover(release.slug, 960)} srcSet={`${cover(release.slug)} 480w, ${cover(release.slug, 960)} 960w`} sizes="(max-width: 700px) 55vw, 340px" alt={`${release.title} cover artwork`} width="960" height="960" loading="eager" decoding="async" draggable={false} />
              <span className="signal-cover-action" aria-hidden="true"><ArrowUpRight size={24} /></span>
              <span className="signal-cover-corner signal-cover-corner-a" aria-hidden="true" /><span className="signal-cover-corner signal-cover-corner-b" aria-hidden="true" />
            </button>)}
          </div>
        </section>
        <footer className="signal-footer">
          <button className="signal-control signal-motion-control" type="button" aria-label={paused ? 'Resume motion' : 'Pause motion'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
          <div className="signal-dock">
            <button className="signal-control signal-previous" type="button" aria-label="Previous release" onClick={() => navigate(-1)}><ArrowLeft size={19} /></button>
            <button className={`signal-audio${sound.playing ? ' signal-audio-playing' : ''}`} type="button" aria-label={sound.playing ? 'Pause PAPICITO preview' : sound.failed ? 'Retry PAPICITO preview' : 'Play PAPICITO 15-second preview'} aria-pressed={sound.playing} onClick={toggleSound}>
              <svg className="signal-progress" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" style={{ strokeDasharray: 182.21, strokeDashoffset: 182.21 * (1 - sound.progress) }} /></svg>
              {sound.playing ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
            </button>
            <button className="signal-control signal-next" type="button" aria-label="Next release" onClick={() => navigate(1)}><ArrowRight size={19} /></button>
            <span className="signal-dock-divider" aria-hidden="true" />
            <a className="signal-control signal-spotify" href={spotifyUrl(releases[active])} target="_blank" rel="noopener noreferrer" aria-label={`Open ${releases[active].title} in Spotify`}><img src={platformIcon('spotify')} alt="" width="24" height="24" /></a>
          </div>
          <div className="signal-spectrum" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} ref={el => { audioBars.current[i] = el }} />)}</div>
          <nav className="signal-dots" aria-label="Choose a release">{releases.map((release, index) => <button key={release.id} type="button" aria-label={`Focus ${release.title}`} aria-current={active === index ? 'true' : undefined} onClick={() => { sound.pause(); focusRelease(index) }} />)}</nav>
        </footer>
        <audio ref={sound.audioRef} src="/music/papicito-preview-v1.mp3" preload="none"
          onPlay={() => sound.setPlaying(true)} onPause={() => sound.setPlaying(false)}
          onEnded={() => { sound.setPlaying(false); sound.setProgress(0); if (sound.audioRef.current) sound.audioRef.current.currentTime = 0; lastInput.current = performance.now() }}
          onTimeUpdate={() => { const audio = sound.audioRef.current; if (audio && Number.isFinite(audio.duration)) sound.setProgress(audio.currentTime / audio.duration) }}
          onError={() => { sound.setPlaying(false); sound.setFailed(true) }} />
        <span className="signal-sr-only" role="status">{sound.failed ? 'Preview unavailable. Use the Spotify button to listen.' : ''}</span>
        {selected && <SpotifyDialog release={selected} close={() => { setSelected(null); lastInput.current = performance.now() }} />}
      </main>
    </>
  )
}

export default LabScreen
