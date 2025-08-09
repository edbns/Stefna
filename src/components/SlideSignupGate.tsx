import React from 'react'

interface SlideSignupGateProps {
  isOpen: boolean
  onClose: () => void
  onSignup: () => void
}

const SlideSignupGate: React.FC<SlideSignupGateProps> = ({ isOpen, onClose, onSignup }) => {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop - only covers the content area (60% width) */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          left: '40vw', // Start from where sidebar ends (40% of viewport width)
          width: '60vw'  // Only cover the content area (60% of viewport width)
        }}
        onClick={onClose}
      />
      
      {/* Slide-up form - positioned within the content area */}
      <div
        className={`absolute bottom-0 transform transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ 
          left: '40vw', // Start from where sidebar ends (40% of viewport width)
          width: '60vw', // Only take up the content area width (60% of viewport width)
          maxWidth: '60vw'
        }}
      >
        <div className="mx-auto max-w-xl w-full bg-[#222222] text-white rounded-t-2xl shadow-2xl border border-white/10 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold">Create an account to continue</h3>
              <p className="text-sm text-white/70 mt-1">You've reached the guest preview limit. Sign up to browse all media.</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={onSignup} className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors text-sm shadow-lg">Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SlideSignupGate


