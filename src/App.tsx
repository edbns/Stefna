import React, { useState, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { Screen, Photo } from './types';
import BottomNav from './components/navigation/BottomNav';
import CameraScreen from './components/screens/CameraScreen';
import EditScreen from './components/screens/EditScreen';
import FeedScreen from './components/screens/FeedScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('camera');
  const [currentPhoto, setCurrentPhoto] = useState<Photo | undefined>(undefined);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');

  const handlePhotoSelected = (photo: Photo) => {
    setCurrentPhoto(photo);
    setCurrentScreen('edit');
  };

  const handleGoToCamera = () => {
    setCurrentScreen('camera');
  };

  const handleTryPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    setCurrentScreen('edit');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'camera':
        return <CameraScreen onPhotoSelected={handlePhotoSelected} />;
      case 'edit':
        return (
          <EditScreen 
            currentPhoto={currentPhoto} 
            onGoToCamera={handleGoToCamera}
          />
        );
      case 'feed':
        return <FeedScreen onTryPrompt={handleTryPrompt} />;
      default:
        return <CameraScreen onPhotoSelected={handlePhotoSelected} />;
    }
  };

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gray-50">
        {renderScreen()}
        <BottomNav 
          activeScreen={currentScreen} 
          onScreenChange={setCurrentScreen} 
        />
      </div>
      
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
    </div>
  );
}

export default App;