import React from 'react'

type IconProps = { size?: number; className?: string }

export const InstagramIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.51 5.51 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zm5.25-3.25a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25z"/>
  </svg>
)

export const XIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M3 3h3.7l5.2 7.2L18.3 3H21l-7.3 9.8L21 21h-3.7l-5.4-7.5L6 21H3l7.7-10.2L3 3z"/>
  </svg>
)

export const FacebookIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.2V12h2.2V9.8c0-2.2 1.3-3.5 3.4-3.5.98 0 2 .18 2 .18v2.2h-1.1c-1.1 0-1.5.68-1.5 1.4V12h2.6l-.42 2.9h-2.2v7A10 10 0 0 0 22 12z"/>
  </svg>
)

export const TikTokIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M21 8.5a6.5 6.5 0 0 1-4.7-2v9.1A6.6 6.6 0 1 1 9 9.1v2.4a3.8 3.8 0 1 0 2.7 3.7V2h2.6a6.5 6.5 0 0 0 4.7 4.1z"/>
  </svg>
)

// Threads glyph approximation with unified stroke
export const ThreadsIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2.5c5.2 0 9.5 4.3 9.5 9.5S17.2 21.5 12 21.5 2.5 17.2 2.5 12 6.8 2.5 12 2.5Zm2.9 9.1c.1-.3.1-.6.1-.9 0-2-1.5-3.4-4-3.4-1.6 0-3 .6-4 1.4l1 1.7c.8-.6 1.7-1 2.7-1 1.3 0 2 .6 2 1.6 0 .2 0 .4-.1.6-.5-.2-1-.3-1.6-.3-2.4 0-4.1 1.5-4.1 3.6 0 2 1.6 3.5 3.8 3.5 1.2 0 2.2-.4 2.9-1.1.4-.4.7-.8.9-1.3.4.1.9.2 1.3.2h.7v-1.9h-.6c-.5 0-1-.1-1.3-.2Zm-3.8 3.7c-1.1 0-1.8-.6-1.8-1.5 0-1 .9-1.7 2.3-1.7.5 0 1 .1 1.4.3-.1 1.7-1 2.9-1.9 2.9Z"/>
  </svg>
)

export const YouTubeIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.13C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.13c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.13C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/>
  </svg>
)

export default {
  InstagramIcon,
  XIcon,
  FacebookIcon,
  TikTokIcon,
  ThreadsIcon,
  YouTubeIcon,
}


