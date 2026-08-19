import { useEffect } from 'react'

export default function PerigoRedirect() {
  useEffect(() => {
    window.axon?.('track', 'generate_lead')
    const target = `https://go.stefna.xyz/Perigo${window.location.search}`
    const timer = window.setTimeout(() => window.location.replace(target), 1000)
    return () => window.clearTimeout(timer)
  }, [])

  return <div className="min-h-screen bg-black" aria-label="Opening Spotify" />
}
