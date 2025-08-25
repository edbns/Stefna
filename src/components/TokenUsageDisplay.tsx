import React, { useState, useEffect } from 'react'
import { User, Zap, Clock, AlertCircle } from 'lucide-react'
import tokenService, { TokenUsage } from '../services/tokenService'
import { authenticatedFetch } from '../utils/apiClient'

interface TokenUsageDisplayProps {
  userId: string
  className?: string
}

const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({ 
  userId, 
  className = '' 
}) => {
  const [usage, setUsage] = useState<TokenUsage | null>(null)
  const [serverQuota, setServerQuota] = useState<{ daily_used: number; daily_limit: number; weekly_used: number; weekly_limit: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserUsage()
    loadServerQuota()
  }, [userId])

  const loadUserUsage = async () => {
    try {
      const userUsage = await tokenService.getUserUsage(userId)
      setUsage(userUsage)
    } catch (error) {
      console.error('Failed to load token usage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadServerQuota = async () => {
    try {
      const res = await authenticatedFetch('/.netlify/functions/getQuota', { method: 'GET' })
      if (res.ok) {
        setServerQuota(await res.json())
      } else {
        setServerQuota(null)
      }
    } catch (e) {
      console.error('Failed to load server quota:', e)
      setServerQuota(null)
    }
  }

  const getStatusColor = () => {
    return 'text-blue-400'
  }

  const getStatusName = () => {
    return 'Active'
  }

  const getUsagePercentage = () => {
    if (!usage) return 0
    const du = serverQuota ? serverQuota.daily_used : usage.dailyUsage
    const dl = serverQuota ? serverQuota.daily_limit : usage.dailyLimit
    return (du / dl) * 100
  }

  const getUsageColor = () => {
    const percentage = getUsagePercentage()
    if (percentage >= 90) return 'text-red-400'
    if (percentage >= 75) return 'text-yellow-400'
    return 'text-green-400'
  }

  if (isLoading) {
    return (
      <div className={`bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded mb-2"></div>
          <div className="h-3 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  if (!usage) {
    return null
  }

  return (
    <div className={`bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 ${className}`}>
      {/* Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <User size={16} className={getStatusColor()} />
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusName()}
          </span>
        </div>
        
        {usage.isRateLimited && (
          <div className="flex items-center space-x-1 text-red-400">
            <AlertCircle size={14} />
            <span className="text-xs">Rate Limited</span>
          </div>
        )}
      </div>

      {/* Usage Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/60">Daily Usage</span>
          <span className={`font-medium ${getUsageColor()}`}>
            {serverQuota ? serverQuota.daily_used : usage.dailyUsage} / {serverQuota ? serverQuota.daily_limit : usage.dailyLimit}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              getUsagePercentage() >= 90 ? 'bg-red-400' :
              getUsagePercentage() >= 75 ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Remaining Tokens */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-white/60">
          <Zap size={12} />
          <span>Remaining: {(serverQuota ? serverQuota.daily_limit - serverQuota.daily_used : usage.dailyLimit - usage.dailyUsage)}</span>
        </div>
        
        <div className="flex items-center space-x-1 text-white/40">
          <Clock size={12} />
          <span>Resets daily</span>
        </div>
      </div>

      {/* Low Usage Warning */}
      {getUsagePercentage() >= 90 && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          <div className="flex items-center space-x-1">
            <AlertCircle size={12} />
            <span>Daily limit almost reached</span>
          </div>
        </div>
      )}

      {/* Negative Balance Warning */}
      {serverQuota && serverQuota.daily_used > serverQuota.daily_limit && (
        <div className="mt-3 p-2 bg-red-600/20 border border-red-600/30 rounded text-xs text-red-300">
          <div className="flex items-center space-x-1">
            <AlertCircle size={12} />
            <span>Daily limit exceeded - generation blocked until tomorrow</span>
          </div>
          <div className="mt-1 text-red-200">
            You have used {serverQuota.daily_used} credits today (limit: {serverQuota.daily_limit})
          </div>
        </div>
      )}

      {/* Rate Limit Warning */}
      {usage.isRateLimited && (
        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
          <div className="flex items-center space-x-1">
            <Clock size={12} />
            <span>Please wait 30 seconds between generations</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default TokenUsageDisplay 