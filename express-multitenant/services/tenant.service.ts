import { TenantContext, TenantConfig } from '../types/tenant';
import { databasePoolService } from './database-pool.service';
import { TenantConfigService } from './tenant-config.service';

export class TenantService {
  private configService: TenantConfigService;

  constructor(configService?: TenantConfigService) {
    this.configService = configService || new TenantConfigService();
  }

  // Execute a query in tenant's database
  async executeQuery<T = any>(
    tenantContext: TenantContext,
    query: string,
    params?: any[]
  ): Promise<T[]> {
    return databasePoolService.executeQuery<T>(
      tenantContext.tenantId,
      tenantContext.config,
      query,
      params
    );
  }

  // Execute a transaction in tenant's database
  async executeTransaction<T>(
    tenantContext: TenantContext,
    callback: (connection: any) => Promise<T>
  ): Promise<T> {
    return databasePoolService.executeTransaction(
      tenantContext.tenantId,
      tenantContext.config,
      callback
    );
  }

  // Get tenant configuration
  async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    return this.configService.getTenantConfig(tenantId);
  }

  // Find tenant by subdomain
  async getTenantBySubdomain(subdomain: string): Promise<TenantConfig | null> {
    return this.configService.getTenantBySubdomain(subdomain);
  }

  // Validate tenant exists and is active
  async validateTenant(tenantId: string): Promise<boolean> {
    const config = await this.getTenantConfig(tenantId);
    return config !== null;
  }

  // Get database statistics for a tenant
  async getTenantDatabaseStats(tenantContext: TenantContext): Promise<any> {
    try {
      const [tables] = await this.executeQuery(tenantContext, `
        SELECT 
          TABLE_NAME,
          TABLE_ROWS,
          DATA_LENGTH,
          INDEX_LENGTH
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ?
      `, [tenantContext.config.database.database]);

      const [status] = await this.executeQuery(tenantContext, 'SHOW STATUS LIKE "Threads_connected"');

      return {
        database: tenantContext.config.database.database,
        tables,
        connections: status,
        poolStats: databasePoolService.getPoolStats().find(p => p.tenantId === tenantContext.tenantId)
      };
    } catch (error) {
      console.error(`Failed to get database stats for tenant ${tenantContext.tenantId}:`, error);
      throw error;
    }
  }

  // Create a new tenant (admin function)
  async createTenant(tenantConfig: TenantConfig): Promise<void> {
    // Validate configuration
    this.validateTenantConfig(tenantConfig);

    // Test database connection
    try {
      await databasePoolService.getConnection(tenantConfig.tenantId, tenantConfig);
    } catch (error) {
      throw new Error(`Failed to connect to database for tenant ${tenantConfig.tenantId}: ${error}`);
    }

    // Here you would typically:
    // 1. Save config to file or central database
    // 2. Initialize tenant database schema
    // 3. Set up initial data
    
    console.log(`Tenant ${tenantConfig.tenantId} created successfully`);
  }

  // Initialize tenant database schema
  async initializeTenantDatabase(tenantContext: TenantContext, schemaQueries: string[]): Promise<void> {
    await this.executeTransaction(tenantContext, async (connection) => {
      for (const query of schemaQueries) {
        await connection.execute(query);
      }
    });
  }

  // Backup tenant database
  async backupTenantDatabase(tenantContext: TenantContext): Promise<string> {
    // This is a simplified version - in production you'd use mysqldump or similar
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${tenantContext.tenantId}_backup_${timestamp}`;

    // Get all tables
    const tables = await this.executeQuery(tenantContext, `
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [tenantContext.config.database.database]);

    console.log(`Created backup ${backupName} for tenant ${tenantContext.tenantId}`);
    return backupName;
  }

  // Delete tenant and cleanup
  async deleteTenant(tenantId: string): Promise<void> {
    // Close database connections
    const poolStats = databasePoolService.getPoolStats();
    const tenantPool = poolStats.find(p => p.tenantId === tenantId);
    
    if (tenantPool) {
      // Force close the pool
      await databasePoolService.closeAllPools();
    }

    // Clear configuration cache
    this.configService.clearCache();

    console.log(`Tenant ${tenantId} deleted and cleaned up`);
  }

  private validateTenantConfig(config: TenantConfig): void {
    if (!config.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!config.database?.host || !config.database?.database) {
      throw new Error('Database configuration is incomplete');
    }

    if (!config.subdomain) {
      throw new Error('Subdomain is required');
    }

    // Additional validation rules
    const tenantIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!tenantIdRegex.test(config.tenantId)) {
      throw new Error('Invalid tenant ID format');
    }
  }

  // Get all active tenant IDs (for admin purposes)
  async getActiveTenants(): Promise<string[]> {
    const poolStats = databasePoolService.getPoolStats();
    return poolStats.map(p => p.tenantId);
  }

  // Health check for tenant
  async healthCheck(tenantContext: TenantContext): Promise<{
    status: 'healthy' | 'unhealthy';
    database: boolean;
    latency: number;
  }> {
    const start = Date.now();
    
    try {
      await this.executeQuery(tenantContext, 'SELECT 1 as health_check');
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        database: true,
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: false,
        latency: Date.now() - start
      };
    }
  }
}

// Singleton instance
export const tenantService = new TenantService();
