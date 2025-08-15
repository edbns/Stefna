// src/features/styleclash/PairPicker.tsx
import { STYLES } from './styles'

export function PairPicker({ 
  left, 
  right, 
  onChange 
}: {
  left: keyof typeof STYLES, 
  right: keyof typeof STYLES,
  onChange: (a: keyof typeof STYLES, b: keyof typeof STYLES) => void
}) {
  return (
    <div className="flex gap-2 items-center">
      <select 
        value={left} 
        onChange={e => onChange(e.target.value as any, right)}
        className="px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:border-white/40"
      >
        {Object.values(STYLES).map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      <span className="opacity-60 text-white text-sm">vs</span>
      <select 
        value={right} 
        onChange={e => onChange(left, e.target.value as any)}
        className="px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:border-white/40"
      >
        {Object.values(STYLES).map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </div>
  )
}
