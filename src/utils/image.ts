export const imageUtils = {
  // Convert file to base64 data URL
  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Resize image for thumbnail/preview
  async resizeImage(dataUrl: string, maxWidth: number = 400, quality: number = 0.8): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.src = dataUrl;
    });
  },

  // Generate thumbnail
  async createThumbnail(dataUrl: string): Promise<string> {
    return this.resizeImage(dataUrl, 200, 0.6);
  },

  // Download image to device
  downloadImage(dataUrl: string, filename: string = 'ai-filtered-photo.jpg') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Share image (Web Share API with fallback)
  async shareImage(dataUrl: string, title: string = 'Check out my AI-filtered photo!') {
    if (navigator.share && navigator.canShare) {
      try {
        // Convert data URL to blob for sharing
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title,
            files: [file]
          });
          return true;
        }
      } catch (error) {
        console.log('Web Share API not supported, falling back to download');
      }
    }
    
    // Fallback: download the image
    this.downloadImage(dataUrl);
    return false;
  }
};