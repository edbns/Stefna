import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VideoData } from '../services/videoService';

interface VideoContextType {
  selectedVideo: VideoData | null;
  setSelectedVideo: (video: VideoData | null) => void;
  currentVideoPrompt: string;
  setCurrentVideoPrompt: (prompt: string) => void;
  isVideoMode: boolean;
  setIsVideoMode: (mode: boolean) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const useVideoContext = () => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideoContext must be used within a VideoProvider');
  }
  return context;
};

interface VideoProviderProps {
  children: ReactNode;
}

export const VideoProvider: React.FC<VideoProviderProps> = ({ children }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [currentVideoPrompt, setCurrentVideoPrompt] = useState<string>('');
  const [isVideoMode, setIsVideoMode] = useState<boolean>(false);

  const value = {
    selectedVideo,
    setSelectedVideo,
    currentVideoPrompt,
    setCurrentVideoPrompt,
    isVideoMode,
    setIsVideoMode,
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
}; 