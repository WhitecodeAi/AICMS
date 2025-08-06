import { TenantConfig } from '../types/tenant';
import fs from 'fs/promises';
import path from 'path';

export class TenantConfigService {
  private configCache: Map<string, TenantConfig> = new Map();
  private configPath: string;
  private cacheTTL: number;
  private lastReload: number = 0;

  constructor(configPath: string = './config/tenants', cacheTTL: number = 300000) {
    this.configPath = configPath;
    this.cacheTTL = cacheTTL; // 5 minutes default
  }

  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    // Check cache first
    if (this.shouldReloadCache()) {
      await this.reloadAllConfigs();
    }

    const cached = this.configCache.get(tenantId);
    if (cached) {
      return cached;
    }

    // Try to load individual config file
    try {
      const config = await this.loadTenantConfigFile(tenantId);
      this.configCache.set(tenantId, config);
      return config;
    } catch (error) {
      console.error(`Failed to load config for tenant ${tenantId}:`, error);
      return null;
    }
  }

  private async loadTenantConfigFile(tenantId: string): Promise<TenantConfig> {
    const configFilePath = path.join(this.configPath, `${tenantId}.json`);
    
    try {
      const configContent = await fs.readFile(configFilePath, 'utf-8');
      const config = JSON.parse(configContent) as TenantConfig;
      
      // Validate required fields
      this.validateTenantConfig(config, tenantId);
      
      return config;
    } catch (error) {
      // Try environment variables as fallback
      return this.loadFromEnvironment(tenantId);
    }
  }

  private loadFromEnvironment(tenantId: string): TenantConfig {
    const prefix = `TENANT_${tenantId.toUpperCase()}_`;
    
    const config: TenantConfig = {
      tenantId,
      subdomain: process.env[`${prefix}SUBDOMAIN`] || tenantId,
      database: {
        host: process.env[`${prefix}DB_HOST`] || 'localhost',
        port: parseInt(process.env[`${prefix}DB_PORT`] || '3306'),
        database: process.env[`${prefix}DB_NAME`] || `${tenantId}_db`,
        user: process.env[`${prefix}DB_USER`] || 'root',
        password: process.env[`${prefix}DB_PASSWORD`] || '',
        ssl: process.env[`${prefix}DB_SSL`] === 'true',
        connectionLimit: parseInt(process.env[`${prefix}DB_CONNECTION_LIMIT`] || '10')
      }
    };

    // Optional Redis config
    if (process.env[`${prefix}REDIS_HOST`]) {
      config.redis = {
        host: process.env[`${prefix}REDIS_HOST`]!,
        port: parseInt(process.env[`${prefix}REDIS_PORT`] || '6379'),
        password: process.env[`${prefix}REDIS_PASSWORD`]
      };
    }

    this.validateTenantConfig(config, tenantId);
    return config;
  }

  private validateTenantConfig(config: TenantConfig, tenantId: string): void {
    if (!config.tenantId || config.tenantId !== tenantId) {
      throw new Error(`Invalid tenantId in config for ${tenantId}`);
    }
    
    if (!config.database?.host || !config.database?.database) {
      throw new Error(`Missing required database configuration for tenant ${tenantId}`);
    }
  }

  private shouldReloadCache(): boolean {
    return Date.now() - this.lastReload > this.cacheTTL;
  }

  private async reloadAllConfigs(): Promise<void> {
    try {
      const files = await fs.readdir(this.configPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const loadPromises = jsonFiles.map(async (file) => {
        const tenantId = path.basename(file, '.json');
        try {
          const config = await this.loadTenantConfigFile(tenantId);
          this.configCache.set(tenantId, config);
        } catch (error) {
          console.error(`Failed to reload config for ${tenantId}:`, error);
        }
      });
      
      await Promise.all(loadPromises);
      this.lastReload = Date.now();
    } catch (error) {
      console.error('Failed to reload tenant configs:', error);
    }
  }

  // Get tenant by subdomain
  async getTenantBySubdomain(subdomain: string): Promise<TenantConfig | null> {
    // Force a cache reload to get latest configs
    if (this.shouldReloadCache()) {
      await this.reloadAllConfigs();
    }

    for (const [, config] of this.configCache) {
      if (config.subdomain === subdomain) {
        return config;
      }
    }

    // If not in cache, try to load all configs and search again
    try {
      const files = await fs.readdir(this.configPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const tenantId = path.basename(file, '.json');
        const config = await this.loadTenantConfigFile(tenantId);
        
        if (config.subdomain === subdomain) {
          this.configCache.set(tenantId, config);
          return config;
        }
      }
    } catch (error) {
      console.error('Error searching for tenant by subdomain:', error);
    }

    return null;
  }

  clearCache(): void {
    this.configCache.clear();
    this.lastReload = 0;
  }
}
