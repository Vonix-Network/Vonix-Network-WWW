// Performance monitoring utilities for Vonix Network
// This helps track page load times and API performance

import React from 'react';

interface PerformanceMetrics {
  pageName: string;
  loadTime: number;
  domComplete: number;
  domInteractive: number;
  responseStart: number;
  tti: number; // Time to Interactive
  timestamp: number;
}

interface ApiMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  cached: boolean;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private apiMetrics: ApiMetrics[] = [];
  private maxMetrics = 1000;

  // Track page load performance
  trackPageLoad(pageName: string) {
    if (typeof window === 'undefined' || !window.performance) return;

    const navEntries = window.performance.getEntriesByType('navigation');
    if (navEntries.length === 0) return;

    const navEntry = navEntries[0] as PerformanceNavigationTiming;
    const metrics: PerformanceMetrics = {
      pageName,
      loadTime: navEntry.loadEventEnd - navEntry.fetchStart,
      domComplete: navEntry.domComplete,
      domInteractive: navEntry.domInteractive,
      responseStart: navEntry.responseStart,
      tti: navEntry.domInteractive - navEntry.responseStart,
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${pageName}] Performance metrics:`, {
        'Total Load Time': `${metrics.loadTime}ms`,
        'DOM Interactive': `${metrics.domInteractive}ms`,
        'DOM Complete': `${metrics.domComplete}ms`,
        'Time to Interactive': `${metrics.tti}ms`,
      });
    }

    // Send to analytics service if available
    this.sendToAnalytics(metrics);
  }

  // Track API call performance
  trackApiCall(endpoint: string, method: string, duration: number, status: number, cached = false) {
    const metrics: ApiMetrics = {
      endpoint,
      method,
      duration,
      status,
      cached,
      timestamp: Date.now(),
    };

    this.apiMetrics.push(metrics);

    // Keep only recent metrics
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics);
    }

    // Log slow API calls
    if (duration > 1000) {
      console.warn(`Slow API call: ${method} ${endpoint} took ${duration}ms`);
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    if (this.metrics.length === 0) return null;

    const recent = this.metrics.slice(-100); // Last 100 page loads

    return {
      totalPages: recent.length,
      averageLoadTime: recent.reduce((sum, m) => sum + m.loadTime, 0) / recent.length,
      averageTTI: recent.reduce((sum, m) => sum + m.tti, 0) / recent.length,
      slowestPage: recent.reduce((max, m) => m.loadTime > max.loadTime ? m : max, recent[0]),
      fastestPage: recent.reduce((min, m) => m.loadTime < min.loadTime ? m : min, recent[0]),
    };
  }

  // Get API performance summary
  getApiPerformanceSummary() {
    if (this.apiMetrics.length === 0) return null;

    const recent = this.apiMetrics.slice(-100); // Last 100 API calls

    return {
      totalCalls: recent.length,
      averageDuration: recent.reduce((sum, m) => sum + m.duration, 0) / recent.length,
      slowestCall: recent.reduce((max, m) => m.duration > max.duration ? m : max, recent[0]),
      fastestCall: recent.reduce((min, m) => m.duration < min.duration ? m : min, recent[0]),
      cacheHitRate: recent.filter(m => m.cached).length / recent.length,
    };
  }

  // Send metrics to analytics service (placeholder)
  private sendToAnalytics(metrics: PerformanceMetrics) {
    // This would typically send to services like Google Analytics,
    // Sentry Performance, or custom analytics endpoints
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_load_time', {
        page_name: metrics.pageName,
        load_time: metrics.loadTime,
        tti: metrics.tti,
      });
    }
  }

  // Export metrics for debugging
  exportMetrics() {
    return {
      pageMetrics: this.metrics.slice(-50), // Last 50 for readability
      apiMetrics: this.apiMetrics.slice(-50),
      summary: {
        pagePerformance: this.getPerformanceSummary(),
        apiPerformance: this.getApiPerformanceSummary(),
      },
    };
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for tracking component performance
export function usePerformanceTracking(componentName: string) {
  React.useEffect(() => {
    // Track component mount time
    const startTime = performance.now();

    return () => {
      const mountTime = performance.now() - startTime;
      if (mountTime > 100) { // Only log slow mounts
        console.warn(`Slow component mount: ${componentName} took ${mountTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

// Utility for measuring async operations
export async function measureAsync<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    if (duration > 100) {
      console.warn(`Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`Operation failed: ${operationName} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

// Database query performance tracking
export function trackDbQuery<T>(
  query: () => Promise<T>,
  queryName: string
): Promise<T> {
  return measureAsync(query, `DB Query: ${queryName}`);
}

// API call performance tracking
export function trackApiCall<T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  method: string = 'GET'
): Promise<T> {
  return measureAsync(apiCall, `API Call: ${method} ${endpoint}`);
}
