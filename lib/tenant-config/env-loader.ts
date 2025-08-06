import DomainTenantService, { TenantEnvConfig } from './domain-tenant-service';
import fs from 'fs/promises';
import path from 'path';

export interface EnvLoaderOptions {
  enableCaching?: boolean;
  cacheTimeout?: number; // in milliseconds
  defaultEnvFile?: string;
}

export interface LoadedEnvironment {
  config: TenantEnvConfig;
  source: string;
  loadedAt: Date;
  domain: string;
  tenantId: string;
}

/**
 * Dynamic environment loader for multi-tenant applications
 * Loads tenant-specific .env files based on domain
 */
export class TenantEnvLoader {
  private static cache = new Map<string, LoadedEnvironment>();
  private static options: EnvLoaderOptions = {
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    defaultEnvFile: '.env'
  };

  /**
   * Configure the environment loader
   */
  static configure(options: Partial<EnvLoaderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Load environment for a specific domain
   */
  static async loadEnvironmentForDomain(domain: string): Promise<LoadedEnvironment | null> {
    const cacheKey = domain;

    // Check cache first
    if (this.options.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const now = new Date();
      const cacheAge = now.getTime() - cached.loadedAt.getTime();
      
      if (cacheAge < (this.options.cacheTimeout || 0)) {
        return cached;
      } else {
        // Cache expired, remove it
        this.cache.delete(cacheKey);
      }
    }

    try {
      // Identify tenant from domain
      const mapping = await DomainTenantService.identifyTenantFromDomain(domain);
      
      if (!mapping) {
        console.warn(`No tenant mapping found for domain: ${domain}`);
        return await this.loadDefaultEnvironment(domain);
      }

      // Load tenant-specific environment
      const envConfig = await DomainTenantService.loadTenantEnv(mapping.envFile);
      
      if (!envConfig) {
        console.warn(`Failed to load environment file: ${mapping.envFile}`);
        return await this.loadDefaultEnvironment(domain);
      }

      // Validate environment configuration
      const validation = DomainTenantService.validateTenantEnv(envConfig);
      if (!validation.isValid) {
        console.error(`Invalid environment configuration for ${domain}:`, validation.missingFields);
        throw new Error(`Missing required environment variables: ${validation.missingFields.join(', ')}`);
      }

      const tenantId = envConfig.TENANT_ID || this.extractTenantIdFromDomain(domain);

      const loadedEnv: LoadedEnvironment = {
        config: envConfig,
        source: mapping.envFile,
        loadedAt: new Date(),
        domain,
        tenantId
      };

      // Cache the result
      if (this.options.enableCaching) {
        this.cache.set(cacheKey, loadedEnv);
      }

      return loadedEnv;
    } catch (error) {
      console.error(`Failed to load environment for domain ${domain}:`, error);
      return await this.loadDefaultEnvironment(domain);
    }
  }

  /**
   * Load default environment as fallback
   */
  private static async loadDefaultEnvironment(domain: string): Promise<LoadedEnvironment | null> {
    if (!this.options.defaultEnvFile) {
      return null;
    }

    try {
      const defaultPath = path.join(process.cwd(), this.options.defaultEnvFile);
      
      // Check if default env file exists
      try {
        await fs.access(defaultPath);
      } catch {
        console.warn(`Default environment file not found: ${this.options.defaultEnvFile}`);
        return null;
      }

      const envContent = await fs.readFile(defaultPath, 'utf-8');
      const envConfig: TenantEnvConfig = {} as TenantEnvConfig;

      // Parse .env file
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            let value = trimmedLine.substring(equalIndex + 1).trim();
            
            // Remove surrounding quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            
            envConfig[key] = value;
          }
        }
      }

      const tenantId = envConfig.TENANT_ID || this.extractTenantIdFromDomain(domain) || 'default';

