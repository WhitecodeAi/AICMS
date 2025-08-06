import { PrismaClient } from '@prisma/client';
import TenantEnvLoader, { LoadedEnvironment } from './env-loader';
import DomainTenantService from './domain-tenant-service';

export interface TenantDatabaseConnection {
  client: PrismaClient;
  tenantId: string;
  domain: string;
  databaseUrl: string;
  connectedAt: Date;
  lastUsed: Date;
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  tenantConnections: Map<string, number>;
  oldestConnection?: Date;
  newestConnection?: Date;
}

/**
 * Tenant-aware database connection manager
 * Manages database connections based on domain identification
 */
export class TenantDatabaseManager {
  private static connections = new Map<string, TenantDatabaseConnection>();
  private static connectionTimeout = 30 * 60 * 1000; // 30 minutes
  private static maxConnections = 50; // Maximum total connections
  private static maxConnectionsPerTenant = 5; // Maximum connections per tenant

  /**
   * Get database connection for a specific domain
   */
  static async getConnectionForDomain(domain: string): Promise<PrismaClient | null> {
    try {
      // Load environment for the domain
      const loadedEnv = await TenantEnvLoader.loadEnvironmentForDomain(domain);
      
      if (!loadedEnv) {
        console.error(`Failed to load environment for domain: ${domain}`);
        return null;
      }

      // Apply environment variables
      TenantEnvLoader.applyEnvironment(loadedEnv);

      // Get or create database connection
      const connection = await this.getOrCreateConnection(loadedEnv);
      
      return connection ? connection.client : null;
    } catch (error) {
      console.error(`Failed to get database connection for domain ${domain}:`, error);
      return null;
    }
  }

  /**
   * Get or create database connection for loaded environment
   */
  private static async getOrCreateConnection(loadedEnv: LoadedEnvironment): Promise<TenantDatabaseConnection | null> {
    const { tenantId, domain, config } = loadedEnv;
    const connectionKey = `${domain}-${tenantId}`;
    
    // Check if connection already exists and is valid
    if (this.connections.has(connectionKey)) {
      const existingConnection = this.connections.get(connectionKey)!;
      
      // Check if connection is still valid
      const now = new Date();
      const connectionAge = now.getTime() - existingConnection.connectedAt.getTime();
      
      if (connectionAge < this.connectionTimeout) {
        // Update last used time
        existingConnection.lastUsed = now;
        return existingConnection;
      } else {
        // Connection expired, remove it
        await this.closeConnection(connectionKey);
      }
    }

    // Check connection limits
    if (!this.canCreateNewConnection(tenantId)) {
      console.warn(`Connection limit reached for tenant ${tenantId} or globally`);
      return null;
    }

    // Create new connection
    return await this.createNewConnection(loadedEnv);
  }

  /**
   * Create new database connection
   */
  private static async createNewConnection(loadedEnv: LoadedEnvironment): Promise<TenantDatabaseConnection | null> {
    const { tenantId, domain, config } = loadedEnv;
    const connectionKey = `${domain}-${tenantId}`;

    try {
      if (!config.DATABASE_URL) {
        console.error(`DATABASE_URL not found for tenant ${tenantId}`);
        return null;
      }

      // Create Prisma client with tenant-specific database URL
      const client = new PrismaClient({
        datasources: {
          db: {
            url: config.DATABASE_URL
          }
        },
        log: ['error', 'warn']
      });

      // Test the connection
      await client.$connect();
      await client.$queryRaw`SELECT 1`;

      const now = new Date();
      const connection: TenantDatabaseConnection = {
        client,
        tenantId,
        domain,
        databaseUrl: config.DATABASE_URL,
        connectedAt: now,
        lastUsed: now
      };

      // Store the connection
      this.connections.set(connectionKey, connection);

      console.log(`✅ Created database connection for tenant: ${tenantId} (${domain})`);
      return connection;
    } catch (error) {
      console.error(`Failed to create database connection for tenant ${tenantId}:`, error);
      return null;
    }
  }

  /**
   * Check if we can create a new connection
   */
  private static canCreateNewConnection(tenantId: string): boolean {
    // Check global limit
    if (this.connections.size >= this.maxConnections) {
      return false;
    }

    // Check per-tenant limit
    const tenantConnections = Array.from(this.connections.values())
      .filter(conn => conn.tenantId === tenantId);
    
    return tenantConnections.length < this.maxConnectionsPerTenant;
  }

  /**
   * Close specific connection
   */
  private static async closeConnection(connectionKey: string): Promise<void> {
    const connection = this.connections.get(connectionKey);
    
    if (connection) {
      try {
        await connection.client.$disconnect();
        this.connections.delete(connectionKey);
        console.log(`🔌 Closed database connection: ${connectionKey}`);
      } catch (error) {
        console.error(`Failed to close connection ${connectionKey}:`, error);
        // Remove from map anyway to prevent memory leaks
        this.connections.delete(connectionKey);
      }
    }
  }

