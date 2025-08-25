import React, { useState } from 'react'
import ProgressiveImage from './ProgressiveImage'
import { useNetworkAwareProgressiveImage } from '../hooks/useProgressiveImage'

interface ProgressiveImageDemoProps {
  imageUrl: string
  title?: string
}

export const ProgressiveImageDemo: React.FC<ProgressiveImageDemoProps> = ({
  imageUrl,
  title = 'Progressive Image Demo'
}) => {
  const [showStages, setShowStages] = useState(false)
  const [autoLoad, setAutoLoad] = useState(true)
  
  const {
    currentStage,
    isLoading,
    error,
    urls,
    networkQuality,
    loadImage,
    setStage
  } = useNetworkAwareProgressiveImage(imageUrl, {
    autoLoad,
    onStageChange: (stage) => {
      console.log(`🚀 Progressive loading stage: ${stage}`)
    },
    onComplete: () => {
      console.log('✅ Progressive loading complete!')
    },
    onError: (error) => {
      console.error('❌ Progressive loading failed:', error)
    }
  })

  const stages = [
    { key: 'placeholder', label: 'Placeholder', description: 'Blurry, tiny, loads in ~100ms' },
    { key: 'thumbnail', label: 'Thumbnail', description: 'Small, clear, loads in ~200ms' },
    { key: 'preview', label: 'Preview', description: 'Medium size, good quality, loads in ~500ms' },
    { key: 'full', label: 'Full', description: 'Full size, best quality, loads in ~1000ms' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      {/* Network Quality Indicator */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <div className="flex items-center gap-2">
          <span className="font-medium">Network Quality:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            networkQuality === 'slow' ? 'bg-red-100 text-red-800' :
            networkQuality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {networkQuality.toUpperCase()}
          </span>
          <span className="text-sm text-gray-600">
            {networkQuality === 'slow' ? 'Poor WiFi - Using aggressive optimization' :
             networkQuality === 'medium' ? 'Moderate WiFi - Balanced optimization' :
             'Good WiFi - Full quality available'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex gap-4 items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showStages}
            onChange={(e) => setShowStages(e.target.checked)}
            className="rounded"
          />
          Show Loading Stages
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoLoad}
            onChange={(e) => setAutoLoad(e.target.checked)}
            className="rounded"
          />
          Auto Load
        </label>
        
        {!autoLoad && (
          <button
            onClick={loadImage}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load Image'}
          </button>
        )}
      </div>

      {/* Current Stage Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">Current Stage:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
            {currentStage.toUpperCase()}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          {stages.find(s => s.key === currentStage)?.description}
        </div>
      </div>

      {/* Stage Progress */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          {stages.map((stage, index) => {
            const isCompleted = stages.indexOf(stages.find(s => s.key === currentStage)!) >= index
            const isCurrent = stage.key === currentStage
            
            return (
              <div
                key={stage.key}
                className={`flex-1 h-2 rounded transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                } ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
                title={`${stage.label}: ${stage.description}`}
              />
            )
          })}
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          {stages.map(stage => (
            <span key={stage.key} className="text-center">
              {stage.label}
            </span>
          ))}
        </div>
      </div>

      {/* Image Display */}
      <div className="mb-4">
        <ProgressiveImage
          src={imageUrl}
          alt="Progressive loading demo"
          className="w-full h-96 rounded-lg shadow-md"
          showLoadingStages={showStages}
          options={{
            quality: networkQuality === 'slow' ? 60 : networkQuality === 'medium' ? 70 : 80,
            width: networkQuality === 'slow' ? 600 : networkQuality === 'medium' ? 800 : 1024
          }}
        />
      </div>

      {/* Generated URLs */}
      {urls && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Generated URLs:</h3>
          <div className="space-y-2 text-sm">
            {stages.map(stage => (
              <div key={stage.key} className="flex items-center gap-2">
                <span className="font-medium w-20">{stage.label}:</span>
                <code className="flex-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                  {urls[stage.key as keyof typeof urls]}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Manual Stage Control */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Manual Stage Control:</h3>
        <div className="flex gap-2">
          {stages.map(stage => (
            <button
              key={stage.key}
              onClick={() => setStage(stage.key as any)}
              disabled={!urls}
              className={`px-3 py-2 rounded text-sm font-medium ${
                currentStage === stage.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50`}
            >
              {stage.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProgressiveImageDemo
