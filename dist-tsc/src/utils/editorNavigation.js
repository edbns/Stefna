/**
 * Navigate to the editor with specific media and prompt
 */
export const navigateToEditor = (navigate, mediaUrl, prompt, mode = 'edit') => {
    const state = {};
    if (mediaUrl) {
        if (mode === 'remix') {
            state.remixUrl = mediaUrl;
            if (prompt) {
                state.remixPrompt = prompt;
            }
        }
        else {
            state.editUrl = mediaUrl;
            if (prompt) {
                state.editPrompt = prompt;
            }
        }
    }
    navigate('/', { state });
};
/**
 * Navigate to the profile screen
 */
export const navigateToProfile = (navigate) => {
    navigate('/profile');
};
/**
 * Navigate to the gallery screen
 */
export const navigateToGallery = (navigate) => {
    navigate('/gallery');
};
/**
 * Navigate to the dashboard
 */
export const navigateToDashboard = (navigate) => {
    navigate('/dashboard');
};
/**
 * Navigate to the home screen
 */
export const navigateToHome = (navigate) => {
    navigate('/');
};
/**
 * Navigate to a specific media viewer
 */
export const navigateToMediaViewer = (navigate, mediaId, mediaUrl, prompt) => {
    navigate('/', {
        state: {
            viewerOpen: true,
            viewerMedia: [{ id: mediaId, url: mediaUrl, prompt, aspectRatio: 1 }],
            viewerIndex: 0
        }
    });
};
