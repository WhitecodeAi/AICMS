import { PrismaClient } from '@prisma/client';
import TenantDatabaseManager from './tenant-config/tenant-database-manager';
import TenantEnvLoader from './tenant-config/env-loader';
import DomainTenantService from './tenant-config/domain-tenant-service';

/**
 * Tenant-aware Prisma client
 * Automatically connects to the correct database based on current tenant context
 */
class TenantPrismaClient {
  private static instance: TenantPrismaClient;
  private currentClient: PrismaClient | null = null;
  private currentTenantId: string | null = null;
  private currentDomain: string | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TenantPrismaClient {
    if (!TenantPrismaClient.instance) {
      TenantPrismaClient.instance = new TenantPrismaClient();
    }
    return TenantPrismaClient.instance;
  }

  /**
   * Get Prisma client for current tenant context
   */
  async getClient(): Promise<PrismaClient | null> {
    const currentDomain = process.env.CURRENT_TENANT_DOMAIN;
    const currentTenantId = process.env.CURRENT_TENANT_ID;

    // If no tenant context, return null
    if (!currentDomain || !currentTenantId) {
      console.warn('No tenant context found. Make sure middleware has processed the request.');
      return null;
    }

    // If client is already connected to the correct tenant, return it
    if (this.currentClient && 
        this.currentTenantId === currentTenantId && 
        this.currentDomain === currentDomain) {
      return this.currentClient;
    }

    // Get new client for the tenant
    const client = await TenantDatabaseManager.getConnectionForDomain(currentDomain);
    
    if (client) {
      this.currentClient = client;
      this.currentTenantId = currentTenantId;
      this.currentDomain = currentDomain;
    }

    return client;
  }

  /**
   * Get Prisma client for specific domain
   */
  async getClientForDomain(domain: string): Promise<PrismaClient | null> {
    return await TenantDatabaseManager.getConnectionForDomain(domain);
  }

