#!/usr/bin/env tsx

/**
 * Production Setup Script for Vonix Network
 * 
 * This script sets up the application for production deployment
 * including database migrations, environment validation, and health checks
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface SetupOptions {
  skipMigrations?: boolean;
  skipValidation?: boolean;
  skipHealthCheck?: boolean;
  verbose?: boolean;
}

class ProductionSetup {
  private options: SetupOptions;
  private errors: string[] = [];

  constructor(options: SetupOptions = {}) {
    this.options = {
      skipMigrations: false,
      skipValidation: false,
      skipHealthCheck: false,
      verbose: false,
      ...options
    };
  }

  private log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  private exec(command: string, description: string): boolean {
    try {
      this.log(`Running: ${description}`, 'info');
      if (this.options.verbose) {
        console.log(`Command: ${command}`);
      }
      
      execSync(command, { 
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        cwd: process.cwd()
      });
      
      this.log(`Completed: ${description}`, 'success');
      return true;
    } catch (error) {
      this.log(`Failed: ${description}`, 'error');
      if (this.options.verbose) {
        console.error(error);
      }
      this.errors.push(`${description}: ${error}`);
      return false;
    }
  }

  private validateEnvironment(): boolean {
    this.log('Validating environment variables...', 'info');
    
    const requiredVars = [
      'TURSO_DATABASE_URL',
      'TURSO_AUTH_TOKEN',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    const missingVars: string[] = [];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      this.log(`Missing required environment variables: ${missingVars.join(', ')}`, 'error');
      this.errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
      return false;
    }

    this.log('Environment validation passed', 'success');
    return true;
  }

  private validateDatabaseConnection(): boolean {
    this.log('Validating database connection...', 'info');
    
    try {
      // Test database connection
      const { createClient } = require('@libsql/client');
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!
      });

      // Simple query to test connection
      const result = execSync('node -e "const { createClient } = require(\'@libsql/client\'); const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }); client.execute(\'SELECT 1\').then(() => console.log(\'Database connection successful\')).catch(console.error);"', { 
        encoding: 'utf8',
        env: process.env 
      });

      if (result.includes('Database connection successful')) {
        this.log('Database connection validated', 'success');
        return true;
      } else {
        throw new Error('Database connection test failed');
      }
    } catch (error) {
      this.log('Database connection validation failed', 'error');
      this.errors.push(`Database connection failed: ${error}`);
      return false;
    }
  }

  private runMigrations(): boolean {
    if (this.options.skipMigrations) {
      this.log('Skipping database migrations', 'warning');
      return true;
    }

    this.log('Running database migrations...', 'info');
    
    const migrationSteps = [
      { command: 'npm run db:push', description: 'Push database schema' },
      { command: 'npm run db:migrate-all', description: 'Run all migrations' },
      { command: 'npm run db:add-indexes', description: 'Add database indexes' }
    ];

    let allSuccess = true;
    for (const step of migrationSteps) {
      if (!this.exec(step.command, step.description)) {
        allSuccess = false;
        break;
      }
    }

    if (allSuccess) {
      this.log('Database migrations completed successfully', 'success');
    } else {
      this.log('Database migrations failed', 'error');
    }

    return allSuccess;
  }

  private buildApplication(): boolean {
    this.log('Building application for production...', 'info');
    
    const buildSteps = [
      { command: 'npm ci --production=false', description: 'Install dependencies' },
      { command: 'npm run lint', description: 'Run linting' },
      { command: 'npm run type-check', description: 'Run type checking' },
      { command: 'npm run build', description: 'Build application' }
    ];

    let allSuccess = true;
    for (const step of buildSteps) {
      if (!this.exec(step.command, step.description)) {
        allSuccess = false;
        break;
      }
    }

    if (allSuccess) {
      this.log('Application build completed successfully', 'success');
    } else {
      this.log('Application build failed', 'error');
    }

    return allSuccess;
  }

  private async runHealthCheck(): Promise<boolean> {
    if (this.options.skipHealthCheck) {
      this.log('Skipping health check', 'warning');
      return true;
    }

    this.log('Running health check...', 'info');
    
    try {
      // Start the application in background
      const { spawn } = require('child_process');
      const app = spawn('npm', ['start'], { 
        detached: true, 
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'production' }
      });

      // Wait for application to start
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Run health check
      const healthCheck = execSync('curl -f http://localhost:3000/api/health', { 
        encoding: 'utf8',
        timeout: 5000 
      });

      if (healthCheck.includes('"status":"healthy"')) {
        this.log('Health check passed', 'success');
        
        // Kill the background process
        process.kill(-app.pid);
        return true;
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      this.log('Health check failed', 'error');
      this.errors.push(`Health check failed: ${error}`);
      return false;
    }
  }

  private generateReport(): void {
    this.log('Generating setup report...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      success: this.errors.length === 0,
      errors: this.errors,
      steps: [
        'Environment validation',
        'Database connection validation',
        'Database migrations',
        'Application build',
        'Health check'
      ]
    };

    const reportPath = join(process.cwd(), 'setup-report.json');
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Setup report saved to: ${reportPath}`, 'info');
  }

  public async run(): Promise<boolean> {
    this.log('Starting Vonix Network production setup...', 'info');
    this.log(`Version: 2.0.0`, 'info');
    this.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'info');

    const steps = [
      { name: 'Environment validation', fn: () => this.validateEnvironment() },
      { name: 'Database connection validation', fn: () => this.validateDatabaseConnection() },
      { name: 'Database migrations', fn: () => this.runMigrations() },
      { name: 'Application build', fn: () => this.buildApplication() },
      { name: 'Health check', fn: async () => await this.runHealthCheck() }
    ];

    let allSuccess = true;
    for (const step of steps) {
      const result = step.fn();
      const success = result instanceof Promise ? await result : result;
      if (!success) {
        allSuccess = false;
        if (!this.options.verbose) {
          this.log(`Setup failed at step: ${step.name}`, 'error');
          break;
        }
      }
    }

    this.generateReport();

    if (allSuccess) {
      this.log('🎉 Production setup completed successfully!', 'success');
      this.log('Your Vonix Network application is ready for production.', 'success');
    } else {
      this.log('❌ Production setup failed. Please check the errors above.', 'error');
      this.log(`Total errors: ${this.errors.length}`, 'error');
    }

    return allSuccess;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: SetupOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-migrations':
        options.skipMigrations = true;
        break;
      case '--skip-validation':
        options.skipValidation = true;
        break;
      case '--skip-health-check':
        options.skipHealthCheck = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Vonix Network Production Setup Script

Usage: npm run setup:production [options]

Options:
  --skip-migrations     Skip database migrations
  --skip-validation     Skip environment validation
  --skip-health-check   Skip health check
  --verbose, -v         Enable verbose output
  --help, -h            Show this help message

Examples:
  npm run setup:production
  npm run setup:production -- --verbose
  npm run setup:production -- --skip-migrations
        `);
        process.exit(0);
        break;
    }
  }

  const setup = new ProductionSetup(options);
  const success = await setup.run();
  
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup script failed:', error);
    process.exit(1);
  });
}

export { ProductionSetup };
