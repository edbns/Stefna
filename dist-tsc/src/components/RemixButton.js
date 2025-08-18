import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
export default function RemixButton({ assetId, cloudinaryPublicId, mediaType, onRemix }) {
    const [isRemixing, setIsRemixing] = useState(false);
    const handleRemix = () => {
        setIsRemixing(true);
        onRemix(assetId, cloudinaryPublicId);
        setIsRemixing(false);
    };
    return (_jsx("button", { onClick: handleRemix, disabled: isRemixing, className: "px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50 transition-colors", title: `Remix this ${mediaType}`, children: isRemixing ? 'Remixing...' : 'Remix' }));
}
