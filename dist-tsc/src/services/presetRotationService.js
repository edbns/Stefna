// Smart Preset Rotation Service
// Handles weekly rotation, usage tracking, and smart retention
import { PROFESSIONAL_PRESETS } from '../config/professional-presets';
class PresetRotationService {
    constructor() {
        Object.defineProperty(this, "STORAGE_KEY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'stefna_preset_rotation'
        });
        Object.defineProperty(this, "USAGE_STORAGE_KEY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'stefna_preset_usage'
        });
        Object.defineProperty(this, "DEFAULT_CONFIG", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                totalPresets: 6,
                retentionCount: 3,
                rotationDay: 'monday',
                rotationTime: '00:00'
            }
        });
    }
    // Get current rotation configuration
    getRotationConfig() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                return { ...this.DEFAULT_CONFIG, ...JSON.parse(stored) };
            }
            catch {
                return this.DEFAULT_CONFIG;
            }
        }
        return this.DEFAULT_CONFIG;
    }
    // Get current preset usage data
    getPresetUsage() {
        const stored = localStorage.getItem(this.USAGE_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            }
            catch {
                return {};
            }
        }
        return {};
    }
    // Save preset usage data
    savePresetUsage(usage) {
        localStorage.setItem(this.USAGE_STORAGE_KEY, JSON.stringify(usage));
    }
    // Check if it's time to rotate presets
    shouldRotate() {
        const config = this.getRotationConfig();
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        // Check if it's rotation day and time
        if (currentDay === config.rotationDay && currentTime === config.rotationTime) {
            // Check if we already rotated today
            const lastRotation = localStorage.getItem('stefna_last_rotation');
            const today = now.toDateString();
            if (lastRotation !== today) {
                localStorage.setItem('stefna_last_rotation', today);
                return true;
            }
        }
        return false;
    }
    // Get the current active presets (with smart rotation)
    getActivePresets() {
        try {
            const config = this.getRotationConfig();
            const usage = this.getPresetUsage();
            // Check if we need to rotate
            if (this.shouldRotate()) {
                this.performRotation();
            }
            // Get current active presets from storage
            const activePresetIds = this.getStoredActivePresets();
            // If no active presets stored, generate new ones
            if (!activePresetIds || activePresetIds.length === 0) {
                console.log('🔄 No active presets found, generating initial rotation...');
                return this.generateNewRotation();
            }
            // Return the active presets
            const activePresets = activePresetIds
                .map(id => PROFESSIONAL_PRESETS[id])
                .filter(Boolean);
            console.log(`✅ Returning ${activePresets.length} active presets`);
            return activePresets;
        }
        catch (error) {
            console.error('❌ Error getting active presets:', error);
            // Fallback to random selection if there's an error
            console.log('🔄 Falling back to random preset selection');
            return this.getRandomPresets(6);
        }
    }
    // Generate a new rotation of presets
    generateNewRotation() {
        try {
            const config = this.getRotationConfig();
            const usage = this.getPresetUsage();
            // Sort presets by usage (most used first)
            const sortedPresets = Object.values(PROFESSIONAL_PRESETS).sort((a, b) => {
                const aUsage = usage[a.id]?.usageCount || 0;
                const bUsage = usage[b.id]?.usageCount || 0;
                return bUsage - aUsage;
            });
            // Keep top retentionCount presets
            const retainedPresets = sortedPresets.slice(0, config.retentionCount);
            // Get random presets from the remaining ones
            const remainingPresets = sortedPresets.slice(config.retentionCount);
            const randomPresets = this.shuffleArray(remainingPresets).slice(0, config.totalPresets - config.retentionCount);
            // Combine retained and random presets
            const newRotation = [...retainedPresets, ...randomPresets];
            // Store the new rotation
            this.storeActivePresets(newRotation.map(p => p.id));
            return newRotation;
        }
        catch (error) {
            console.error('❌ Error generating new rotation:', error);
            // Fallback to random selection if there's an error
            return this.getRandomPresets(6);
        }
    }
    // Perform the rotation
    performRotation() {
        console.log('🔄 Performing preset rotation...');
        const newPresets = this.generateNewRotation();
        console.log('✅ New preset rotation:', newPresets.map(p => p.name));
    }
    // Store active preset IDs
    storeActivePresets(presetIds) {
        localStorage.setItem('stefna_active_presets', JSON.stringify(presetIds));
    }
    // Get stored active preset IDs
    getStoredActivePresets() {
        const stored = localStorage.getItem('stefna_active_presets');
        if (stored) {
            try {
                return JSON.parse(stored);
            }
            catch {
                return [];
            }
        }
        return [];
    }
    // Track preset usage
    trackPresetUsage(presetId) {
        const usage = this.getPresetUsage();
        const now = new Date();
        if (usage[presetId]) {
            usage[presetId].usageCount += 1;
            usage[presetId].lastUsed = now;
        }
        else {
            const preset = PROFESSIONAL_PRESETS[presetId];
            if (preset) {
                usage[presetId] = {
                    presetId,
                    usageCount: 1,
                    lastUsed: now,
                    category: preset.category
                };
            }
        }
        this.savePresetUsage(usage);
    }
    // Get preset usage statistics
    getPresetStats() {
        const usage = this.getPresetUsage();
        const usageArray = Object.values(usage);
        const totalUsage = usageArray.reduce((sum, u) => sum + u.usageCount, 0);
        const mostUsed = [...usageArray].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
        const leastUsed = [...usageArray].sort((a, b) => a.usageCount - b.usageCount).slice(0, 5);
        const categoryStats = {};
        usageArray.forEach(u => {
            categoryStats[u.category] = (categoryStats[u.category] || 0) + u.usageCount;
        });
        return {
            totalUsage,
            mostUsed,
            leastUsed,
            categoryStats
        };
    }
    // Shuffle array (Fisher-Yates algorithm)
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    // Force rotation (for testing or manual control)
    forceRotation() {
        console.log('🔄 Forcing preset rotation...');
        this.performRotation();
    }
    // Get next rotation time
    getNextRotationTime() {
        const config = this.getRotationConfig();
        const now = new Date();
        const currentDay = now.getDay();
        const targetDay = this.getDayNumber(config.rotationDay);
        let daysUntilRotation = (targetDay - currentDay + 7) % 7;
        if (daysUntilRotation === 0 && now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) >= config.rotationTime) {
            daysUntilRotation = 7;
        }
        const nextRotation = new Date(now);
        nextRotation.setDate(now.getDate() + daysUntilRotation);
        nextRotation.setHours(parseInt(config.rotationTime.split(':')[0]), parseInt(config.rotationTime.split(':')[1]), 0, 0);
        return nextRotation;
    }
    // Convert day string to number
    getDayNumber(day) {
        const days = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6
        };
        return days[day.toLowerCase()] || 0;
    }
    // Clear all data (for testing or reset)
    clearAllData() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.USAGE_STORAGE_KEY);
        localStorage.removeItem('stefna_active_presets');
        localStorage.removeItem('stefna_last_rotation');
        console.log('🧹 Cleared all preset rotation data');
    }
}
// Export singleton instance
export const presetRotationService = new PresetRotationService();
export default presetRotationService;
