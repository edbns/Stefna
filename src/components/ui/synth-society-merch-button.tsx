import { ArrowUpRight } from 'lucide-react'

const BUTTON_TEXT = 'SYNTH SOCIETY MERCH'
const characterRotation = 360 / BUTTON_TEXT.length

export const SynthSocietyMerchButton = () => {
  return (
    <a
      href="https://syncty.xyz/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit Synth Society Merch"
      className="group relative grid h-[116px] w-[116px] place-items-center rounded-full border border-dotted border-white/75 text-[10px] font-semibold tracking-[0.08em] text-white transition duration-300 hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black sm:h-[124px] sm:w-[124px]"
    >
      <span className="synth-merch-rotation absolute inset-0" aria-hidden="true">
        {Array.from(BUTTON_TEXT).map((character, index) => (
          <span
            key={`${character}-${index}`}
            className="absolute inset-[6px] inline-block select-none"
            style={{
              transform: `rotate(${characterRotation * index}deg)`,
              transformOrigin: '50% 50%',
            }}
          >
            {character === ' ' ? '\u00A0' : character}
          </span>
        ))}
      </span>

      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white text-black transition duration-300 group-hover:scale-105">
        <ArrowUpRight className="absolute h-5 w-5 transition duration-300 group-hover:translate-x-8 group-hover:-translate-y-8" strokeWidth={1.8} />
        <ArrowUpRight className="absolute h-5 w-5 -translate-x-8 translate-y-8 transition duration-300 delay-75 group-hover:translate-x-0 group-hover:translate-y-0" strokeWidth={1.8} />
      </span>
    </a>
  )
}
