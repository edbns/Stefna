import { useState } from 'react';
import { createAsset, processAsset, publishAsset } from '../lib/api';
import type { CreateAssetInput, ProcessAssetPayload, PublishAssetInput } from '../lib/types';

export default function Editor() {
  const [sourcePublicId, setSourcePublicId] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [remixedAssetId, setRemixedAssetId] = useState<string | null>(null);
  const [allowRemix, setAllowRemix] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');

  const handleCreateAsset = async () => {
    setLoading(true);
    setStatus('Creating asset...');

    const input: CreateAssetInput = {
      sourcePublicId,
      mediaType,
      presetKey: selectedPreset,
      prompt: customPrompt || null,
      sourceAssetId: remixedAssetId,
    };

    const { ok, data, error } = await createAsset(input);
    
    if (!ok) {
      setStatus(`Error: ${error}`);
      setLoading(false);
      return;
    }

    setCurrentAssetId(data.id);
    setStatus('Asset created, processing...');

    // Kick off processing
    const processPayload: ProcessAssetPayload = {
      assetId: data.id,
      sourcePublicId,
      mediaType,
      presetKey: selectedPreset,
      prompt: customPrompt || null,
    };

    const res2 = await processAsset(processPayload);
    
    if (!res2.ok) {
      setStatus(`Processing failed: ${res2.error}`);
      setLoading(false);
      return;
    }

    setStatus('Processing complete! Ready to publish.');
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!currentAssetId) return;

    setLoading(true);
    setStatus('Publishing...');

    const publishInput: PublishAssetInput = {
      assetId: currentAssetId,
      isPublic: true,
      allowRemix: allowRemix,
    };

    const r = await publishAsset(publishInput);
    
    if (!r.ok) {
      setStatus(`Publish failed: ${r.error}`);
      setLoading(false);
      return;
    }

    setStatus('Published successfully!');
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Media Editor</h1>
      
      <div className="space-y-4">
        {/* Source Media Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Source Media (Cloudinary Public ID)</label>
          <input
            type="text"
            value={sourcePublicId}
            onChange={(e) => setSourcePublicId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter Cloudinary public ID"
          />
        </div>

        {/* Media Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Media Type</label>
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
            className="w-full p-2 border rounded"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        {/* Preset Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Preset (Optional)</label>
          <select
            value={selectedPreset || ''}
            onChange={(e) => setSelectedPreset(e.target.value || null)}
            className="w-full p-2 border rounded"
          >
            <option value="">No preset (custom prompt)</option>
            <option value="professional">Professional</option>
            <option value="artistic">Artistic</option>
            <option value="realistic">Realistic</option>
          </select>
        </div>

        {/* Custom Prompt */}
        <div>
          <label className="block text-sm font-medium mb-2">Custom Prompt (Optional)</label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Enter custom prompt if not using preset"
          />
        </div>

        {/* Remix Source */}
        <div>
          <label className="block text-sm font-medium mb-2">Remix Source Asset ID (Optional)</label>
          <input
            type="text"
            value={remixedAssetId || ''}
            onChange={(e) => setRemixedAssetId(e.target.value || null)}
            className="w-full p-2 border rounded"
            placeholder="Enter source asset ID for remixing"
          />
        </div>

        {/* Allow Remix Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowRemix"
            checked={allowRemix}
            onChange={(e) => setAllowRemix(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="allowRemix">Allow others to remix this creation</label>
        </div>

        {/* Status Display */}
        <div className="p-3 bg-gray-100 rounded">
          <strong>Status:</strong> {status}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleCreateAsset}
            disabled={loading || !sourcePublicId}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Create & Process'}
          </button>

          {currentAssetId && (
            <button
              onClick={handlePublish}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
