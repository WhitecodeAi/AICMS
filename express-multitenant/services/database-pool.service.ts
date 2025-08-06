import mysql from 'mysql2/promise';
import { TenantConfig } from '../types/tenant';

export interface DatabaseConnection {
  pool: mysql.Pool;
  config: TenantConfig['database'];
  lastUsed: number;
  activeConnections: number;
}

export class DatabasePoolService {
  private pools: Map<string, DatabaseConnection> = new Map();
  private maxIdleTime: number;
  private cleanupInterval: NodeJS.Timeout;
  private maxPoolsPerTenant: number;

  constructor(
    maxIdleTime: number = 600000, // 10 minutes
    cleanupIntervalMs: number = 300000, // 5 minutes
    maxPoolsPerTenant: number = 1
  ) {
    this.maxIdleTime = maxIdleTime;
    this.maxPoolsPerTenant = maxPoolsPerTenant;
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdlePools();
    }, cleanupIntervalMs);
  }

  async getConnection(tenantId: string, config: TenantConfig): Promise<mysql.Pool> {
    const poolKey = `${tenantId}`;
    
    let dbConnection = this.pools.get(poolKey);
    
    // Create new pool if doesn't exist or config changed
    if (!dbConnection || this.hasConfigChanged(dbConnection.config, config.database)) {
      if (dbConnection) {
        await this.closePool(poolKey);
      }
      
      dbConnection = await this.createPool(tenantId, config);
      this.pools.set(poolKey, dbConnection);
    }
    
    // Update last used timestamp
    dbConnection.lastUsed = Date.now();
    
    return dbConnection.pool;
  }

  private async createPool(tenantId: string, config: TenantConfig): Promise<DatabaseConnection> {
    const poolConfig: mysql.PoolOptions = {
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      connectionLimit: config.database.connectionLimit || 10,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    };

    const pool = mysql.createPool(poolConfig);
    
    // Test the connection
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
    } catch (error) {
      await pool.end();
      throw new Error(`Failed to create database pool for tenant ${tenantId}: ${error}`);
    }

    console.log(`Created database pool for tenant: ${tenantId}`);

    return {
      pool,
      config: config.database,
      lastUsed: Date.now(),
      activeConnections: 0
    };
  }

  private hasConfigChanged(oldConfig: TenantConfig['database'], newConfig: TenantConfig['database']): boolean {
    return (
      oldConfig.host !== newConfig.host ||
      oldConfig.port !== newConfig.port ||
      oldConfig.database !== newConfig.database ||
      oldConfig.user !== newConfig.user ||
      oldConfig.password !== newConfig.password ||
      oldConfig.connectionLimit !== newConfig.connectionLimit
    );
  }

  private async cleanupIdlePools(): Promise<void> {
    const now = Date.now();
    const poolsToCleanup: string[] = [];

    for (const [poolKey, dbConnection] of this.pools) {
      const idleTime = now - dbConnection.lastUsed;
      
      if (idleTime > this.maxIdleTime && dbConnection.activeConnections === 0) {
        poolsToCleanup.push(poolKey);
      }
    }

    for (const poolKey of poolsToCleanup) {
      await this.closePool(poolKey);
      console.log(`Cleaned up idle database pool: ${poolKey}`);
    }
  }

  private async closePool(poolKey: string): Promise<void> {
    const dbConnection = this.pools.get(poolKey);
    if (dbConnection) {
      try {
        await dbConnection.pool.end();
      } catch (error) {
        console.error(`Error closing pool ${poolKey}:`, error);
      }
      this.pools.delete(poolKey);
    }
  }

  async executeQuery<T = any>(
    tenantId: string, 
    config: TenantConfig, 
    query: string, 
    params?: any[]
  ): Promise<T[]> {
    const pool = await this.getConnection(tenantId, config);
    const dbConnection = this.pools.get(tenantId)!;
    
    try {
      dbConnection.activeConnections++;
      const [rows] = await pool.execute(query, params);
      return rows as T[];
    } finally {
      dbConnection.activeConnections--;
    }
  }

  async executeTransaction<T>(
    tenantId: string,
    config: TenantConfig,
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> {
    const pool = await this.getConnection(tenantId, config);
    const dbConnection = this.pools.get(tenantId)!;
    const connection = await pool.getConnection();
    
    try {
      dbConnection.activeConnections++;
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
      dbConnection.activeConnections--;
    }
  }

  getPoolStats(): { tenantId: string; activeConnections: number; lastUsed: Date }[] {
    return Array.from(this.pools.entries()).map(([tenantId, connection]) => ({
      tenantId,
      activeConnections: connection.activeConnections,
      lastUsed: new Date(connection.lastUsed)
    }));
  }

  async closeAllPools(): Promise<void> {
    clearInterval(this.cleanupInterval);
    
    const closePromises = Array.from(this.pools.keys()).map(poolKey => 
      this.closePool(poolKey)
    );
    
    await Promise.all(closePromises);
    console.log('All database pools closed');
  }
}

// Singleton instance
export const databasePoolService = new DatabasePoolService();
