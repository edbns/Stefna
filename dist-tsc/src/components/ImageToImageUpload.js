import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Video, FileText } from 'lucide-react';
import fileUploadService from '../services/fileUploadService';
const ImageToImageUpload = ({ onFileSelect, onFileRemove, acceptedTypes, maxSize = 50, // 50MB default
className = '' }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const validateFile = useCallback((file) => {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            return false;
        }
        // Check file type
        if (acceptedTypes === 'image') {
            if (!fileUploadService.validateFileForI2I(file)) {
                setError('Invalid image file type. Supported: JPEG, PNG, WebP');
                return false;
            }
        }
        else if (acceptedTypes === 'video') {
            if (!fileUploadService.validateFileForV2V(file)) {
                setError('Invalid video file type. Supported: MP4, WebM, AVI, MOV');
                return false;
            }
        }
        else if (acceptedTypes === 'both') {
            if (!fileUploadService.validateFileForI2I(file) && !fileUploadService.validateFileForV2V(file)) {
                setError('Invalid file type. Supported: JPEG, PNG, WebP, MP4, WebM, AVI, MOV');
                return false;
            }
        }
        return true;
    }, [acceptedTypes, maxSize]);
    const handleFileSelect = useCallback(async (file) => {
        setError(null);
        if (!validateFile(file)) {
            return;
        }
        setSelectedFile(file);
        // Create preview URL
        const preview = fileUploadService.createPreviewUrl(file);
        setPreviewUrl(preview);
        // Upload file and get public URL
        try {
            setUploadProgress({ progress: 0, status: 'uploading' });
            const uploadResult = await fileUploadService.uploadFile(file, (progress) => {
                setUploadProgress(progress);
            });
            if (uploadResult.url) {
                onFileSelect(file, uploadResult.url);
                setUploadProgress({ progress: 100, status: 'completed' });
            }
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Upload failed');
            setUploadProgress({ progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
        }
    }, [validateFile, onFileSelect]);
    const handleFileRemove = useCallback(() => {
        if (previewUrl) {
            fileUploadService.revokePreviewUrl(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadProgress(null);
        setError(null);
        onFileRemove();
    }, [previewUrl, onFileRemove]);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);
    const handleFileInputChange = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);
    const getAcceptedTypes = () => {
        switch (acceptedTypes) {
            case 'image':
                return 'image/jpeg,image/jpg,image/png,image/webp';
            case 'video':
                return 'video/mp4,video/webm,video/avi,video/mov';
            case 'both':
                return 'image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/avi,video/mov';
            default:
                return '';
        }
    };
    const getIcon = () => {
        if (selectedFile) {
            if (selectedFile.type.startsWith('image/')) {
                return _jsx(Image, { size: 24, className: "text-gray-400" });
            }
            else if (selectedFile.type.startsWith('video/')) {
                return _jsx(Video, { size: 24, className: "text-gray-400" });
            }
            else {
                return _jsx(FileText, { size: 24, className: "text-gray-400" });
            }
        }
        return _jsx(Upload, { size: 24, className: "text-gray-400" });
    };
    const getDragText = () => {
        if (selectedFile) {
            return `Selected: ${selectedFile.name}`;
        }
        switch (acceptedTypes) {
            case 'image':
                return 'Drag & drop an image here or click to browse';
            case 'video':
                return 'Drag & drop a video here or click to browse';
            case 'both':
                return 'Drag & drop an image or video here or click to browse';
            default:
                return 'Drag & drop a file here or click to browse';
        }
    };
    return (_jsxs("div", { className: `w-full ${className}`, children: [!selectedFile ? (_jsxs("div", { className: `relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: getAcceptedTypes(), onChange: handleFileInputChange, className: "hidden" }), _jsxs("div", { className: "flex flex-col items-center space-y-2", children: [getIcon(), _jsx("p", { className: "text-sm text-gray-600", children: getDragText() }), _jsxs("p", { className: "text-xs text-gray-400", children: ["Max size: ", maxSize, "MB"] })] }), _jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), className: "mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors", children: "Choose File" })] })) : (_jsxs("div", { className: "relative border rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [getIcon(), _jsx("span", { className: "text-sm font-medium", children: selectedFile.name }), _jsxs("span", { className: "text-xs text-gray-400", children: ["(", fileUploadService.getFileSizeString(selectedFile.size), ")"] })] }), _jsx("button", { type: "button", onClick: handleFileRemove, className: "p-1 hover:bg-gray-100 rounded", children: _jsx(X, { size: 16, className: "text-gray-400" }) })] }), previewUrl && (_jsx("div", { className: "relative", children: selectedFile.type.startsWith('image/') ? (_jsx("img", { src: previewUrl, alt: "Preview", className: "w-full h-32 object-cover rounded" })) : selectedFile.type.startsWith('video/') ? (_jsx("video", { src: previewUrl, className: "w-full h-32 object-cover rounded", controls: true })) : null })), uploadProgress && (_jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [_jsxs("span", { children: [uploadProgress.status === 'uploading' && 'Uploading...', uploadProgress.status === 'completed' && 'Upload complete', uploadProgress.status === 'error' && 'Upload failed'] }), uploadProgress.status === 'uploading' && (_jsxs("span", { children: [Math.round(uploadProgress.progress), "%"] }))] }), uploadProgress.status === 'uploading' && (_jsx("div", { className: "w-full bg-gray-200 rounded-full h-1 mt-1", children: _jsx("div", { className: "bg-blue-500 h-1 rounded-full transition-all duration-300", style: { width: `${uploadProgress.progress}%` } }) }))] }))] })), error && (_jsx("div", { className: "mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600", children: error }))] }));
};
export default ImageToImageUpload;
