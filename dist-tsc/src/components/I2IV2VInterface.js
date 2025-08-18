import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Image, Video, Play, RotateCcw } from 'lucide-react';
import ImageToImageUpload from './ImageToImageUpload';
import AIGenerationService from '../services/aiGenerationService';
import fileUploadService from '../services/fileUploadService';
import AIMLModelService from '../services/aimlModelService';
import { requireUserIntent } from '../utils/generationGuards';
const I2IV2VInterface = ({ userId, userTier, onGenerationComplete, onError, className = '' }) => {
    const [mode, setMode] = useState('i2i');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState(null);
    const [quality, setQuality] = useState('high');
    // Get available models for the current mode
    const getAvailableModels = useCallback(() => {
        if (mode === 'i2i') {
            return AIMLModelService.getInstance().getModelsByCapability('image-to-image');
        }
        else {
            return AIMLModelService.getInstance().getModelsByCapability('video-to-video');
        }
    }, [mode]);
    const handleFileSelect = useCallback((file, url) => {
        setSelectedFile(file);
        setFileUrl(url);
    }, []);
    const handleFileRemove = useCallback(() => {
        setSelectedFile(null);
        setFileUrl(null);
    }, []);
    const handleGenerate = useCallback(async () => {
        if (!selectedFile || !fileUrl) {
            onError('Please select a file first');
            return;
        }
        if (!prompt.trim()) {
            onError('Please enter a prompt');
            return;
        }
        // Apply user intent guard
        if (requireUserIntent({ userInitiated: true, source: 'custom' })) {
            onError('Generation blocked by guard');
            return;
        }
        setIsGenerating(true);
        setGenerationStatus({
            isGenerating: true,
            progress: 0,
            status: 'processing'
        });
        try {
            // Use existing smart detection - let the system decide based on file type
            const request = {
                prompt: prompt.trim(),
                type: mode === 'i2i' ? 'photo' : 'video',
                quality,
                userId,
                userTier,
                imageFile: mode === 'i2i' ? selectedFile : undefined,
                videoFile: mode === 'v2v' ? selectedFile : undefined,
                imageUrl: mode === 'i2i' ? fileUrl : undefined,
                videoUrl: mode === 'v2v' ? fileUrl : undefined
            };
            const result = await AIGenerationService.getInstance().generateContent(request);
            if (result.success && result.result) {
                onGenerationComplete(result.result);
                setGenerationStatus({
                    isGenerating: false,
                    progress: 100,
                    status: 'completed'
                });
            }
            else {
                onError(result.error || 'Generation failed');
                setGenerationStatus({
                    isGenerating: false,
                    progress: 0,
                    status: 'error',
                    error: result.error
                });
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Generation failed';
            onError(errorMessage);
            setGenerationStatus({
                isGenerating: false,
                progress: 0,
                status: 'error',
                error: errorMessage
            });
        }
        finally {
            setIsGenerating(false);
        }
    }, [selectedFile, fileUrl, prompt, mode, quality, userId, userTier, selectedModel, onGenerationComplete, onError]);
    const handleReset = useCallback(() => {
        setSelectedFile(null);
        setFileUrl(null);
        setPrompt('');
        setSelectedModel('');
        setGenerationStatus(null);
        setIsGenerating(false);
    }, []);
    const availableModels = getAvailableModels();
    return (_jsxs("div", { className: `w-full max-w-4xl mx-auto p-6 ${className}`, children: [_jsxs("div", { className: "mb-6", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: [mode === 'i2i' ? 'Image-to-Image' : 'Video-to-Video', " Transformation"] }), _jsxs("p", { className: "text-gray-600", children: ["Transform your ", mode === 'i2i' ? 'images' : 'videos', " with AI-powered style transfer and enhancement"] })] }), _jsxs("div", { className: "flex space-x-2 mb-6", children: [_jsxs("button", { onClick: () => setMode('i2i'), className: `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${mode === 'i2i'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx(Image, { size: 16 }), _jsx("span", { children: "Image-to-Image" })] }), _jsxs("button", { onClick: () => setMode('v2v'), className: `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${mode === 'v2v'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx(Video, { size: 16 }), _jsx("span", { children: "Video-to-Video" })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: ["Upload ", mode === 'i2i' ? 'Image' : 'Video'] }), _jsx(ImageToImageUpload, { onFileSelect: handleFileSelect, onFileRemove: handleFileRemove, acceptedTypes: mode === 'i2i' ? 'image' : 'video', maxSize: mode === 'i2i' ? 8 : 50 })] }), selectedFile && fileUrl && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Preview" }), _jsxs("div", { className: "border rounded-lg p-4 bg-gray-50", children: [mode === 'i2i' ? (_jsx("img", { src: fileUrl, alt: "Preview", className: "w-full h-64 object-cover rounded" })) : (_jsx("video", { src: fileUrl, className: "w-full h-64 object-cover rounded", controls: true })), _jsxs("div", { className: "mt-2 text-sm text-gray-600", children: [_jsxs("p", { children: [_jsx("strong", { children: "File:" }), " ", selectedFile.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Size:" }), " ", fileUploadService.getFileSizeString(selectedFile.size)] }), _jsxs("p", { children: [_jsx("strong", { children: "Type:" }), " ", selectedFile.type] })] })] })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Transformation Prompt" }), _jsx("textarea", { value: prompt, onChange: (e) => setPrompt(e.target.value), placeholder: `Describe how you want to transform your ${mode === 'i2i' ? 'image' : 'video'}...`, className: "w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Be specific about the style, mood, or transformation you want to apply" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "AI Model" }), _jsxs("select", { value: selectedModel, onChange: (e) => setSelectedModel(e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent", children: [_jsx("option", { value: "", children: "Auto-select best model" }), availableModels.map((model) => (_jsxs("option", { value: model.id, children: [model.name, " - ", model.description] }, model.id)))] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Quality" }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", value: "standard", checked: quality === 'standard', onChange: (e) => setQuality(e.target.value), className: "text-black focus:ring-black" }), _jsx("span", { children: "Standard (faster)" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", value: "high", checked: quality === 'high', onChange: (e) => setQuality(e.target.value), className: "text-black focus:ring-black" }), _jsx("span", { children: "High Quality" })] })] })] }), generationStatus && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Status" }), _jsxs("div", { className: "border rounded-lg p-4 bg-gray-50", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-sm font-medium", children: [generationStatus.status === 'processing' && 'Processing...', generationStatus.status === 'completed' && 'Completed', generationStatus.status === 'error' && 'Error'] }), generationStatus.status === 'processing' && (_jsxs("span", { className: "text-sm text-gray-500", children: [Math.round(generationStatus.progress), "%"] }))] }), generationStatus.status === 'processing' && (_jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-black h-2 rounded-full transition-all duration-300", style: { width: `${generationStatus.progress}%` } }) })), generationStatus.error && (_jsx("p", { className: "text-sm text-red-600 mt-2", children: generationStatus.error }))] })] })), _jsxs("div", { className: "flex space-x-4", children: [_jsx("button", { onClick: handleGenerate, disabled: !selectedFile || !prompt.trim() || isGenerating, className: `flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${!selectedFile || !prompt.trim() || isGenerating
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-black text-white hover:bg-gray-800'}`, children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "Processing..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Play, { size: 16 }), _jsx("span", { children: "Generate Transformation" })] })) }), _jsx("button", { onClick: handleReset, className: "px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors", children: _jsx(RotateCcw, { size: 16 }) })] })] })] })] }));
};
export default I2IV2VInterface;
