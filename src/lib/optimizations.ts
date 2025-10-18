// Performance optimizations for Vonix Network

import { db } from './db';
import { sql } from 'drizzle-orm';
// Cache removed - always fresh data

// Database query optimizations
export class QueryOptimizer {
  // Batch database operations
  static async batchInsert<T>(
    table: any,
    data: T[],
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchResults = await db.insert(table).values(batch).returning();
      results.push(...(batchResults as T[]));
    }
    
    return results;
  }

  // Optimize pagination queries
  static async getPaginatedResults<T>(
    query: any,
    page: number,
    limit: number,
    cacheKey?: string
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;
    
    const fetchData = async () => {
      // Execute query with limit and offset
      const data = await query.limit(limit).offset(offset);
      
      // Get total count (this could be optimized with a separate count query)
      const totalResult = await db.select({ count: sql`count(*)` }).from(query);
      const total = Number(totalResult[0]?.count || 0);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    };

    // Always fetch fresh data - no caching
    return fetchData();
  }

  // Connection warming for better performance
  static async warmConnection(): Promise<void> {
    try {
      await db.run(sql`SELECT 1`);
      console.log('✅ Database connection warmed');
    } catch (error) {
      console.error('❌ Failed to warm database connection:', error);
    }
  }

  // Analyze slow queries (development only)
  static async analyzeQuery(query: string): Promise<any> {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    try {
      const result = await db.run(sql`EXPLAIN QUERY PLAN ${sql.raw(query)}`);
      return result;
    } catch (error) {
      console.error('Query analysis failed:', error);
      return null;
    }
  }
}

// Memory optimization utilities
export class MemoryOptimizer {
  private static memoryUsage = new Map<string, number>();

  // Track memory usage
  static trackMemory(label: string): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      this.memoryUsage.set(label, usage.heapUsed);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Memory [${label}]: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
      }
    }
  }

  // Get memory statistics
  static getMemoryStats(): any {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024),
      };
    }
    return null;
  }

  // Force garbage collection (development only)
  static forceGC(): void {
    if (process.env.NODE_ENV === 'development' && global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection forced');
    }
  }
}

// Response optimization
export class ResponseOptimizer {
  // Compress large JSON responses
  static compressResponse(data: any): string {
    try {
      // Remove null/undefined values to reduce size
      const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
        return value === null || value === undefined ? undefined : value;
      }));
      
      return JSON.stringify(cleaned);
    } catch (error) {
      return JSON.stringify(data);
    }
  }

  // Add performance headers
  static addPerformanceHeaders(response: Response, startTime: number): Response {
    const duration = Date.now() - startTime;
    
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('X-Cache-Status', 'MISS'); // Default, override if cached
    
    return response;
  }

  // Paginate large datasets
  static paginateArray<T>(
    array: T[],
    page: number,
    limit: number
  ): {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const total = array.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = array.slice(offset, offset + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

// Image optimization utilities
export class ImageOptimizer {
  // Generate responsive image URLs
  static getResponsiveImageUrl(
    baseUrl: string,
    width: number,
    quality: number = 80
  ): string {
    if (!baseUrl) return '';
    
    // If using Next.js Image optimization
    const params = new URLSearchParams({
      url: baseUrl,
      w: width.toString(),
      q: quality.toString(),
    });
    
    return `/_next/image?${params.toString()}`;
  }

  // Get image dimensions for layout optimization
  static async getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
    try {
      // This would typically use a service or library to get image dimensions
      // For now, return null to indicate dimensions are unknown
      return null;
    } catch (error) {
      console.error('Failed to get image dimensions:', error);
      return null;
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  // Record performance metric
  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get performance statistics
  static getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index] || max;

    return { count, avg, min, max, p95 };
  }

  // Measure function execution time
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordMetric(`${name}.error`, duration);
      throw error;
    }
  }

  // Get all performance metrics
  static getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    
    return stats;
  }
}

// Initialize optimizations
export function initializeOptimizations(): void {
  console.log('🚀 Initializing performance optimizations...');
  
  // Warm database connection
  QueryOptimizer.warmConnection();
  
  // Track initial memory usage
  MemoryOptimizer.trackMemory('startup');
  
  // Set up periodic memory monitoring (every 5 minutes)
  if (typeof setInterval !== 'undefined') {
    setInterval(() => {
      MemoryOptimizer.trackMemory('periodic');
    }, 5 * 60 * 1000);
  }
  
  console.log('✅ Performance optimizations initialized');
}
