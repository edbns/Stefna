// src/components/HiddenUploader.tsx
import React, { useRef, useState, useEffect } from 'react';
import { handleUploadSelectedFile } from '../lib/upload';
import { useToasts } from './ui/Toasts';
import { useIntentQueue } from '../state/intentQueue';

export function HiddenUploader() {
  const [key, setKey] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const { addToast } = useToasts();
  const { setSourceUrl } = useIntentQueue();

  // Listen for reset events from composer
  useEffect(() => {
    const handleReset = () => {
      console.log('🔄 HiddenUploader: Reset event received, incrementing key')
      setKey((k) => k + 1)
      if (ref.current) {
        ref.current.value = ''
      }
    }

    window.addEventListener('reset-hidden-uploader', handleReset)
    return () => window.removeEventListener('reset-hidden-uploader', handleReset)
  }, [])

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.info('📁 File selected:', file.name);
    
    try {
      addToast({ title: 'Uploading...', message: 'Please wait...' });
      const secureUrl = await handleUploadSelectedFile(file);
      
      // Call back into the queue on success
      console.info('📁 Upload success, setting source and kicking queue');
      setSourceUrl(secureUrl);
      
      // Import and kick the queue
      // const { kickRunIfReady } = await import('../runner/kick'); // REMOVED - using database-driven presets now
      // await kickRunIfReady(); // REMOVED - using database-driven presets now
      
    } catch (error) {
      console.error('Upload failed:', error);
      addToast({ title: 'Upload failed', message: 'Please try again.' });
    } finally {
      // Allow immediate re-select same file without page refresh
      console.info('📁 Resetting file input for next upload');
      setKey((k) => k + 1);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <input
      id="hidden-file-input"
      key={key}
      ref={ref}
      type="file"
      accept="image/*,video/*"
      hidden
      onChange={onChange}
    />
  );
}
