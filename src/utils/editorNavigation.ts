import { NavigateFunction } from 'react-router-dom'

/**
 * Navigate to the editor with specific media and prompt
 */
export const navigateToEditor = (
  navigate: NavigateFunction,
  mediaUrl?: string,
  prompt?: string,
  mode: 'edit' | 'remix' = 'edit'
) => {
  const state: any = {}
  
  if (mediaUrl) {
    if (mode === 'remix') {
      state.remixUrl = mediaUrl
      if (prompt) {
        state.remixPrompt = prompt
      }
    } else {
      state.editUrl = mediaUrl
      if (prompt) {
        state.editPrompt = prompt
      }
    }
  }

  navigate('/', { state })
}

/**
 * Navigate to the profile screen
 */
export const navigateToProfile = (navigate: NavigateFunction) => {
  navigate('/profile')
}

/**
 * Navigate to the gallery screen
 */
export const navigateToGallery = (navigate: NavigateFunction) => {
  navigate('/gallery')
}

/**
 * Navigate to the dashboard
 */
export const navigateToDashboard = (navigate: NavigateFunction) => {
  navigate('/dashboard')
}

/**
 * Navigate to the home screen
 */
export const navigateToHome = (navigate: NavigateFunction) => {
  navigate('/')
}

/**
 * Navigate to a specific media viewer
 */
export const navigateToMediaViewer = (
  navigate: NavigateFunction,
  mediaId: string,
  mediaUrl: string,
  prompt: string
) => {
  navigate('/', { 
    state: { 
      viewerOpen: true,
      viewerMedia: [{ id: mediaId, url: mediaUrl, prompt, aspectRatio: 1 }],
      viewerIndex: 0
    }
  })
}
