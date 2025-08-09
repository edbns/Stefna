import React, { useState, useEffect } from 'react'

interface CountdownTimerProps {
  duration: number // in seconds
  onExpire: () => void
  className?: string
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  duration, 
  onExpire, 
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onExpire])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((duration - timeLeft) / duration) * 100
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="text-sm text-gray-600 mb-2">
        Code expires in
      </div>
      <div className="text-lg font-semibold text-gray-800">
        {formatTime(timeLeft)}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
        <div 
          className="bg-red-500 h-1 rounded-full transition-all duration-1000"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
    </div>
  )
}

export default CountdownTimer 