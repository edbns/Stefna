import React from 'react';

interface UploadProgressProps {
  progress: number;
  fileName: string;
  status: 'uploading' | 'completed' | 'error';
  onCancel?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName,
  status,
  onCancel
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return '⏳';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📁';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64 z-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="font-medium text-sm text-gray-700 truncate max-w-32">
            {fileName}
          </span>
        </div>
        {onCancel && status === 'uploading' && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{status === 'uploading' ? 'Uploading...' : status}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default UploadProgress;
