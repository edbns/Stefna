import { useEffect } from 'react'

export default function PerigoRedirect() {
  useEffect(() => {
    const target = `https://go.stefna.xyz/Perigo${window.location.search}`
    let attempts = 0
    let redirectTimer: number | undefined

    const trackThenRedirect = () => {
      if (window.axon) {
        window.axon('track', 'generate_lead')
        redirectTimer = window.setTimeout(() => window.location.replace(target), 800)
        return
      }

      attempts += 1
      if (attempts < 20) {
        window.setTimeout(trackThenRedirect, 100)
      } else {
        window.location.replace(target)
      }
    }

    trackThenRedirect()
    return () => {
      if (redirectTimer) window.clearTimeout(redirectTimer)
    }
  }, [])

  return <div className="min-h-screen bg-black" aria-label="Opening Spotify" />
}
