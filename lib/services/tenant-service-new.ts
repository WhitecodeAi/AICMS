import { 
  TenantConfigManager, 
  TenantIdentificationService,
  TenantConfig,
  CreateTenantRequest,
  TenantContext,
  TenantUsageStats
} from '../tenant-config';

export interface DatabaseStats {
  database: string;
  tables: Array<{
    TABLE_NAME: string;
    TABLE_ROWS: number;
    DATA_LENGTH: number;
    INDEX_LENGTH: number;
  }>;
  totalSize: number; // in MB
  tableCount: number;
}

export interface TenantHealthCheck {
  status: 'healthy' | 'unhealthy' | 'warning';
  database: boolean;
  latency: number;
  diskSpace?: number;
  memoryUsage?: number;
  issues: string[];
}

export class TenantService {
  private configManager: TenantConfigManager;

  constructor() {
    this.configManager = TenantConfigManager.getInstance();
  }

  /**
   * Create a new tenant
   */
  async createTenant(request: CreateTenantRequest): Promise<TenantConfig> {
    try {
      const config = await this.configManager.createTenant(request);
      
      // TODO: Initialize tenant database schema
      // await this.initializeTenantDatabase(config);
      
      console.log(`✅ Tenant '${config.id}' created successfully`);
      return config;
    } catch (error) {
      console.error('Failed to create tenant:', error);
      throw error;
    }
  }