      return {
        config: envConfig,
        source: this.options.defaultEnvFile,
        loadedAt: new Date(),
        domain,
        tenantId
      };
    } catch (error) {
      console.error(`Failed to load default environment:`, error);
      return null;
    }
  }

  /**
   * Apply environment configuration to process.env
   */
  static applyEnvironment(loadedEnv: LoadedEnvironment): void {
    const { config } = loadedEnv;

    // Apply all environment variables from the loaded config
    Object.entries(config).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Set additional tenant context variables
    process.env.CURRENT_TENANT_ID = loadedEnv.tenantId;
    process.env.CURRENT_TENANT_DOMAIN = loadedEnv.domain;
    process.env.CURRENT_TENANT_ENV_SOURCE = loadedEnv.source;
    process.env.CURRENT_TENANT_LOADED_AT = loadedEnv.loadedAt.toISOString();

    console.log(`✅ Applied environment for tenant: ${loadedEnv.tenantId} (${loadedEnv.domain})`);
  }

  /**
   * Load and apply environment for domain in one step
   */
  static async loadAndApplyForDomain(domain: string): Promise<LoadedEnvironment | null> {
    const loadedEnv = await this.loadEnvironmentForDomain(domain);
    
    if (loadedEnv) {
      this.applyEnvironment(loadedEnv);
      return loadedEnv;
    }
    
    return null;
  }

  /**
   * Extract tenant ID from domain
   */
  private static extractTenantIdFromDomain(domain: string): string {
    const parts = domain.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      // Remove 'admin' suffix if present
      return subdomain.replace(/admin$/, '');
    }
    return domain.replace(/\./g, '');
  }

  /**
   * Clear environment cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific domain
   */
  static clearCacheForDomain(domain: string): void {
    this.cache.delete(domain);
  }

  /**
   * Get cached environments
   */
  static getCachedEnvironments(): Map<string, LoadedEnvironment> {
    return new Map(this.cache);
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    domains: string[];
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const entries = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      domains: Array.from(this.cache.keys()),
      oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(e => e.loadedAt.getTime()))) : undefined,
      newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(e => e.loadedAt.getTime()))) : undefined
    };
  }

  /**
   * Validate if current environment is properly loaded for a tenant
   */
  static validateCurrentEnvironment(expectedDomain: string): {
    isValid: boolean;
    currentDomain?: string;
    currentTenantId?: string;
    missingVars: string[];
  } {
    const currentDomain = process.env.CURRENT_TENANT_DOMAIN;
    const currentTenantId = process.env.CURRENT_TENANT_ID;
    
    const requiredVars = [
      'DATABASE_URL',
      'TENANT_ID',
      'JWT_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    return {
      isValid: currentDomain === expectedDomain && missingVars.length === 0,
      currentDomain,
      currentTenantId,
      missingVars
    };
  }

  /**
   * Reload environment for current domain
   */
  static async reloadCurrentEnvironment(): Promise<LoadedEnvironment | null> {
    const currentDomain = process.env.CURRENT_TENANT_DOMAIN;
    
    if (!currentDomain) {
      console.warn('No current domain found in environment');
      return null;
    }

    // Clear cache for current domain
    this.clearCacheForDomain(currentDomain);
    
    // Reload environment
    return await this.loadAndApplyForDomain(currentDomain);
  }

  /**
   * Create environment backup
   */
  static createEnvironmentBackup(): Record<string, string | undefined> {
    const backup: Record<string, string | undefined> = {};
    
    // Backup important environment variables
    const importantVars = [
      'DATABASE_URL',
      'TENANT_ID',
      'TENANT_NAME',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'SESSION_SECRET',
      'CURRENT_TENANT_ID',
      'CURRENT_TENANT_DOMAIN',
      'CURRENT_TENANT_ENV_SOURCE'
    ];

    importantVars.forEach(varName => {
      backup[varName] = process.env[varName];
    });

    return backup;
  }

  /**
   * Restore environment from backup
   */
  static restoreEnvironmentFromBackup(backup: Record<string, string | undefined>): void {
    Object.entries(backup).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    });
  }

  /**
   * Get environment summary for debugging
   */
  static getEnvironmentSummary(): {
    currentDomain?: string;
    currentTenantId?: string;
    envSource?: string;
    loadedAt?: string;
    databaseUrl?: string;
    hasJwtSecret: boolean;
    cacheSize: number;
  } {
    return {
      currentDomain: process.env.CURRENT_TENANT_DOMAIN,
      currentTenantId: process.env.CURRENT_TENANT_ID,
      envSource: process.env.CURRENT_TENANT_ENV_SOURCE,
      loadedAt: process.env.CURRENT_TENANT_LOADED_AT,
      databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : undefined,
      hasJwtSecret: !!process.env.JWT_SECRET,
      cacheSize: this.cache.size
    };
  }
}

export default TenantEnvLoader;
