import React, { useState, useEffect } from 'react';
import { getActivePresets, forceRotation, resetRotation, searchPresets, getPresetsByCategory, PresetCategory } from '../config/presetEngine';

export const PresetSelector: React.FC = () => {
  const [activePresets, setActivePresets] = useState(getActivePresets());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all'>('all');
  const [showRotationControls, setShowRotationControls] = useState(false);

  // Refresh presets when component mounts or rotation changes
  useEffect(() => {
    setActivePresets(getActivePresets());
  }, []);

  const handleForceRotation = () => {
    forceRotation();
    setActivePresets(getActivePresets());
  };

  const handleResetRotation = () => {
    resetRotation();
    setActivePresets(getActivePresets());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchPresets(query);
      setActivePresets(results.map(preset => ({
        presetKey: preset.key,
        displayName: preset.displayName,
        category: preset.category,
        thumbnail: preset.thumbnail,
        promptFragment: preset.promptFragment,
        strength: preset.strength,
        model: preset.model,
        features: preset.features,
        description: preset.description
      })));
    } else {
      setActivePresets(getActivePresets());
    }
  };

  const handleCategoryFilter = (category: PresetCategory | 'all') => {
    setSelectedCategory(category);
    if (category === 'all') {
      setActivePresets(getActivePresets());
    } else {
      const categoryPresets = getPresetsByCategory(category);
      setActivePresets(categoryPresets.map(preset => ({
        presetKey: preset.key,
        displayName: preset.displayName,
        category: preset.category,
        thumbnail: preset.thumbnail,
        promptFragment: preset.promptFragment,
        strength: preset.strength,
        model: preset.model,
        features: preset.features,
        description: preset.description
      })));
    }
  };

  const categories: PresetCategory[] = ['Cinematic', 'Vibrant', 'Minimalist', 'Vintage', 'Travel', 'Nature', 'Portrait', 'Urban', 'Black & White', 'Soft', 'Warm', 'Editorial', 'Clarity', 'Cool', 'Moody'];

  return (
    <div className="preset-selector p-4 bg-white/5 border border-[#333333] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">🎨 Preset Engine</h3>
        <button
          onClick={() => setShowRotationControls(!showRotationControls)}
          className="px-3 py-1 text-xs bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
        >
          ⚙️ Rotation Controls
        </button>
      </div>

      {/* Rotation Controls */}
      {showRotationControls && (
        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-white/60">🔄 Rotation Controls:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleForceRotation}
              className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition-colors"
            >
              🔄 Force Rotation
            </button>
            <button
              onClick={handleResetRotation}
              className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
            >
              🗑️ Reset Rotation
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-[#333333] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors text-sm"
          />
          <div className="absolute right-3 top-2.5 text-white/40">
            🔍
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryFilter('all')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            🌟 All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryFilter(category)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Active Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activePresets.map((preset) => (
          <div
            key={preset.presetKey}
            className="preset-card p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            {/* Thumbnail Placeholder */}
            <div className="w-full h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center">
              <span className="text-2xl">🎨</span>
            </div>

            {/* Preset Info */}
            <div className="space-y-2">
              <h4 className="font-medium text-white text-sm">{preset.displayName}</h4>
              <p className="text-xs text-white/60">{preset.description}</p>
              
              {/* Category and Strength */}
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 text-xs bg-white/10 text-white/60 rounded">
                  {preset.category}
                </span>
                <span className="text-xs text-white/40">
                  Strength: {preset.strength}
                </span>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1">
                {preset.features.slice(0, 3).map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded"
                  >
                    {feature}
                  </span>
                ))}
                {preset.features.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-white/10 text-white/40 rounded">
                    +{preset.features.length - 3}
                  </span>
                )}
              </div>

              {/* Model */}
              <div className="text-xs text-white/40">
                Model: {preset.model}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {activePresets.length === 0 && (
        <div className="text-center py-8 text-white/40">
          <div className="text-4xl mb-2">🔍</div>
          <p>No presets found matching your criteria</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setActivePresets(getActivePresets());
            }}
            className="mt-2 px-4 py-2 text-sm bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Preset Count */}
      <div className="mt-4 text-center text-xs text-white/40">
        Showing {activePresets.length} presets
        {searchQuery && ` for "${searchQuery}"`}
        {selectedCategory !== 'all' && ` in ${selectedCategory}`}
      </div>
    </div>
  );
};
