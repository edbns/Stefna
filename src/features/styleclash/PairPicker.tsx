// src/features/styleclash/PairPicker.tsx
import { useState, useEffect, useRef } from 'react'
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
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leftRef.current && !leftRef.current.contains(event.target as Node)) {
        setLeftOpen(false)
      }
      if (rightRef.current && !rightRef.current.contains(event.target as Node)) {
        setRightOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center gap-3">
      {/* Left Style Dropdown */}
      <div className="relative" ref={leftRef}>
        <button
          onClick={() => {
            setLeftOpen(!leftOpen)
            setRightOpen(false) // Close the other dropdown
          }}
          className="px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-[#333333] text-white border-white/20 hover:border-white/30 focus:outline-none focus:border-white/40"
        >
          {STYLES[left].label}
        </button>
        
        {/* Left Style Dropdown - only show when open */}
        {leftOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-[#333333] border border-white/20 rounded-xl shadow-2xl p-3 w-48 z-50">
            <div className="space-y-1">
              {Object.values(STYLES).map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    onChange(s.id, right)
                    setLeftOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                    left === s.id 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{s.label}</span>
                  {left === s.id && (
                    <span className="text-white/60">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* VS Separator */}
      <span className="text-white/60 text-xs font-medium">vs</span>
      
      {/* Right Style Dropdown */}
      <div className="relative" ref={rightRef}>
        <button
          onClick={() => {
            setRightOpen(!rightOpen)
            setLeftOpen(false) // Close the other dropdown
          }}
          className="px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-[#333333] text-white border-white/20 hover:border-white/30 focus:outline-none focus:border-white/40"
        >
          {STYLES[right].label}
        </button>
        
        {/* Right Style Dropdown - only show when open */}
        {rightOpen && (
          <div className="absolute bottom-full right-0 mb-2 bg-[#333333] border border-white/20 rounded-xl shadow-2xl p-3 w-48 z-50">
            <div className="space-y-1">
              {Object.values(STYLES).map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    onChange(left, s.id)
                    setRightOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                    right === s.id 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{s.label}</span>
                  {right === s.id && (
                    <span className="text-white/60">✓</span>
                  )}
                </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
