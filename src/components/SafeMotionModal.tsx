import React, { useState, useEffect } from 'react'
import { loadFramerMotion } from '../utils/loadFramerMotion'

interface SafeMotionModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export const SafeMotionModal: React.FC<SafeMotionModalProps> = ({ 
  isOpen, 
  onClose, 
  children 
}) => {
  // Framer Motion state - starts with fallback, enhanced after import
  const [{ motion, AnimatePresence }, setFramerMotion] = useState<any>(() => ({
    motion: { div: 'div' }, // render right away; enhanced after import
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }))

  // Load Framer Motion asynchronously
  useEffect(() => {
    let alive = true
    loadFramerMotion().then((fm) => alive && setFramerMotion(fm))
    return () => { alive = false }
  }, [])

  if (!isOpen) return null

  const MotionDiv = (motion?.div as any) || 'div'
  const motionProps = typeof motion.div === 'string' ? {} : {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <MotionDiv 
            className="relative z-10 w-full max-w-md mx-4"
            {...motionProps}
          >
            {children}
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  )
}
