/**
 * Smart Caching Layer with LRU and TTL support
 * Production-ready caching with automatic invalidation
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
  };
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 300) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // 5 minutes default

    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max size using LRU
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiresAt = Date.now() + ((ttl || this.defaultTTL) * 1000);
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
    });

    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  /**
   * Delete keys matching pattern
   */
  deletePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.stats.deletes += count;
      this.stats.size = this.cache.size;
    }

    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.size = this.cache.size;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Cache cleanup: removed ${cleaned} expired entries`);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Get or set with function
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const data = await fn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Memoize an async function with caching
   */
  memoize<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    options: {
      keyGenerator?: (...args: TArgs) => string;
      ttl?: number;
    } = {}
  ): (...args: TArgs) => Promise<TReturn> {
    const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));
    
    return async (...args: TArgs): Promise<TReturn> => {
      const key = `memoized:${fn.name}:${keyGenerator(...args)}`;
      return this.getOrSet(key, () => fn(...args), options.ttl);
    };
  }
}

// Export singleton instance
export const cache = new SmartCache(5000, 300); // 5000 items, 5 min TTL

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  user: (id: number) => `user:${id}`,
  userProfile: (username: string) => `user:profile:${username}`,
  forumPost: (id: number) => `forum:post:${id}`,
  forumPosts: (categoryId?: number, page: number = 1) => 
    `forum:posts:${categoryId || 'all'}:${page}`,
  socialPost: (id: number) => `social:post:${id}`,
  socialPosts: (page: number = 1, sortBy: string = 'recent') => 
    `social:posts:${sortBy}:${page}`,
  leaderboard: (limit: number = 50) => `leaderboard:${limit}`,
  donorRanks: () => 'donor:ranks',
  servers: () => 'servers:all',
  server: (id: number) => `server:${id}`,
  settings: (key: string) => `settings:${key}`,
};

/**
 * Cache invalidation patterns
 */
export const CacheInvalidation = {
  invalidateUser: (id: number) => {
    cache.delete(CacheKeys.user(id));
  },
  invalidateForumPost: (id: number, categoryId?: number) => {
    cache.delete(CacheKeys.forumPost(id));
    if (categoryId) {
      cache.deletePattern(`forum:posts:${categoryId}:*`);
    }
    cache.deletePattern('forum:posts:all:*');
  },
  invalidateSocialPost: (id: number) => {
    cache.delete(CacheKeys.socialPost(id));
    cache.deletePattern('social:posts:*');
  },
  invalidateLeaderboard: () => {
    cache.deletePattern('leaderboard:*');
  },
  invalidateServers: () => {
    cache.deletePattern('server*');
  },
};

/**
 * Cached database query wrapper
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  return cache.getOrSet(key, queryFn, ttl);
}
