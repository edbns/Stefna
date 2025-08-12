import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Gift, Clock, Share2 } from 'lucide-react'

interface AIUsageLimitModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteFriends: () => void
  usage: {
    daily: number
    limit: number
    resetTime: string
  }
}

const AIUsageLimitModal: React.FC<AIUsageLimitModalProps> = ({ 
  isOpen, 
  onClose, 
  onInviteFriends,
  usage 
}) => {
  const resetTime = new Date(usage.resetTime)
  const timeUntilReset = resetTime.getTime() - Date.now()
  const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60))
  const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60))

  const handleShare = () => {
    const shareText = `Join me on Stefna - the AI-powered photo app! Create amazing AI art and get bonus tokens when you sign up with my link.`
    const shareUrl = window.location.origin

    if (navigator.share) {
      navigator.share({
        title: 'Join Stefna - AI Photo App',
        text: shareText,
        url: shareUrl
      }).catch(console.error)
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      alert('Invitation link copied to clipboard!')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl max-w-md w-full p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Daily Limit Reached</h1>
              <p className="text-white/60">You've used {usage.daily}/{usage.limit} AI generations today</p>
            </div>

            {/* Usage Info */}
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={20} className="text-white/60" />
                <span className="text-sm font-medium text-white">Reset in</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {hoursUntilReset}h {minutesUntilReset}m
              </div>
              <div className="text-xs text-white/40 mt-1">
                {resetTime.toLocaleDateString()} at {resetTime.toLocaleTimeString()}
              </div>
            </div>

            {/* Invite Friends Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold text-white mb-2">Get More Tokens!</h3>
                <p className="text-sm text-white/60">
                  Invite friends to Stefna and get +5 bonus tokens for each friend who joins!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onInviteFriends}
                  className="w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 bg-white text-black hover:bg-white/90"
                >
                  <Users size={16} />
                  <span>Invite Friends</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  className="w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 bg-white/5 text-white hover:bg-white/10"
                >
                  <Share2 size={16} />
                  <span>Share App</span>
                </motion.button>
              </div>

              {/* Bonus Info */}
              <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Gift size={20} className="text-white" />
                  <span className="text-sm font-medium text-white">Bonus Tokens</span>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  Each friend gets +5 tokens, you get +5 tokens when they join!
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="text-center mt-6">
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AIUsageLimitModal 