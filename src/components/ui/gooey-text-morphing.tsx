import * as React from 'react'
import { cn } from '@/lib/utils'

interface GooeyTextProps {
  texts: string[]
  morphTime?: number
  cooldownTime?: number
  className?: string
  textClassName?: string
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName,
}: GooeyTextProps) {
  const filterId = React.useId().replace(/:/g, '')
  const text1Ref = React.useRef<HTMLSpanElement>(null)
  const text2Ref = React.useRef<HTMLSpanElement>(null)
  const [reducedMotion, setReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  React.useEffect(() => {
    if (reducedMotion || texts.length === 0) return

    let textIndex = texts.length - 1
    let time = new Date()
    let morph = 0
    let cooldown = cooldownTime
    let rafId = 0

    const setMorph = (fraction: number) => {
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`
        text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`

        fraction = 1 - fraction
        text1Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`
        text1Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`
      }
    }

    const doCooldown = () => {
      morph = 0
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = ''
        text2Ref.current.style.opacity = '100%'
        text1Ref.current.style.filter = ''
        text1Ref.current.style.opacity = '0%'
      }
    }

    const doMorph = () => {
      morph -= cooldown
      cooldown = 0
      let fraction = morph / morphTime

      if (fraction > 1) {
        cooldown = cooldownTime
        fraction = 1
      }

      setMorph(fraction)
    }

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const newTime = new Date()
      const shouldIncrementIndex = cooldown > 0
      const dt = (newTime.getTime() - time.getTime()) / 1000
      time = newTime

      cooldown -= dt

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length]
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length]
          }
        }
        doMorph()
      } else {
        doCooldown()
      }
    }

    if (text1Ref.current && text2Ref.current) {
      text1Ref.current.textContent = texts[0]
      text2Ref.current.textContent = texts[1 % texts.length]
    }

    animate()

    return () => cancelAnimationFrame(rafId)
  }, [texts, morphTime, cooldownTime, reducedMotion])

  if (reducedMotion) {
    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        <span
          className={cn(
            'select-none text-center text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl',
            textClassName
          )}
        >
          {texts.join(' · ')}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="flex min-h-[1.2em] items-center justify-center"
        style={{ filter: `url(#${filterId})` }}
      >
        <span
          ref={text1Ref}
          className={cn(
            'absolute inline-block select-none text-center text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl',
            textClassName
          )}
        />
        <span
          ref={text2Ref}
          className={cn(
            'absolute inline-block select-none text-center text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl',
            textClassName
          )}
        />
      </div>
    </div>
  )
}
