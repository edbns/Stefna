import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Image, Video, FileText } from 'lucide-react'
import fileUploadService, { UploadProgress } from '../services/fileUploadService'

interface ImageToImageUploadProps {
  onFileSelect: (file: File, url: string) => void
  onFileRemove: () => void
  acceptedTypes: 'image' | 'video' | 'both'
  maxSize?: number // in MB
  className?: string
}

const ImageToImageUpload: React.FC<ImageToImageUploadProps> = ({
  onFileSelect,
  onFileRemove,
  acceptedTypes,
  maxSize = 50, // 50MB default
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return false
    }

    // Check file type
    if (acceptedTypes === 'image') {
      if (!fileUploadService.validateFileForI2I(file)) {
        setError('Invalid image file type. Supported: JPEG, PNG, WebP')
        return false
      }
    } else if (acceptedTypes === 'video') {
      if (!fileUploadService.validateFileForV2V(file)) {
        setError('Invalid video file type. Supported: MP4, WebM, AVI, MOV')
        return false
      }
    } else if (acceptedTypes === 'both') {
      if (!fileUploadService.validateFileForI2I(file) && !fileUploadService.validateFileForV2V(file)) {
        setError('Invalid file type. Supported: JPEG, PNG, WebP, MP4, WebM, AVI, MOV')
        return false
      }
    }

    return true
  }, [acceptedTypes, maxSize])

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    
    if (!validateFile(file)) {
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const preview = fileUploadService.createPreviewUrl(file)
    setPreviewUrl(preview)

    // Upload file and get public URL
    try {
      setUploadProgress({ progress: 0, status: 'uploading' })
      
      const uploadResult = await fileUploadService.uploadFile(file, (progress) => {
        setUploadProgress(progress)
      })

      if (uploadResult.url) {
        onFileSelect(file, uploadResult.url)
        setUploadProgress({ progress: 100, status: 'completed' })
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress({ progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' })
    }
  }, [validateFile, onFileSelect])

  const handleFileRemove = useCallback(() => {
    if (previewUrl) {
      fileUploadService.revokePreviewUrl(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(null)
    setError(null)
    onFileRemove()
  }, [previewUrl, onFileRemove])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const getAcceptedTypes = () => {
    switch (acceptedTypes) {
      case 'image':
        return 'image/jpeg,image/jpg,image/png,image/webp'
      case 'video':
        return 'video/mp4,video/webm,video/avi,video/mov'
      case 'both':
        return 'image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/avi,video/mov'
      default:
        return ''
    }
  }

  const getIcon = () => {
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        return <Image size={24} className="text-gray-400" />
      } else if (selectedFile.type.startsWith('video/')) {
        return <Video size={24} className="text-gray-400" />
      } else {
        return <FileText size={24} className="text-gray-400" />
      }
    }
    return <Upload size={24} className="text-gray-400" />
  }

  const getDragText = () => {
    if (selectedFile) {
      return `Selected: ${selectedFile.name}`
    }
    
    switch (acceptedTypes) {
      case 'image':
        return 'Drag & drop an image here or click to browse'
      case 'video':
        return 'Drag & drop a video here or click to browse'
      case 'both':
        return 'Drag & drop an image or video here or click to browse'
      default:
        return 'Drag & drop a file here or click to browse'
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptedTypes()}
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-2">
            {getIcon()}
            <p className="text-sm text-gray-600">{getDragText()}</p>
            <p className="text-xs text-gray-400">
              Max size: {maxSize}MB
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Choose File
          </button>
        </div>
      ) : (
        <div className="relative border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getIcon()}
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-gray-400">
                ({fileUploadService.getFileSizeString(selectedFile.size)})
              </span>
            </div>
            <button
              type="button"
              onClick={handleFileRemove}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          
          {previewUrl && (
            <div className="relative">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded"
                />
              ) : selectedFile.type.startsWith('video/') ? (
                <video
                  src={previewUrl}
                  className="w-full h-32 object-cover rounded"
                  controls
                />
              ) : null}
            </div>
          )}
          
          {uploadProgress && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {uploadProgress.status === 'uploading' && 'Uploading...'}
                  {uploadProgress.status === 'completed' && 'Upload complete'}
                  {uploadProgress.status === 'error' && 'Upload failed'}
                </span>
                {uploadProgress.status === 'uploading' && (
                  <span>{Math.round(uploadProgress.progress)}%</span>
                )}
              </div>
              {uploadProgress.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}

export default ImageToImageUpload
