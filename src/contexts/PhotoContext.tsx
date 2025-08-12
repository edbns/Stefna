import { createContext, useContext, useState, ReactNode } from 'react'

interface PhotoContextType {
  selectedPhoto: string | null
  setSelectedPhoto: (photo: string | null) => void
  currentPrompt: string
  setCurrentPrompt: (prompt: string) => void
}

export const PhotoContext = createContext<PhotoContextType | undefined>(undefined)

export const usePhotoContext = () => {
  const context = useContext(PhotoContext)
  if (context === undefined) {
    throw new Error('usePhotoContext must be used within a PhotoContext.Provider')
  }
  return context
}

interface PhotoProviderProps {
  children: ReactNode
}

export const PhotoProvider = ({ children }: PhotoProviderProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string>('')

  return (
    <PhotoContext.Provider value={{
      selectedPhoto,
      setSelectedPhoto,
      currentPrompt,
      setCurrentPrompt
    }}>
      {children}
    </PhotoContext.Provider>
  )
} 