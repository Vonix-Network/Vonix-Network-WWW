// Database connection warming and performance utilities
import { db } from './db';
import { users, forumCategories, socialPosts, forumPosts, servers } from '../db/schema';
import { sql } from 'drizzle-orm';

// Warm up database connections on module load
let connectionWarmed = false;
let warmupPromise: Promise<void> | null = null;

export async function warmDatabaseConnections() {
  // Return existing promise if warmup is already running
  if (warmupPromise) {
    return warmupPromise;
  }

  // Return immediately if already warmed
  if (connectionWarmed) {
    return;
  }

  // Create and cache the warmup promise
  warmupPromise = performWarmup();
  return warmupPromise;
}

async function performWarmup() {
  try {
    console.log('Warming up database connections...');

    // Execute lightweight queries to warm up connections
    await Promise.all([
      // Warm up users table
      db.select({ count: sql<number>`count(*)` }).from(users).limit(1),

      // Warm up forum categories
      db.select({ count: sql<number>`count(*)` }).from(forumCategories).limit(1),

      // Warm up social posts
      db.select({ count: sql<number>`count(*)` }).from(socialPosts).limit(1),

      // Warm up forum posts
      db.select({ count: sql<number>`count(*)` }).from(forumPosts).limit(1),

      // Warm up servers
      db.select({ count: sql<number>`count(*)` }).from(servers).limit(1),
    ]);

    connectionWarmed = true;
    console.log('Database connections warmed up successfully');
  } catch (error) {
    console.error('Failed to warm up database connections:', error);
    connectionWarmed = true; // Mark as completed even on error to prevent retries
  }
}

// Optimized fetch wrapper for external APIs (NO CACHING for real-time data)
export async function optimizedFetch(url: string, options: RequestInit = {}) {
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      ...options,
      // Add timeout for external APIs
      signal: AbortSignal.timeout(10000), // 10 second timeout
      // NO CACHE - we want fresh data every time
      cache: 'no-store',
      headers: {
        ...options.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    const duration = performance.now() - startTime;

    // Log slow external API calls
    if (duration > 2000) {
      console.warn(`Slow external API call: ${url} took ${duration.toFixed(2)}ms`);
    }

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`External API call failed: ${url} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

// NO CACHING for external APIs - always fetch fresh data
export async function cachedExternalFetch(url: string, options: RequestInit = {}) {
  // Always fetch fresh data - no caching for real-time external APIs
  try {
    const response = await optimizedFetch(url, options);

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }
}
