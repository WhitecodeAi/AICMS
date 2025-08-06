import { TenantConfig } from '../middleware/tenant';
import DatabaseService from './database-service';
import fs from 'fs/promises';
import path from 'path';

export interface CreateTenantRequest {
  name: string;
  subdomain: string;
  adminEmail: string;
  adminName: string;
  features?: Partial<TenantConfig['features']>;
  branding?: Partial<TenantConfig['branding']>;
  limits?: Partial<TenantConfig['limits']>;
  customEnvVars?: Record<string, string>;
}

export interface TenantStats {
  id: string;
  name: string;
  userCount: number;
  pageCount: number;
  storageUsed: number; // in MB
  apiCallsThisMonth: number;
  lastActivity: Date;
  isActive: boolean;
}

export class TenantService {
  private static configPath = path.join(process.cwd(), 'config', 'tenants');

  /**
   * Create a new tenant (dedicated database only)
   */
  static async createTenant(request: CreateTenantRequest): Promise<TenantConfig> {
    const tenantId = this.generateTenantId(request.subdomain);

    // Validate subdomain is available
    const existingTenant = await this.getTenantConfig(tenantId);
    if (existingTenant) {
      throw new Error(`Tenant with subdomain '${request.subdomain}' already exists`);
    }

    // Generate MySQL database credentials
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: `tenant_${tenantId}`,
      username: `tenant_${tenantId}`,
      password: this.generateSecurePassword(),
      charset: 'utf8mb4'
    };