  /**
   * Close all connections for a specific tenant
   */
  static async closeTenantConnections(tenantId: string): Promise<void> {
    const tenantConnectionKeys = Array.from(this.connections.entries())
      .filter(([key, conn]) => conn.tenantId === tenantId)
      .map(([key]) => key);

    await Promise.all(tenantConnectionKeys.map(key => this.closeConnection(key)));
  }

  /**
   * Close all connections
   */
  static async closeAllConnections(): Promise<void> {
    const connectionKeys = Array.from(this.connections.keys());
    await Promise.all(connectionKeys.map(key => this.closeConnection(key)));
  }

  /**
   * Clean up expired connections
   */
  static async cleanupExpiredConnections(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    const expiredConnections = Array.from(this.connections.entries())
      .filter(([key, conn]) => {
        const connectionAge = now.getTime() - conn.lastUsed.getTime();
        return connectionAge > this.connectionTimeout;
      });

    for (const [key] of expiredConnections) {
      await this.closeConnection(key);
      cleanedCount++;
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired database connections`);
    }

    return cleanedCount;
  }

  /**
   * Get connection statistics
   */
  static getConnectionStats(): ConnectionStats {
    const connections = Array.from(this.connections.values());
    const tenantConnections = new Map<string, number>();

    // Count connections per tenant
    connections.forEach(conn => {
      const current = tenantConnections.get(conn.tenantId) || 0;
      tenantConnections.set(conn.tenantId, current + 1);
    });

    // Find oldest and newest connections
    const connectionTimes = connections.map(conn => conn.connectedAt);
    const oldestConnection = connectionTimes.length > 0 ? 
      new Date(Math.min(...connectionTimes.map(t => t.getTime()))) : undefined;
    const newestConnection = connectionTimes.length > 0 ? 
      new Date(Math.max(...connectionTimes.map(t => t.getTime()))) : undefined;

    return {
      totalConnections: this.connections.size,
      activeConnections: connections.length,
      tenantConnections,
      oldestConnection,
      newestConnection
    };
  }

  /**
   * Health check for all connections
   */
  static async healthCheck(): Promise<{
    healthy: number;
    unhealthy: number;
    details: Array<{
      tenantId: string;
      domain: string;
      healthy: boolean;
      error?: string;
    }>;
  }> {
    let healthy = 0;
    let unhealthy = 0;
    const details: Array<{
      tenantId: string;
      domain: string;
      healthy: boolean;
      error?: string;
    }> = [];

    for (const [key, connection] of this.connections.entries()) {
      try {
        await connection.client.$queryRaw`SELECT 1`;
        healthy++;
        details.push({
          tenantId: connection.tenantId,
          domain: connection.domain,
          healthy: true
        });
      } catch (error) {
        unhealthy++;
        details.push({
          tenantId: connection.tenantId,
          domain: connection.domain,
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Close unhealthy connection
        await this.closeConnection(key);
      }
    }

    return { healthy, unhealthy, details };
  }

  /**
   * Get active connection for current environment
   */
  static getCurrentConnection(): TenantDatabaseConnection | null {
    const currentDomain = process.env.CURRENT_TENANT_DOMAIN;
    const currentTenantId = process.env.CURRENT_TENANT_ID;

    if (!currentDomain || !currentTenantId) {
      return null;
    }

    const connectionKey = `${currentDomain}-${currentTenantId}`;
    return this.connections.get(connectionKey) || null;
  }

  /**
   * Switch database context for current request
   */
  static async switchToTenant(domain: string): Promise<boolean> {
    try {
      const connection = await this.getConnectionForDomain(domain);
      return !!connection;
    } catch (error) {
      console.error(`Failed to switch to tenant for domain ${domain}:`, error);
      return false;
    }
  }

  /**
   * Configure connection manager
   */
  static configure(options: {
    connectionTimeout?: number;
    maxConnections?: number;
    maxConnectionsPerTenant?: number;
  }): void {
    if (options.connectionTimeout !== undefined) {
      this.connectionTimeout = options.connectionTimeout;
    }
    if (options.maxConnections !== undefined) {
      this.maxConnections = options.maxConnections;
    }
    if (options.maxConnectionsPerTenant !== undefined) {
      this.maxConnectionsPerTenant = options.maxConnectionsPerTenant;
    }
  }

  /**
   * Start periodic cleanup task
   */
  static startCleanupTask(intervalMs: number = 10 * 60 * 1000): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        await this.cleanupExpiredConnections();
      } catch (error) {
        console.error('Error during connection cleanup:', error);
      }
    }, intervalMs);
  }

  /**
   * Get tenant connection information
   */
  static getTenantConnectionInfo(tenantId: string): Array<{
    domain: string;
    databaseUrl: string;
    connectedAt: Date;
    lastUsed: Date;
    connectionAge: number;
  }> {
    return Array.from(this.connections.values())
      .filter(conn => conn.tenantId === tenantId)
      .map(conn => ({
        domain: conn.domain,
        databaseUrl: conn.databaseUrl.substring(0, 30) + '...',
        connectedAt: conn.connectedAt,
        lastUsed: conn.lastUsed,
        connectionAge: Date.now() - conn.connectedAt.getTime()
      }));
  }
}

export default TenantDatabaseManager;
