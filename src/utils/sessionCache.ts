// Session cache for composer uploads and user preferences
export class SessionCache {
  private static instance: SessionCache;
  private cache = new Map<string, any>();
  private readonly SESSION_PREFIX = 'stefna_session_';
  private readonly MAX_CACHE_SIZE = 50; // Prevent memory leaks

  private constructor() {
    this.loadFromSessionStorage();
  }

  static getInstance(): SessionCache {
    if (!SessionCache.instance) {
      SessionCache.instance = new SessionCache();
    }
    return SessionCache.instance;
  }

  // Generate a hash for file content to use as cache key
  static async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Cache file upload result
  async cacheFileUpload(file: File, result: { url: string; resource_type: string }): Promise<void> {
    const fileHash = await SessionCache.generateFileHash(file);
    const key = `${this.SESSION_PREFIX}upload_${fileHash}`;
    
    const cacheEntry = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    this.cache.set(key, cacheEntry);
    this.saveToSessionStorage();
    this.cleanupExpiredEntries();
    
    console.log('💾 Cached file upload:', { 
      fileName: file.name, 
      hash: fileHash.substring(0, 8) + '...',
      fileSize: this.formatFileSize(file.size),
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    });
  }

  // Get cached upload result for a file
  async getCachedUpload(file: File): Promise<{ url: string; resource_type: string } | null> {
    const fileHash = await SessionCache.generateFileHash(file);
    const key = `${this.SESSION_PREFIX}upload_${fileHash}`;
    
    const cached = this.cache.get(key);
    if (!cached) {
      console.log('💾 Cache miss for file:', { 
        fileName: file.name, 
        hash: fileHash.substring(0, 8) + '...',
        cacheSize: this.cache.size
      });
      return null;
    }
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.saveToSessionStorage();
      console.log('💾 Cache entry expired for file:', { 
        fileName: file.name, 
        hash: fileHash.substring(0, 8) + '...',
        age: this.formatTimeAgo(cached.timestamp)
      });
      return null;
    }
    
    console.log('💾 Using cached upload:', { 
      fileName: file.name, 
      hash: fileHash.substring(0, 8) + '...',
      age: this.formatTimeAgo(cached.timestamp),
      cacheHit: true
    });
    return cached.result;
  }

  // Cache user preferences
  setUserPreference(key: string, value: any): void {
    const prefKey = `${this.SESSION_PREFIX}pref_${key}`;
    this.cache.set(prefKey, {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });
    this.saveToSessionStorage();
  }

  // Get user preference
  getUserPreference(key: string): any | null {
    const prefKey = `${this.SESSION_PREFIX}pref_${key}`;
    const cached = this.cache.get(prefKey);
    
    if (!cached || Date.now() > cached.expiresAt) {
      if (cached) this.cache.delete(prefKey);
      return null;
    }
    
    return cached.value;
  }

  // Cache generation options
  setGenerationOptions(mode: string, options: any): void {
    const key = `${this.SESSION_PREFIX}gen_${mode}`;
    this.cache.set(key, {
      options,
      timestamp: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
    });
    this.saveToSessionStorage();
  }

  // Get generation options
  getGenerationOptions(mode: string): any | null {
    const key = `${this.SESSION_PREFIX}gen_${mode}`;
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
      
      toDelete.forEach(([key]) => this.cache.delete(key));
      
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
}
