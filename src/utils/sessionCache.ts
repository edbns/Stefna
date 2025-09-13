// Session cache for composer uploads and user preferences
export class SessionCache {
  private static instance: SessionCache;
  private cache = new Map<string, any>();
  private readonly SESSION_PREFIX = 'stefna_session_';
  private readonly MAX_CACHE_SIZE = 50; // Prevent memory leaks
  private isInitialized = false;
  private onEvict?: (key: string, value: any) => void;

  private constructor() {
    // Don't auto-load in constructor - use async init instead
  }

  static getInstance(): SessionCache {
    if (!SessionCache.instance) {
      SessionCache.instance = new SessionCache();
    }
    return SessionCache.instance;
  }

  // Async initialization method
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.loadFromSessionStorage();
      this.isInitialized = true;
      console.log('💾 Session cache initialized successfully');
    } catch (error) {
      console.warn('⚠️ Session cache initialization failed, using empty cache:', error);
      this.isInitialized = true; // Mark as initialized to prevent infinite retries
    }
  }

  // Set eviction callback for monitoring
  setEvictionCallback(callback: (key: string, value: any) => void): void {
    this.onEvict = callback;
  }

  // Generate a hash for file content to use as cache key
  static async generateFileHash(file: File | string): Promise<string> {
    // Optimize for data URIs and short content
    if (typeof file === 'string') {
      if (file.startsWith('data:')) {
        // For data URIs, use a shorter hash since content is already in string
        const encoder = new TextEncoder();
        const data = encoder.encode(file);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16); // Shorter hash for data URIs
      }
      if (file.startsWith('blob:')) {
        // For blob URLs, we need to fetch and hash the actual content
        const resp = await fetch(file);
        const blob = await resp.blob();
        return this.generateFileHashFromBlob(blob);
      }
      // For regular URLs, hash the URL string
      const encoder = new TextEncoder();
      const data = encoder.encode(file);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // For File objects, use the optimized blob hashing
    return this.generateFileHashFromBlob(file);
  }

  // Optimized blob hashing
  private static async generateFileHashFromBlob(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Cache file upload result with optional namespace
  async cacheFileUpload(
    file: File | string, 
    result: { url: string; resource_type: string },
    namespace?: string
  ): Promise<void> {
    const fileHash = await SessionCache.generateFileHash(file);
    const key = `${this.SESSION_PREFIX}upload_${namespace ? namespace + '_' : ''}${fileHash}`;
    
    const cacheEntry = {
      fileName: typeof file === 'string' ? 'data_uri' : file.name,
      fileSize: typeof file === 'string' ? file.length : file.size,
      fileType: typeof file === 'string' ? 'text/uri-list' : file.type,
      result,
      namespace,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    this.cache.set(key, cacheEntry);
    this.saveToSessionStorage();
    this.cleanupExpiredEntries();
    
    console.log('💾 Cached file upload:', { 
      fileName: cacheEntry.fileName, 
      hash: fileHash.substring(0, 8) + '...',
      fileSize: this.formatFileSize(cacheEntry.fileSize),
      namespace: namespace || 'default',
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    });
  }

  // Get cached upload result for a file with optional namespace
  async getCachedUpload(
    file: File | string,
    namespace?: string
  ): Promise<{ url: string; resource_type: string } | null> {
    const fileHash = await SessionCache.generateFileHash(file);
    const key = `${this.SESSION_PREFIX}upload_${namespace ? namespace + '_' : ''}${fileHash}`;
    
    const cached = this.cache.get(key);
    if (!cached) {
      console.log('💾 Cache miss for file:', { 
        fileName: typeof file === 'string' ? 'data_uri' : file.name, 
        hash: fileHash.substring(0, 8) + '...',
        namespace: namespace || 'default',
        cacheSize: this.cache.size
      });
      return null;
    }
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.saveToSessionStorage();
      console.log('💾 Cache entry expired for file:', { 
        fileName: cached.fileName, 
        hash: fileHash.substring(0, 8) + '...',
        namespace: cached.namespace || 'default',
        age: this.formatTimeAgo(cached.timestamp)
      });
      return null;
    }
    
    console.log('💾 Using cached upload:', { 
      fileName: cached.fileName, 
      hash: fileHash.substring(0, 8) + '...',
      namespace: cached.namespace || 'default',
      age: this.formatTimeAgo(cached.timestamp),
      cacheHit: true
    });
    return cached.result;
  }

  // Cache user preferences with optional namespace
  setUserPreference(key: string, value: any, namespace?: string): void {
    const prefKey = `${this.SESSION_PREFIX}pref_${namespace ? namespace + '_' : ''}${key}`;
    this.cache.set(prefKey, {
      value,
      namespace,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });
    this.saveToSessionStorage();
  }

  // Get user preference with optional namespace
  getUserPreference(key: string, namespace?: string): any | null {
    const prefKey = `${this.SESSION_PREFIX}pref_${namespace ? namespace + '_' : ''}${key}`;
    const cached = this.cache.get(prefKey);
    
    if (!cached || Date.now() > cached.expiresAt) {
      if (cached) this.cache.delete(prefKey);
      return null;
    }
    
    return cached.value;
  }

  // Cache generation options with namespace support
  setGenerationOptions(mode: string, options: any, namespace?: string): void {
    const key = `${this.SESSION_PREFIX}gen_${namespace ? namespace + '_' : ''}${mode}`;
    this.cache.set(key, {
      options,
      namespace,
      timestamp: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
    });
    this.saveToSessionStorage();
  }

  // Get generation options with namespace support
  getGenerationOptions(mode: string, namespace?: string): any | null {
    const key = `${this.SESSION_PREFIX}gen_${namespace ? namespace + '_' : ''}${mode}`;
    const cached = this.cache.get(key);
    
    if (!cached || Date.now() > cached.expiresAt) {
      if (cached) this.cache.delete(key);
      return null;
    }
    
    return cached.options;
  }



  // Save to session storage
  private saveToSessionStorage(): void {
    try {
      const data = Object.fromEntries(this.cache);
      sessionStorage.setItem('stefna_cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to session storage:', error);
    }
  }

  // Load from session storage
  private loadFromSessionStorage(): void {
    try {
      const cached = sessionStorage.getItem('stefna_cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.cache = new Map(Object.entries(data));
        this.cleanupExpiredEntries();
      }
    } catch (error) {
      console.warn('Failed to load cache from session storage:', error);
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    try {
      sessionStorage.removeItem('stefna_cache');
    } catch (error) {
      console.warn('Failed to clear session storage cache:', error);
    }
  }

  // Get cache stats
  getStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).length,
    };
  }

  // Debug method to show detailed cache information
  debug(): void {
    const stats = this.getStats();
    const now = Date.now();
    
    console.group('🔍 Session Cache Debug Info');
    console.log('📊 Cache Statistics:', stats);
    console.log('⏰ Current Time:', new Date(now).toISOString());
    
    if (this.cache.size === 0) {
      console.log('📭 Cache is empty');
    } else {
      console.log('📋 Cache Contents:');
      for (const [key, entry] of this.cache.entries()) {
        const age = this.formatTimeAgo(entry.timestamp);
        const expiresIn = this.formatTimeAgo(entry.expiresAt);
        const isExpired = now > entry.expiresAt;
        
        console.log(`  ${key}:`, {
          fileName: entry.fileName || 'N/A',
          fileSize: entry.fileSize ? this.formatFileSize(entry.fileSize) : 'N/A',
          namespace: entry.namespace || 'default',
          age,
          expiresIn: isExpired ? 'EXPIRED' : expiresIn,
          type: key.includes('upload_') ? 'upload' : key.includes('pref_') ? 'preference' : key.includes('gen_') ? 'generation' : 'other'
        });
      }
    }
    
    console.groupEnd();
  }

  // Clear expired entries and return count
  cleanupExpiredEntries(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt && now > value.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
        if (this.onEvict) {
          this.onEvict(key, value);
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
      this.saveToSessionStorage();
    }
    
    // Limit cache size
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));
      
      const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      const deletedCount = toDelete.length;
      
      toDelete.forEach(([key]) => {
        this.cache.delete(key);
        if (this.onEvict) {
          this.onEvict(key, this.cache.get(key)); // Pass the next entry in the map
        }
      });
      
      console.log(`🧹 Cache size limit exceeded, removed ${deletedCount} oldest entries`);
      this.saveToSessionStorage();
    }
    
    return cleanedCount;
  }

  // Helper method to format file size
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to format time ago
  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }
}

