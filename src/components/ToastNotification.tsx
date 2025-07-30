import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastProps> = ({ id, type, title, message, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  };
  
  const colors = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800'
  };
  
  const Icon = icons[type];
  
  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border ${colors[type]} p-4 transform transition-all duration-300 ease-in-out`}>
      <div className="flex items-start">
        <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium font-figtree">{title}</p>
          <p className="text-sm mt-1 font-figtree">{message}</p>
        </div>
        <button
          onClick={() => onClose(id)}
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;