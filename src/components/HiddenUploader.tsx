// src/components/HiddenUploader.tsx
import { useRef, useState } from 'react';
import { handleUploadSelectedFile } from '../lib/upload';
import { useToasts } from './ui/Toasts';

export function HiddenUploader() {
  const [key, setKey] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const { addToast } = useToasts();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.info('📁 File selected:', file.name);
    
    try {
      addToast('Uploading...', 'info');
      await handleUploadSelectedFile(file);
      // Success toast will be shown by the generation pipeline
    } catch (error) {
      console.error('Upload failed:', error);
      addToast('Upload failed. Please try again.', 'error');
    } finally {
      // Allow immediate re-select same file without page refresh
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
