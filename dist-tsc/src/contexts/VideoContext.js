import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
const VideoContext = createContext(undefined);
export const useVideoContext = () => {
    const context = useContext(VideoContext);
    if (context === undefined) {
        throw new Error('useVideoContext must be used within a VideoProvider');
    }
    return context;
};
export const VideoProvider = ({ children }) => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [currentVideoPrompt, setCurrentVideoPrompt] = useState('');
    const [isVideoMode, setIsVideoMode] = useState(false);
    const value = {
        selectedVideo,
        setSelectedVideo,
        currentVideoPrompt,
        setCurrentVideoPrompt,
        isVideoMode,
        setIsVideoMode,
    };
    return (_jsx(VideoContext.Provider, { value: value, children: children }));
};
