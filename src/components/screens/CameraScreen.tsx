import React, { useRef, useState } from 'react';
import { Camera, Image, Upload, X } from 'lucide-react';
import { imageUtils } from '../../utils/image';
import { Photo } from '../../types';
import QuotaDisplay from '../ui/QuotaDisplay';
import { motion } from 'framer-motion';

interface CameraScreenProps {
  onPhotoSelected: (photo: Photo) => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onPhotoSelected }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const dataUrl = await imageUtils.fileToDataUrl(file);
      const thumbnail = await imageUtils.createThumbnail(dataUrl);
      
      const photo: Photo = {
        id: `photo_${Date.now()}`,
        originalUrl: dataUrl,
        thumbnail,
        createdAt: new Date()
      };

      setSelectedImage(dataUrl);
      onPhotoSelected(photo);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="screen-container">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AI Photo Magic ✨
        </h1>
        <p className="text-gray-600">
          Capture or upload a photo to transform with AI
        </p>
      </div>

      <QuotaDisplay />

      {selectedImage ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-lg mb-4">
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="w-full h-64 object-cover"
            />
            <button
              onClick={clearSelection}
              className="absolute top-3 right-3 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-green-600 font-medium mb-2">
              ✅ Photo ready! Go to Edit tab to apply AI filters
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Camera capture */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-lg flex items-center justify-center space-x-3"
            disabled={loading}
          >
            <Camera size={24} />
            <span className="font-semibold text-lg">Take Photo</span>
          </motion.button>

          {/* Gallery upload */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-100 text-gray-700 p-6 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <Image size={24} />
            <span className="font-semibold text-lg">Choose from Gallery</span>
          </motion.button>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2">
                <Upload className="animate-bounce text-purple-500" size={20} />
                <span className="text-gray-600">Processing image...</span>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">📸 Tips for best results:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use well-lit photos for better AI processing</li>
              <li>• Clear, focused images work best</li>
              <li>• Try different angles and subjects</li>
              <li>• Each AI filter uses 1 daily credit</li>
            </ul>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default CameraScreen;