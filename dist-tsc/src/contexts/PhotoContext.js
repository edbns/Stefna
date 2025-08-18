import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
export const PhotoContext = createContext(undefined);
export const usePhotoContext = () => {
    const context = useContext(PhotoContext);
    if (context === undefined) {
        throw new Error('usePhotoContext must be used within a PhotoContext.Provider');
    }
    return context;
};
export const PhotoProvider = ({ children }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [currentPrompt, setCurrentPrompt] = useState('');
    return (_jsx(PhotoContext.Provider, { value: {
            selectedPhoto,
            setSelectedPhoto,
            currentPrompt,
            setCurrentPrompt
        }, children: children }));
};
