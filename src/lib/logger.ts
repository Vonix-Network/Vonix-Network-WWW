/**
 * Enterprise-grade logging utility with monitoring integration
 * Supports structured logging, metrics, and alerting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  traceId?: string;
  userId?: string;
  requestId?: string;
  performance?: {
    duration?: number;
    memory?: number;
    cpu?: number;
  };
}

interface MetricEntry {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

interface AlertConfig {
  level: LogLevel;
  pattern?: RegExp;
  threshold?: number;
  timeWindow?: number; // minutes
  webhook?: string;
}

class Logger {
  private minLevel: LogLevel;
  private alertConfigs: AlertConfig[] = [];
  private metrics: Map<string, MetricEntry[]> = new Map();

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    this.minLevel = envLevel || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    
    // Initialize default alert configurations
    this.setupDefaultAlerts();
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...(context && { context }),
        ...(error && { 
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        }),
      });
    } else {
      // Human-readable format for development
      let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      if (context) {
        output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
      }
      if (error) {
        output += `\n  Error: ${error.message}\n${error.stack}`;
      }
      return output;
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  // Convenience method for API errors
  apiError(endpoint: string, error: Error, context?: Record<string, any>) {
    this.error(`API Error: ${endpoint}`, error, { endpoint, ...context });
  }

  // Convenience method for database errors
  dbError(operation: string, error: Error, context?: Record<string, any>) {
    this.error(`Database Error: ${operation}`, error, { operation, ...context });
  }

  // Setup default alert configurations
  private setupDefaultAlerts() {
    this.alertConfigs = [
      {
        level: 'error',
        threshold: 10,
        timeWindow: 5, // 5 minutes
        webhook: process.env.ALERT_WEBHOOK_URL,
      },
      {
        level: 'warn',
        pattern: /Database/i,
        threshold: 20,
        timeWindow: 10,
      },
    ];
  }

  // Enhanced log method with performance metrics
  private enhancedLog(level: LogLevel, message: string, context?: Record<string, any>, error?: Error, traceId?: string) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      traceId,
      performance: this.getPerformanceMetrics(),
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  // Store log entry in memory (simplified without Redis)
  private storeLogEntry(entry: LogEntry) {
    // In a production environment, you might want to send logs to an external service
    // For now, we'll just use console logging
    if (process.env.NODE_ENV === 'development') {
      console.debug('Log entry stored:', entry);
    }
  }

  // Check if alerts should be triggered (simplified without Redis)
  private checkAlerts(entry: LogEntry) {
    for (const config of this.alertConfigs) {
      if (entry.level !== config.level) continue;
      if (config.pattern && !config.pattern.test(entry.message)) continue;
      
      // Simplified alerting - just log critical errors
      if (entry.level === 'error') {
        console.error('ALERT: Critical error detected:', entry.message);
        if (config.webhook) {
          this.triggerAlert(config, entry, 1);
        }
      }
    }
  }

  // Trigger alert (webhook, email, etc.)
  private async triggerAlert(config: AlertConfig, entry: LogEntry, count: number) {
    const alertData = {
      level: config.level,
      message: `Alert: ${config.level} error detected`,
      entry,
      timestamp: new Date().toISOString(),
    };

    if (config.webhook) {
      try {
        await fetch(config.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData),
        });
      } catch (error) {
        console.error('Failed to send alert webhook:', error);
      }
    }

    // Log alert locally
    console.warn('Alert triggered:', alertData);
  }

  // Get performance metrics
  private getPerformanceMetrics() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      return {
        memory: Math.round(memory.heapUsed / 1024 / 1024), // MB
        duration: Date.now(), // Will be calculated by caller if needed
      };
    }
    return undefined;
  }

  // Record custom metrics
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricEntry = {
      name,
      value,
      tags,
      timestamp: Date.now(),
    };

    // Store in memory for aggregation
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Keep only recent metrics in memory (last 1000)
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  // Get aggregated metrics
  getMetrics(name: string, timeRange: number = 24): MetricEntry[] {
    const metrics = this.metrics.get(name) || [];
    const cutoffTime = Date.now() - (timeRange * 60 * 60 * 1000); // timeRange in hours
    
    return metrics
      .filter(metric => metric.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Performance timing utility
  async time<T>(operation: string, fn: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    const start = Date.now();
    const traceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.debug(`Starting operation: ${operation}`, { ...context, traceId });
      const result = await fn();
      const duration = Date.now() - start;
      
      this.info(`Completed operation: ${operation}`, {
        ...context,
        traceId,
        duration: `${duration}ms`,
      });
      
      this.recordMetric(`operation.${operation}.duration`, duration, {
        status: 'success',
        ...context,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      this.error(`Failed operation: ${operation}`, error as Error, {
        ...context,
        traceId,
        duration: `${duration}ms`,
      });
      
      this.recordMetric(`operation.${operation}.duration`, duration, {
        status: 'error',
        ...context,
      });
      
      throw error;
    }
  }

  // Get system health metrics (simplified without Redis)
  getHealthMetrics() {
    const now = Date.now();
    
    // In a real implementation, you'd track these metrics over time
    // For now, we'll return basic health status
    return {
      errors: 0,
      warnings: 0,
      info: 0,
      timestamp: now,
      healthy: true,
      message: 'Health metrics simplified - no persistent storage',
    };
  }

  // Get log count for a specific level and time range (simplified)
  private getLogCount(level: LogLevel, startTime: number, endTime: number): number {
    // Without Redis, we can't persist log counts
    // In a real implementation, you'd use a proper logging service
    return 0;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export performance monitoring utilities
export const performance = {
  // Measure execution time
  measure: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return logger.time(name, fn);
  },
  
  // Record custom metric
  metric: (name: string, value: number, tags?: Record<string, string>) => {
    return logger.recordMetric(name, value, tags);
  },
  
  // Get health status
  health: () => {
    return logger.getHealthMetrics();
  },
};
