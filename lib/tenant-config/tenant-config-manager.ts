import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { TenantConfig, CreateTenantRequest, TenantValidationResult, TenantListItem } from './types';
import { TenantValidator } from './tenant-validator';

export class TenantConfigManager {
  private static instance: TenantConfigManager;
  private configPath: string;
  private configCache = new Map<string, TenantConfig>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config', 'tenants');
  }

  static getInstance(configPath?: string): TenantConfigManager {
    if (!TenantConfigManager.instance) {
      TenantConfigManager.instance = new TenantConfigManager(configPath);
    }
    return TenantConfigManager.instance;
  }

  /**
   * Create a new tenant configuration
   */
  async createTenant(request: CreateTenantRequest): Promise<TenantConfig> {
    // Validate request
    const validation = TenantValidator.validateCreateRequest(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Check if tenant already exists
    const tenantId = this.generateTenantId(request.subdomain);
    const existingTenant = await this.getTenantConfig(tenantId);
    if (existingTenant) {
      throw new Error(`Tenant with subdomain '${request.subdomain}' already exists`);
    }

    // Generate secure credentials
    const jwtSecret = this.generateSecureKey(64);
    const encryptionKey = this.generateSecureKey(32);
    const sessionSecret = this.generateSecureKey(64);
    const apiKey = this.generateSecureKey(32);

    // Create tenant configuration
    const config: TenantConfig = {
      id: tenantId,
      name: request.name,
      subdomain: request.subdomain,
      domain: request.domain,
      status: 'active',
      
      database: {
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        database: `tenant_${tenantId}`,
        username: `tenant_${tenantId}`,
        password: this.generateSecureKey(16),
        ssl: false,
        connectionLimit: 10
      },
      
      features: {
        advancedEditor: true,
        customBranding: true,
        apiAccess: true,
        fileUpload: true,
        analytics: true,
        customDomain: false,
        sslEnabled: false,
        multiLanguage: false,
        ecommerce: false,
        socialLogin: false,
        ...request.features
      },
      
      limits: {
        maxUsers: 50,
        maxPages: 1000,
        maxPosts: 5000,
        maxStorage: 5000, // 5GB
        maxApiCalls: 50000,
        maxFileSize: 50, // 50MB
        maxMenus: 10,
        maxGalleries: 50,
        maxSliders: 10,
        ...request.limits
      },
      
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        fontFamily: 'Inter',
        brandName: request.name,
        ...request.branding
      },
      
      seo: {
        sitemapEnabled: true,
        ...request.seo
      },
      
      security: {
        jwtSecret,
        encryptionKey,
        sessionSecret,
        apiKeyEnabled: true,
        apiKey,
        corsOrigins: [],
        rateLimitEnabled: true,
        rateLimitRequests: 100
      },
      
      smtp: {
        enabled: false,
        ...request.smtp
      },
      
      storage: {
        type: 'local',
        basePath: `/uploads/${tenantId}`,
        ...request.storage
      },
      
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        TENANT_MODE: 'active',
        ...request.environment
      },
      
      customSettings: {
        ...request.customSettings
      },
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      adminUser: {
        email: request.adminEmail,
        firstName: request.adminFirstName,
        lastName: request.adminLastName
      }
    };

    // Generate database URL
    config.database.url = this.generateDatabaseUrl(config.database);

    // Save configuration
    await this.saveTenantConfig(config);

    // Clear cache
    this.clearCache();

    return config;
  }

  /**
   * Get tenant configuration by ID
   */
  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    // Check cache first
    const cached = this.getCachedConfig(tenantId);
    if (cached) {
      return cached;
    }

    try {
      const configFile = path.join(this.configPath, `${tenantId}.json`);
      const configData = await fs.readFile(configFile, 'utf-8');
      const config = JSON.parse(configData) as TenantConfig;
      
      // Cache the configuration
      this.setCachedConfig(tenantId, config);
      
      return config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get tenant configuration by subdomain
   */
  async getTenantBySubdomain(subdomain: string): Promise<TenantConfig | null> {
    const tenants = await this.listTenants();
    return tenants.find(t => t.subdomain === subdomain) || null;
  }

  /**
   * Get tenant configuration by domain
   */
  async getTenantByDomain(domain: string): Promise<TenantConfig | null> {
    const tenants = await this.listTenants();
    return tenants.find(t => t.domain === domain) || null;
  }

  /**
   * Update tenant configuration
   */
  async updateTenantConfig(
    tenantId: string,
    updates: Partial<TenantConfig>
  ): Promise<TenantConfig> {
    const existingConfig = await this.getTenantConfig(tenantId);
    if (!existingConfig) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }

    // Merge configurations
    const updatedConfig: TenantConfig = {
      ...existingConfig,
      ...updates,
      id: tenantId, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString()
    };

    // Validate updated configuration
    const validation = TenantValidator.validateConfig(updatedConfig);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Save configuration
    await this.saveTenantConfig(updatedConfig);

    // Clear cache
    this.removeCachedConfig(tenantId);

    return updatedConfig;
  }

  /**
   * Delete tenant configuration
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    try {
      const configFile = path.join(this.configPath, `${tenantId}.json`);
      await fs.unlink(configFile);
      
      // Clear cache
      this.removeCachedConfig(tenantId);
      
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * List all tenant configurations
   */
  async listTenants(): Promise<TenantConfig[]> {
    try {
      await fs.mkdir(this.configPath, { recursive: true });
      const files = await fs.readdir(this.configPath);
      const tenants: TenantConfig[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const tenantId = file.replace('.json', '');
          const config = await this.getTenantConfig(tenantId);
          if (config) {
            tenants.push(config);
          }
        }
      }

      return tenants.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to list tenants:', error);
      return [];
    }
  }

  /**
   * List tenants with summary information
   */
  async listTenantsWithSummary(): Promise<TenantListItem[]> {
    const tenants = await this.listTenants();
    return tenants.map(t => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      domain: t.domain,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));
  }

  /**
   * Check if tenant exists
   */
  async tenantExists(tenantId: string): Promise<boolean> {
    const config = await this.getTenantConfig(tenantId);
    return config !== null;
  }

  /**
   * Check if subdomain is available
   */
  async isSubdomainAvailable(subdomain: string, excludeTenantId?: string): Promise<boolean> {
    const tenants = await this.listTenants();
    return !tenants.some(t => 
      t.subdomain === subdomain && t.id !== excludeTenantId
    );
  }

  /**
   * Validate tenant configuration
   */
  validateConfig(config: TenantConfig): TenantValidationResult {
    return TenantValidator.validateConfig(config);
  }

  /**
   * Generate database URL from database config
   */
  private generateDatabaseUrl(dbConfig: TenantConfig['database']): string {
    const { type, username, password, host, port, database } = dbConfig;
    
    switch (type) {
      case 'mysql':
        return `mysql://${username}:${password}@${host}:${port}/${database}`;
      case 'postgresql':
        return `postgresql://${username}:${password}@${host}:${port}/${database}`;
      case 'sqlite':
        return `file:./${database}.db`;
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  /**
   * Save tenant configuration to file
   */
  private async saveTenantConfig(config: TenantConfig): Promise<void> {
    await fs.mkdir(this.configPath, { recursive: true });
    const configFile = path.join(this.configPath, `${config.id}.json`);
    await fs.writeFile(configFile, JSON.stringify(config, null, 2));
  }

  /**
   * Generate tenant ID from subdomain
   */
  private generateTenantId(subdomain: string): string {
    return subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Generate secure key
   */
  private generateSecureKey(length: number): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Cache management methods
   */
  private getCachedConfig(tenantId: string): TenantConfig | null {
    const cached = this.configCache.get(tenantId);
    const timestamp = this.cacheTimestamps.get(tenantId);
    
    if (cached && timestamp && (Date.now() - timestamp) < this.CACHE_TTL) {
      return cached;
    }
    
    // Remove expired cache
    if (cached) {
      this.removeCachedConfig(tenantId);
    }
    
    return null;
  }

  private setCachedConfig(tenantId: string, config: TenantConfig): void {
    this.configCache.set(tenantId, config);
    this.cacheTimestamps.set(tenantId, Date.now());
  }

  private removeCachedConfig(tenantId: string): void {
    this.configCache.delete(tenantId);
    this.cacheTimestamps.delete(tenantId);
  }

  private clearCache(): void {
    this.configCache.clear();
    this.cacheTimestamps.clear();
  }
}

export default TenantConfigManager;
