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
    <div className="flex items-center gap-3">
      {/* Left Style Dropdown */}
      <div className="relative">
        <select 
          value={left} 
          onChange={e => onChange(e.target.value as any, right)}
          className="px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-[#333333] text-white border-white/20 hover:border-white/30 focus:outline-none focus:border-white/40"
        >
          {Object.values(STYLES).map(s => (
            <option key={s.id} value={s.id} className="bg-[#333333] text-white">
              {s.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* VS Separator */}
      <span className="text-white/60 text-xs font-medium">vs</span>
      
      {/* Right Style Dropdown */}
      <div className="relative">
        <select 
          value={right} 
          onChange={e => onChange(left, e.target.value as any)}
          className="px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-[#333333] text-white border-white/20 hover:border-white/30 focus:outline-none focus:border-white/40"
        >
          {Object.values(STYLES).map(s => (
            <option key={s.id} value={s.id} className="bg-[#333333] text-white">
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