  /**
   * Switch to specific tenant
   */
  async switchToTenant(domain: string): Promise<boolean> {
    try {
      const client = await TenantDatabaseManager.getConnectionForDomain(domain);
      
      if (client) {
        this.currentClient = client;
        this.currentDomain = domain;
        
        // Update tenant context if environment is loaded
        const loadedEnv = await TenantEnvLoader.loadEnvironmentForDomain(domain);
        if (loadedEnv) {
          this.currentTenantId = loadedEnv.tenantId;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to switch to tenant for domain ${domain}:`, error);
      return false;
    }
  }

  /**
   * Reset client connection
   */
  async reset(): Promise<void> {
    if (this.currentClient) {
      // Note: We don't disconnect here as the connection is managed by TenantDatabaseManager
      this.currentClient = null;
    }
    this.currentTenantId = null;
    this.currentDomain = null;
  }

  /**
   * Get current tenant information
   */
  getCurrentTenant(): {
    tenantId: string | null;
    domain: string | null;
    hasClient: boolean;
  } {
    return {
      tenantId: this.currentTenantId,
      domain: this.currentDomain,
      hasClient: !!this.currentClient
    };
  }

  /**
   * Health check for current connection
   */
  async healthCheck(): Promise<boolean> {
    if (!this.currentClient) {
      return false;
    }

    try {
      await this.currentClient.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Tenant Prisma client health check failed:', error);
      return false;
    }
  }
}

/**
 * Get tenant-aware Prisma client instance
 */
export const getTenantPrisma = (): TenantPrismaClient => {
  return TenantPrismaClient.getInstance();
};

/**
 * Get Prisma client for current tenant (convenience function)
 */
export const prisma = async (): Promise<PrismaClient | null> => {
  const tenantPrisma = getTenantPrisma();
  return await tenantPrisma.getClient();
};

/**
 * Hook for API routes to get tenant-aware Prisma client
 */
export const useTenantPrisma = async (headers: Headers): Promise<PrismaClient | null> => {
  const tenantDomain = headers.get('x-tenant-domain');
  
  if (!tenantDomain) {
    console.warn('No tenant domain found in headers');
    return null;
  }

  const tenantPrisma = getTenantPrisma();
  return await tenantPrisma.getClientForDomain(tenantDomain);
};

/**
 * Middleware function to ensure Prisma client is available for tenant
 */
export const withTenantPrisma = <T extends any[], R>(
  handler: (prisma: PrismaClient, ...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const client = await prisma();
    
    if (!client) {
      throw new Error('No tenant database connection available');
    }
    
    return handler(client, ...args);
  };
};

/**
 * Higher-order function for API route handlers that need tenant Prisma
 */
export const withTenantDatabase = (
  handler: (req: any, res: any, prisma: PrismaClient) => Promise<any>
) => {
  return async (req: any, res: any) => {
    try {
      // Get tenant from headers
      const tenantDomain = req.headers['x-tenant-domain'];
      
      if (!tenantDomain) {
        return res.status(400).json({
          error: 'Tenant required',
          message: 'No tenant domain found in request headers'
        });
      }

      // Get Prisma client for tenant
      const tenantPrisma = getTenantPrisma();
      const client = await tenantPrisma.getClientForDomain(tenantDomain);
      
      if (!client) {
        return res.status(500).json({
          error: 'Database connection failed',
          message: 'Could not establish database connection for tenant'
        });
      }

      // Call the handler with Prisma client
      return await handler(req, res, client);
    } catch (error) {
      console.error('Error in withTenantDatabase:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

/**
 * Transaction wrapper for tenant-aware operations
 */
export const tenantTransaction = async <T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> => {
  const client = await prisma();
  
  if (!client) {
    throw new Error('No tenant database connection available');
  }
  
  return await client.$transaction(async (tx) => {
    return await fn(tx as PrismaClient);
  });
};

/**
 * Utility to validate tenant database connection
 */
export const validateTenantConnection = async (domain: string): Promise<{
  isValid: boolean;
  error?: string;
  tenantId?: string;
}> => {
  try {
    const tenantPrisma = getTenantPrisma();
    const client = await tenantPrisma.getClientForDomain(domain);
    
    if (!client) {
      return {
        isValid: false,
        error: 'Could not establish database connection'
      };
    }

    // Test the connection
    await client.$queryRaw`SELECT 1`;
    
    // Get tenant ID from environment
    const loadedEnv = await TenantEnvLoader.loadEnvironmentForDomain(domain);
    
    return {
      isValid: true,
      tenantId: loadedEnv?.tenantId
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get database statistics for current tenant
 */
export const getTenantDatabaseStats = async (): Promise<{
  tableCount: number;
  userCount: number;
  pageCount: number;
  fileCount: number;
} | null> => {
  try {
    const client = await prisma();
    if (!client) return null;

    const [
      tableCount,
      userCount,
      pageCount,
      fileCount
    ] = await Promise.all([
      client.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()`,
      client.user.count(),
      client.page.count(),
      client.file.count()
    ]);

    return {
      tableCount: (tableCount as any)[0]?.count || 0,
      userCount,
      pageCount,
      fileCount
    };
  } catch (error) {
    console.error('Failed to get tenant database stats:', error);
    return null;
  }
};

/**
 * Initialize tenant Prisma system
 */
export const initializeTenantPrisma = async (): Promise<void> => {
  try {
    // Initialize domain tenant service
    await DomainTenantService.initialize();
    
    // Configure tenant database manager
    TenantDatabaseManager.configure({
      connectionTimeout: 30 * 60 * 1000, // 30 minutes
      maxConnections: 50,
      maxConnectionsPerTenant: 5
    });

    // Start cleanup task
    TenantDatabaseManager.startCleanupTask(10 * 60 * 1000); // 10 minutes

    console.log('✅ Tenant Prisma system initialized');
  } catch (error) {
    console.error('Failed to initialize tenant Prisma system:', error);
    throw error;
  }
};

export default TenantPrismaClient;
