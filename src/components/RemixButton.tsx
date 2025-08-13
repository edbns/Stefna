import { useState } from 'react';

interface RemixButtonProps {
  assetId: string;
  cloudinaryPublicId: string;
  mediaType: 'image' | 'video';
  onRemix: (sourceAssetId: string, sourcePublicId: string) => void;
}

export default function RemixButton({ assetId, cloudinaryPublicId, mediaType, onRemix }: RemixButtonProps) {
  const [isRemixing, setIsRemixing] = useState(false);

  const handleRemix = () => {
    setIsRemixing(true);
    onRemix(assetId, cloudinaryPublicId);
    setIsRemixing(false);
  };

  return (
    <button
      onClick={handleRemix}
      disabled={isRemixing}
      className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
      title={`Remix this ${mediaType}`}
    >
      {isRemixing ? 'Remixing...' : 'Remix'}
    </button>
  );
}