  /**
   * Get tenant configuration by ID
   */
  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    return await this.configManager.getTenantConfig(tenantId);
  }

  /**
   * Get tenant by subdomain
   */
  async getTenantBySubdomain(subdomain: string): Promise<TenantConfig | null> {
    return await this.configManager.getTenantBySubdomain(subdomain);
  }

  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain: string): Promise<TenantConfig | null> {
    return await this.configManager.getTenantByDomain(domain);
  }

  /**
   * Update tenant configuration
   */
  async updateTenant(
    tenantId: string,
    updates: Partial<TenantConfig>
  ): Promise<TenantConfig> {
    return await this.configManager.updateTenantConfig(tenantId, updates);
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    try {
      // TODO: Cleanup tenant database and files
      // await this.cleanupTenantData(tenantId);
      
      const result = await this.configManager.deleteTenant(tenantId);
      
      if (result) {
        console.log(`✅ Tenant '${tenantId}' deleted successfully`);
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to delete tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * List all tenants
   */
  async listTenants(): Promise<TenantConfig[]> {
    return await this.configManager.listTenants();
  }

  /**
   * List tenants with summary information
   */
  async listTenantsWithSummary() {
    return await this.configManager.listTenantsWithSummary();
  }

  /**
   * Check if tenant exists
   */
  async tenantExists(tenantId: string): Promise<boolean> {
    return await this.configManager.tenantExists(tenantId);
  }

  /**
   * Validate tenant configuration
   */
  validateTenantConfig(config: TenantConfig) {
    return this.configManager.validateConfig(config);
  }

  /**
   * Check if subdomain is available
   */
  async isSubdomainAvailable(subdomain: string, excludeTenantId?: string): Promise<boolean> {
    return await this.configManager.isSubdomainAvailable(subdomain, excludeTenantId);
  }

  /**
   * Get tenant context from request
   */
  async getTenantContext(tenantId: string, user?: any): Promise<TenantContext | null> {
    return await TenantIdentificationService.createTenantContext(tenantId, user);
  }

  /**
   * Get tenant database URL
   */
  getTenantDatabaseUrl(config: TenantConfig): string {
    return TenantIdentificationService.getTenantDatabaseUrl(config);
  }

  /**
   * Get tenant environment variables
   */
  getTenantEnvironment(config: TenantConfig): Record<string, string> {
    return TenantIdentificationService.getTenantEnvironment(config);
  }

  /**
   * Health check for tenant
   */
  async healthCheck(tenantId: string): Promise<TenantHealthCheck> {
    const start = Date.now();
    const issues: string[] = [];

    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) {
        return {
          status: 'unhealthy',
          database: false,
          latency: Date.now() - start,
          issues: ['Tenant configuration not found']
        };
      }

      if (config.status !== 'active') {
        issues.push(`Tenant status is '${config.status}' (not active)`);
      }

      // TODO: Test database connection
      // const dbHealthy = await this.testDatabaseConnection(config);
      const dbHealthy = true; // Placeholder
      
      if (!dbHealthy) {
        issues.push('Database connection failed');
      }

      const latency = Date.now() - start;
      let status: 'healthy' | 'unhealthy' | 'warning' = 'healthy';

      if (issues.length > 0) {
        status = dbHealthy ? 'warning' : 'unhealthy';
      }

      if (latency > 1000) {
        issues.push('High response latency');
        if (status === 'healthy') status = 'warning';
      }

      return {
        status,
        database: dbHealthy,
        latency,
        issues
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: false,
        latency: Date.now() - start,
        issues: [`Health check failed: ${error}`]
      };
    }
  }

  /**
   * Get tenant usage statistics
   */
  async getTenantUsageStats(tenantId: string): Promise<TenantUsageStats | null> {
    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) return null;

      // TODO: Implement actual database queries for stats
      // For now, return placeholder data
      return {
        tenantId,
        userCount: 0,
        pageCount: 0,
        postCount: 0,
        fileCount: 0,
        storageUsed: 0,
        apiCallsThisMonth: 0,
        lastActivity: new Date(),
        databaseSize: 0
      };
    } catch (error) {
      console.error(`Failed to get usage stats for tenant ${tenantId}:`, error);
      return null;
    }
  }

  /**
   * Get database statistics for tenant
   */
  async getDatabaseStats(tenantId: string): Promise<DatabaseStats | null> {
    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) return null;

      // TODO: Implement actual database statistics query
      // This would involve connecting to the tenant's database and running queries
      
      return {
        database: config.database.database,
        tables: [],
        totalSize: 0,
        tableCount: 0
      };
    } catch (error) {
      console.error(`Failed to get database stats for tenant ${tenantId}:`, error);
      return null;
    }
  }

  /**
   * Check tenant usage limits
   */
  async checkUsageLimits(tenantId: string): Promise<{
    withinLimits: boolean;
    violations: string[];
    usage: Partial<TenantUsageStats>;
  }> {
    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) {
        return { 
          withinLimits: false, 
          violations: ['Tenant not found'],
          usage: {}
        };
      }

      const usage = await this.getTenantUsageStats(tenantId);
      if (!usage) {
        return { 
          withinLimits: false, 
          violations: ['Unable to get tenant usage stats'],
          usage: {}
        };
      }

      const violations: string[] = [];

      if (usage.userCount > config.limits.maxUsers) {
        violations.push(`User count (${usage.userCount}) exceeds limit (${config.limits.maxUsers})`);
      }

      if (usage.pageCount > config.limits.maxPages) {
        violations.push(`Page count (${usage.pageCount}) exceeds limit (${config.limits.maxPages})`);
      }

      if (usage.postCount > config.limits.maxPosts) {
        violations.push(`Post count (${usage.postCount}) exceeds limit (${config.limits.maxPosts})`);
      }

      if (usage.storageUsed > config.limits.maxStorage) {
        violations.push(`Storage usage (${usage.storageUsed}MB) exceeds limit (${config.limits.maxStorage}MB)`);
      }

      if (usage.apiCallsThisMonth > config.limits.maxApiCalls) {
        violations.push(`API calls (${usage.apiCallsThisMonth}) exceed monthly limit (${config.limits.maxApiCalls})`);
      }

      return {
        withinLimits: violations.length === 0,
        violations,
        usage
      };
    } catch (error) {
      console.error(`Failed to check usage limits for tenant ${tenantId}:`, error);
      return { 
        withinLimits: false, 
        violations: [`Error checking limits: ${error}`],
        usage: {}
      };
    }
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string, reason?: string): Promise<boolean> {
    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) return false;

      await this.updateTenant(tenantId, {
        status: 'suspended',
        customSettings: {
          ...config.customSettings,
          suspensionReason: reason,
          suspendedAt: new Date().toISOString()
        }
      });

      console.log(`Tenant '${tenantId}' suspended. Reason: ${reason || 'No reason provided'}`);
      return true;
    } catch (error) {
      console.error(`Failed to suspend tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Activate tenant
   */
  async activateTenant(tenantId: string): Promise<boolean> {
    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) return false;

      const customSettings = { ...config.customSettings };
      delete customSettings.suspensionReason;
      delete customSettings.suspendedAt;

      await this.updateTenant(tenantId, {
        status: 'active',
        customSettings
      });

      console.log(`Tenant '${tenantId}' activated`);
      return true;
    } catch (error) {
      console.error(`Failed to activate tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Archive tenant
   */
  async archiveTenant(tenantId: string): Promise<boolean> {
    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) return false;

      await this.updateTenant(tenantId, {
        status: 'archived',
        customSettings: {
          ...config.customSettings,
          archivedAt: new Date().toISOString()
        }
      });

      console.log(`Tenant '${tenantId}' archived`);
      return true;
    } catch (error) {
      console.error(`Failed to archive tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Export tenant configuration
   */
  async exportTenantConfig(tenantId: string): Promise<string | null> {
    try {
      const config = await this.getTenantConfig(tenantId);
      if (!config) return null;

      // Remove sensitive information before export
      const exportConfig = {
        ...config,
        security: {
          ...config.security,
          jwtSecret: '[REDACTED]',
          encryptionKey: '[REDACTED]',
          sessionSecret: '[REDACTED]',
          apiKey: config.security.apiKey ? '[REDACTED]' : undefined
        },
        database: {
          ...config.database,
          password: '[REDACTED]'
        },
        smtp: config.smtp.enabled ? {
          ...config.smtp,
          password: '[REDACTED]'
        } : config.smtp
      };

      return JSON.stringify(exportConfig, null, 2);
    } catch (error) {
      console.error(`Failed to export tenant config for ${tenantId}:`, error);
      return null;
    }
  }
}

// Singleton instance
export const tenantService = new TenantService();
export default TenantService;