// Export singleton instance
export const sessionCache = SessionCache.getInstance();

/*
🎯 Enhanced Session Cache Usage Examples:

// 1. Basic file upload caching
await sessionCache.cacheFileUpload(file, result);
const cached = await sessionCache.getCachedUpload(file);

// 2. Namespaced caching for different modules
await sessionCache.cacheFileUpload(file, result, 'unreal_reflection');
await sessionCache.cacheFileUpload(file, result, 'neotokyo_glitch');
const cached = await sessionCache.getCachedUpload(file, 'unreal_reflection');

// 3. User preferences with namespaces
sessionCache.setUserPreference('theme', 'dark', 'ui');
sessionCache.setUserPreference('quality', 'high', 'generation');
const theme = sessionCache.getUserPreference('theme', 'ui');

// 4. Generation options with namespaces
sessionCache.setGenerationOptions('unreal_reflection', options, 'fx');
sessionCache.setGenerationOptions('neotokyo_glitch', options, 'fx');
const options = sessionCache.getGenerationOptions('unreal_reflection', 'fx');

// 5. Eviction monitoring
sessionCache.setEvictionCallback((key, value) => {
  console.log(`🗑️ Cache entry evicted: ${key}`, value);
});

// 6. Console debugging
window.debugSessionCache()           // Show detailed cache info
window.clearSessionCache()           // Clear all cache
window.getSessionCacheStats()        // Get cache statistics
window.initSessionCache()            // Manual initialization
window.setSessionCacheEvictionCallback(callback) // Set eviction callback
*/

// Add global debug function for easy console access
if (typeof window !== 'undefined') {
  (window as any).debugSessionCache = () => {
    sessionCache.debug();
  };
  
  (window as any).clearSessionCache = () => {
    sessionCache.clear();
    console.log('🧹 Session cache cleared');
  };
  
  (window as any).getSessionCacheStats = () => {
    return sessionCache.getStats();
  };

  (window as any).initSessionCache = async () => {
    await sessionCache.init();
    console.log('💾 Session cache initialized via console command');
  };

  (window as any).setSessionCacheEvictionCallback = (callback: (key: string, value: any) => void) => {
    sessionCache.setEvictionCallback(callback);
    console.log('🔔 Eviction callback set for session cache');
  };

  // Auto-initialize when page loads
  window.addEventListener('load', () => {
    sessionCache.init().catch(console.warn);
  });
}