    // Create tenant configuration
    const tenantConfig: TenantConfig = {
      id: tenantId,
      name: request.name,
      subdomain: request.subdomain,
      database: {
        strategy: 'dedicated',
        connectionString: `mysql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
        envFilePath: `config/tenants/${tenantId}.env`
      },
      features: {
        advancedEditor: true,
        customBranding: true,
        apiAccess: true,
        maxUsers: 50,
        ...request.features
      },
      branding: {
        logo: '/default-logo.png',
        primaryColor: '#3b82f6',
        ...request.branding
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        TENANT_MODE: 'active',
        ...request.customEnvVars
      },
      limits: {
        maxPages: 1000,
        maxStorage: 5000, // 5GB
        maxApiCalls: 50000,
        ...request.limits
      }
    };

    try {
      // 1. Create tenant database
      console.log(`Creating database for tenant: ${tenantId}`);
      const dbSuccess = await DatabaseService.createTenantDatabase(tenantId, dbConfig);
      if (!dbSuccess) {
        throw new Error('Failed to create tenant database');
      }

      // 2. Create tenant environment file
      console.log(`Creating environment file for tenant: ${tenantId}`);
      await DatabaseService.createTenantEnvFile(tenantId, dbConfig, {
        TENANT_NAME: request.name,
        TENANT_SUBDOMAIN: request.subdomain,
        ADMIN_EMAIL: request.adminEmail,
        ADMIN_NAME: request.adminName,
        DATABASE_TYPE: 'mysql',
        MYSQL_CHARSET: 'utf8mb4',
        MYSQL_COLLATION: 'utf8mb4_unicode_ci',
        ...request.customEnvVars
      });

      // 3. Save tenant configuration
      await this.saveTenantConfig(tenantConfig);

      // 4. Create default admin user
      await this.createTenantAdmin(tenantConfig, request.adminEmail, request.adminName);

      console.log(`✅ Tenant '${tenantId}' created successfully`);
      return tenantConfig;

    } catch (error) {
      // Cleanup on failure
      console.error(`Failed to create tenant ${tenantId}:`, error);

      try {
        await DatabaseService.deleteTenantDatabase(tenantId, dbConfig);
        await DatabaseService.deleteTenantEnvFile(tenantId);
        await this.deleteTenantConfig(tenantId);
      } catch (cleanupError) {
        console.error(`Cleanup failed for tenant ${tenantId}:`, cleanupError);
      }

      throw error;
    }
  }

  /**
   * Get tenant configuration
   */
  static async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    try {
      const configFile = path.join(this.configPath, `${tenantId}.json`);
      const configData = await fs.readFile(configFile, 'utf-8');
      return JSON.parse(configData) as TenantConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Update tenant configuration
   */
  static async updateTenantConfig(
    tenantId: string, 
    updates: Partial<TenantConfig>
  ): Promise<TenantConfig> {
    const existingConfig = await this.getTenantConfig(tenantId);
    if (!existingConfig) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }

    const updatedConfig: TenantConfig = {
      ...existingConfig,
      ...updates,
      id: tenantId // Ensure ID cannot be changed
    };

    await this.saveTenantConfig(updatedConfig);
    return updatedConfig;
  }

  /**
   * Delete a tenant (database, env file, and config)
   */
  static async deleteTenant(tenantId: string): Promise<boolean> {
    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) {
        throw new Error(`Tenant '${tenantId}' not found`);
      }

      console.log(`Deleting tenant: ${tenantId}`);

      // Extract database config from connection string
      const dbConfig = this.parseConnectionString(config.database.connectionString!);

      // 1. Delete tenant database
      await DatabaseService.deleteTenantDatabase(tenantId, dbConfig);

      // 2. Delete tenant environment file
      await DatabaseService.deleteTenantEnvFile(tenantId);

      // 3. Delete tenant configuration file
      await this.deleteTenantConfig(tenantId);

      console.log(`✅ Tenant '${tenantId}' deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to delete tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Delete tenant configuration file
   */
  private static async deleteTenantConfig(tenantId: string): Promise<void> {
    try {
      const configFile = path.join(this.configPath, `${tenantId}.json`);
      await fs.unlink(configFile);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Parse database connection string
   */
  private static parseConnectionString(connectionString: string): any {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1),
      username: url.username,
      password: url.password
    };
  }

  /**
   * List all tenants
   */
  static async listTenants(): Promise<TenantConfig[]> {
    try {
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

      return tenants;
    } catch (error) {
      console.error('Failed to list tenants:', error);
      return [];
    }
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(tenantId: string): Promise<TenantStats | null> {
    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) return null;

      // Get database connection
      const client = await DatabaseService.getConnection(config);

      // Query statistics (simplified example)
      const [userCount, pageCount] = await Promise.all([
        client.user.count(),
        client.page.count()
      ]);

      // Calculate storage usage (simplified)
      const pages = await client.page.findMany({
        select: { html: true, css: true, js: true }
      });

      const storageUsed = pages.reduce((total, page) => {
        const size = (page.html?.length || 0) + (page.css?.length || 0) + (page.js?.length || 0);
        return total + (size / 1024 / 1024); // Convert to MB
      }, 0);

      return {
        id: tenantId,
        name: config.name,
        userCount,
        pageCount,
        storageUsed: Math.round(storageUsed * 100) / 100,
        apiCallsThisMonth: 0, // Implement API call tracking
        lastActivity: new Date(), // Implement activity tracking
        isActive: true
      };
    } catch (error) {
      console.error(`Failed to get stats for tenant ${tenantId}:`, error);
      return null;
    }
  }

  /**
   * Validate tenant subdomain
   */
  static validateSubdomain(subdomain: string): boolean {
    // Subdomain validation rules
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    const reservedSubdomains = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost'];
    
    return (
      subdomainRegex.test(subdomain) &&
      subdomain.length >= 2 &&
      subdomain.length <= 63 &&
      !reservedSubdomains.includes(subdomain)
    );
  }

  /**
   * Check if tenant is within usage limits
   */
  static async checkUsageLimits(tenantId: string): Promise<{
    withinLimits: boolean;
    violations: string[];
  }> {
    const config = await this.getTenantConfig(tenantId);
    if (!config) {
      return { withinLimits: false, violations: ['Tenant not found'] };
    }

    const stats = await this.getTenantStats(tenantId);
    if (!stats) {
      return { withinLimits: false, violations: ['Unable to get tenant stats'] };
    }

    const violations: string[] = [];

    if (stats.userCount > config.limits.maxUsers) {
      violations.push(`User count (${stats.userCount}) exceeds limit (${config.limits.maxUsers})`);
    }

    if (stats.pageCount > config.limits.maxPages) {
      violations.push(`Page count (${stats.pageCount}) exceeds limit (${config.limits.maxPages})`);
    }

    if (stats.storageUsed > config.limits.maxStorage) {
      violations.push(`Storage usage (${stats.storageUsed}MB) exceeds limit (${config.limits.maxStorage}MB)`);
    }

    if (stats.apiCallsThisMonth > config.limits.maxApiCalls) {
      violations.push(`API calls (${stats.apiCallsThisMonth}) exceed monthly limit (${config.limits.maxApiCalls})`);
    }

    return {
      withinLimits: violations.length === 0,
      violations
    };
  }

  /**
   * Private helper methods
   */
  private static generateTenantId(subdomain: string): string {
    return subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  private static generateSecurePassword(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  private static async saveTenantConfig(config: TenantConfig): Promise<void> {
    // Ensure config directory exists
    await fs.mkdir(this.configPath, { recursive: true });
    
    const configFile = path.join(this.configPath, `${config.id}.json`);
    await fs.writeFile(configFile, JSON.stringify(config, null, 2));
  }

  private static async createTenantAdmin(
    config: TenantConfig, 
    email: string, 
    name: string
  ): Promise<void> {
    try {
      const client = await DatabaseService.getConnection(config);
      
      // Create admin user
      await client.user.create({
        data: {
          id: `admin_${config.id}`,
          email,
          name,
          // Add tenant ID if using shared database
          ...(config.database.strategy === 'shared' && { tenantId: config.id })
        }
      });
    } catch (error) {
      console.error(`Failed to create admin user for tenant ${config.id}:`, error);
      // Don't throw error here - tenant creation should succeed even if admin creation fails
    }
  }
}

export default TenantService;
