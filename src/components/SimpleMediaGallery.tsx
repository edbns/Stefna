// SimpleMediaGallery.tsx - Clean, simple media display
import React, { useEffect, useState } from 'react'
import userMediaService, { UserMedia } from '../services/userMediaService'
import authService from '../services/authService'
import { useToasts } from './ui/Toasts'

export const SimpleMediaGallery: React.FC = () => {
  const { notifyError } = useToasts()
  const [media, setMedia] = useState<UserMedia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserMedia()
  }, [])

  const loadUserMedia = async () => {
    try {
      const user = authService.getCurrentUser()
      if (!user) {
        setLoading(false)
        return
      }

      const result = await userMediaService.getUserMedia(user.id)
      setMedia(result)
    } catch (error: any) {
      notifyError({ title: 'Failed to load media', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">No images yet. Create your first AI art!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
      {media.map((item) => (
        <div key={item.id} className="relative group">
          <img
            src={item.url}
            alt=""
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              onClick={() => window.open(item.url, '_blank')}
              className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200"
            >
              View
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
