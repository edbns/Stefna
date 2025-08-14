import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from '../utils/motionShim'

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
  if (!isOpen) return null

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
          <motion.div 
            className="relative z-10 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
