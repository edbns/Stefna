// HomeSimple.tsx - The NEW simple home page (replace the 5000+ line monster)
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { GenerationInterface } from './GenerationInterface'
import { SimpleMediaGallery } from './SimpleMediaGallery'
import authService from '../services/authService'

export const HomeSimple: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create')
  const [refreshGallery, setRefreshGallery] = useState(0)

  const isAuthenticated = !!authService.getCurrentUser()

  const handleGenerationComplete = () => {
    // Refresh gallery when new image is created
    setRefreshGallery(prev => prev + 1)
    setActiveTab('gallery')
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Stefna AI</h1>
        
        <button
          onClick={() => navigate(isAuthenticated ? '/profile' : '/auth')}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <User className="w-6 h-6 text-white" />
        </button>
      </header>

      {/* Auth Gate */}
      {!isAuthenticated ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to Stefna AI</h2>
            <p className="text-gray-400 mb-8">Create amazing AI-powered art</p>
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200"
            >
              Sign In to Start
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-4 text-center font-semibold transition-colors ${
                activeTab === 'create'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 py-4 text-center font-semibold transition-colors ${
                activeTab === 'gallery'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Gallery
            </button>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto">
            {activeTab === 'create' ? (
              <GenerationInterface onGenerationComplete={handleGenerationComplete} />
            ) : (
              <SimpleMediaGallery key={refreshGallery} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
