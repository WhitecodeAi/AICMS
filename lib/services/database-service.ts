import { PrismaClient } from '@prisma/client';
import { TenantConfig } from '../middleware/tenant';
import fs from 'fs/promises';
import path from 'path';

// Connection pool for tenant databases
const connectionPool = new Map<string, PrismaClient>();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  charset?: string;
}

export class DatabaseService {
  /**
   * Get database connection for a specific tenant (dedicated only)
   */
  static async getConnection(tenantConfig: TenantConfig): Promise<PrismaClient> {
    const { id: tenantId } = tenantConfig;

    // Load tenant-specific environment variables
    await this.loadTenantEnv(tenantId);

    // Get connection string from tenant-specific env
    const connectionString = process.env[`TENANT_${tenantId.toUpperCase()}_DATABASE_URL`];

    if (!connectionString) {
      throw new Error(`Database connection string not found for tenant: ${tenantId}`);
    }

    return this.getDedicatedConnection(tenantId, connectionString);
  }

  /**
   * Load tenant-specific environment variables
   */
  static async loadTenantEnv(tenantId: string): Promise<void> {
    try {
      const envPath = path.join(process.cwd(), 'config', 'tenants', `${tenantId}.env`);
      const envContent = await fs.readFile(envPath, 'utf-8');

      // Parse and set environment variables
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          if (key && value) {
            process.env[key] = value;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load environment for tenant ${tenantId}:`, error);
      throw new Error(`Tenant environment configuration not found: ${tenantId}`);
    }
  }

  /**
   * Get dedicated database connection for a tenant
   */
  static getDedicatedConnection(tenantId: string, connectionString: string): PrismaClient {
    if (!connectionPool.has(tenantId)) {
      const client = new PrismaClient({
        datasources: {
          db: {
            url: connectionString
          }
        }
      });

      connectionPool.set(tenantId, client);
    }

    return connectionPool.get(tenantId)!;
  }

  /**
   * Create a new tenant database (MySQL)
   */
  static async createTenantDatabase(
    tenantId: string,
    config: DatabaseConfig
  ): Promise<boolean> {
    try {
      // Create database connection to the MySQL system database
      const systemClient = new PrismaClient({
        datasources: {
          db: {
            url: `mysql://${config.username}:${config.password}@${config.host}:${config.port}/mysql`
          }
        }
      });

      // Create the tenant database with proper charset
      await systemClient.$executeRawUnsafe(
        `CREATE DATABASE \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );

      // Create or grant privileges to the tenant user
      await systemClient.$executeRawUnsafe(
        `CREATE USER IF NOT EXISTS '${config.username}'@'%' IDENTIFIED BY '${config.password}'`
      );

      await systemClient.$executeRawUnsafe(
        `GRANT ALL PRIVILEGES ON \`${config.database}\`.* TO '${config.username}'@'%'`
      );

      await systemClient.$executeRawUnsafe(`FLUSH PRIVILEGES`);

      await systemClient.$disconnect();

      // Run migrations on the new database
      await this.runMigrations(tenantId,
        `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
      );

      return true;
    } catch (error) {
      console.error(`Failed to create database for tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Run database migrations for a tenant (MySQL)
   */
  static async runMigrations(tenantId: string, connectionString: string): Promise<boolean> {
    try {
      // In a real implementation, you would run Prisma migrations
      // This is a simplified example for MySQL
      const client = new PrismaClient({
        datasources: {
          db: {
            url: connectionString
          }
        }
      });

      // Apply schema - in production, use Prisma migrations
      await client.$executeRaw`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(191) PRIMARY KEY,
          email VARCHAR(191) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password VARCHAR(255),
          role ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'USER') DEFAULT 'USER',
          is_active BOOLEAN DEFAULT TRUE,
          last_login DATETIME NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await client.$executeRaw`
        CREATE TABLE IF NOT EXISTS pages (
          id VARCHAR(191) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          data JSON,
          html LONGTEXT,
          css LONGTEXT,
          js LONGTEXT,
          builder_type ENUM('PUCK', 'GRAPESJS', 'HTML') NOT NULL,
          is_published BOOLEAN DEFAULT FALSE,
          published_at DATETIME NULL,
          meta_title VARCHAR(255),
          meta_description TEXT,
          author_id VARCHAR(191) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_slug (slug),
          INDEX idx_published (is_published),
          INDEX idx_author (author_id),
          FOREIGN KEY (author_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await client.$executeRaw`
        CREATE TABLE IF NOT EXISTS files (
          id VARCHAR(191) PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          mime_type VARCHAR(127) NOT NULL,
          size INT NOT NULL,
          url VARCHAR(500) NOT NULL,
          alt VARCHAR(255),
          uploaded_by_id VARCHAR(191) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_mime_type (mime_type),
          INDEX idx_uploaded_by (uploaded_by_id),
          FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await client.$executeRaw`
        CREATE TABLE IF NOT EXISTS menus (
          id VARCHAR(191) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          items JSON,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await client.$executeRaw`
        CREATE TABLE IF NOT EXISTS settings (
          id VARCHAR(191) PRIMARY KEY,
          \`key\` VARCHAR(255) NOT NULL,
          value TEXT NOT NULL,
          type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING',
          is_public BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_key (\`key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await client.$disconnect();
      return true;
    } catch (error) {
      console.error(`Failed to run migrations for tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Delete tenant database (MySQL)
   */
  static async deleteTenantDatabase(
    tenantId: string,
    config: DatabaseConfig
  ): Promise<boolean> {
    try {
      // Disconnect existing connection
      if (connectionPool.has(tenantId)) {
        await connectionPool.get(tenantId)!.$disconnect();
        connectionPool.delete(tenantId);
      }

      // Create system connection
      const systemClient = new PrismaClient({
        datasources: {
          db: {
            url: `mysql://${config.username}:${config.password}@${config.host}:${config.port}/mysql`
          }
        }
      });

      // Drop database and remove user
      await systemClient.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS \`${config.database}\``
      );

      await systemClient.$executeRawUnsafe(
        `DROP USER IF EXISTS '${config.username}'@'%'`
      );

      await systemClient.$executeRawUnsafe(`FLUSH PRIVILEGES`);

      await systemClient.$disconnect();
      return true;
    } catch (error) {
      console.error(`Failed to delete database for tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Get current tenant ID from context
   * This should be implemented based on your context management strategy
   */
  private static getCurrentTenantId(): string | null {
    // In a real implementation, this would get the tenant ID from:
    // - Request context (Express middleware)
    // - Async local storage
    // - Thread-local storage
    // - Request headers
    
    // For now, return null - implement based on your context strategy
    return process.env.CURRENT_TENANT_ID || null;
  }

  /**
   * Set current tenant ID in context
   */
  static setCurrentTenantId(tenantId: string): void {
    // In a real implementation, this would set the tenant ID in your context
    process.env.CURRENT_TENANT_ID = tenantId;
  }

  /**
   * Clear current tenant ID from context
   */
  static clearCurrentTenantId(): void {
    delete process.env.CURRENT_TENANT_ID;
  }

  /**
   * Health check for tenant database
   */
  static async healthCheck(tenantConfig: TenantConfig): Promise<boolean> {
    try {
      const db = await this.getConnection(tenantConfig);
      await db.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error(`Health check failed for tenant ${tenantConfig.id}:`, error);
      return false;
    }
  }

  /**
   * Create tenant environment file with database credentials
   */
  static async createTenantEnvFile(
    tenantId: string,
    config: DatabaseConfig,
    additionalEnvVars: Record<string, string> = {}
  ): Promise<void> {
    const envDir = path.join(process.cwd(), 'config', 'tenants');
    await fs.mkdir(envDir, { recursive: true });

    const envPath = path.join(envDir, `${tenantId}.env`);

    const connectionString = `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${config.ssl ? '?ssl=true' : ''}`;

    const envContent = `# Environment variables for tenant: ${tenantId}
# Generated on: ${new Date().toISOString()}

# MySQL Database Configuration
TENANT_${tenantId.toUpperCase()}_DATABASE_URL="${connectionString}"
TENANT_${tenantId.toUpperCase()}_DB_HOST="${config.host}"
TENANT_${tenantId.toUpperCase()}_DB_PORT="${config.port}"
TENANT_${tenantId.toUpperCase()}_DB_NAME="${config.database}"
TENANT_${tenantId.toUpperCase()}_DB_USER="${config.username}"
TENANT_${tenantId.toUpperCase()}_DB_PASSWORD="${config.password}"
TENANT_${tenantId.toUpperCase()}_DB_CHARSET="${config.charset || 'utf8mb4'}"

# Tenant Configuration
TENANT_ID="${tenantId}"
TENANT_NAME="${tenantId}"

# Additional Environment Variables
${Object.entries(additionalEnvVars)
  .map(([key, value]) => `${key}="${value}"`)
  .join('\n')}

# Security Keys (generate unique per tenant)
TENANT_${tenantId.toUpperCase()}_JWT_SECRET="${this.generateSecureKey()}"
TENANT_${tenantId.toUpperCase()}_ENCRYPTION_KEY="${this.generateSecureKey()}"
TENANT_${tenantId.toUpperCase()}_SESSION_SECRET="${this.generateSecureKey()}"
`;

    await fs.writeFile(envPath, envContent);
    console.log(`✅ Created environment file for tenant: ${envPath}`);
  }

  /**
   * Update tenant environment file
   */
  static async updateTenantEnvFile(
    tenantId: string,
    updates: Record<string, string>
  ): Promise<void> {
    const envPath = path.join(process.cwd(), 'config', 'tenants', `${tenantId}.env`);

    try {
      let envContent = await fs.readFile(envPath, 'utf-8');

      // Update existing variables or add new ones
      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}="${value}"`);
        } else {
          envContent += `\n${key}="${value}"`;
        }
      }

      await fs.writeFile(envPath, envContent);
      console.log(`✅ Updated environment file for tenant: ${tenantId}`);
    } catch (error) {
      console.error(`Failed to update env file for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Delete tenant environment file
   */
  static async deleteTenantEnvFile(tenantId: string): Promise<void> {
    try {
      const envPath = path.join(process.cwd(), 'config', 'tenants', `${tenantId}.env`);
      await fs.unlink(envPath);
      console.log(`✅ Deleted environment file for tenant: ${tenantId}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to delete env file for tenant ${tenantId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Generate secure random key
   */
  private static generateSecureKey(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Close all database connections
   */
  static async closeAllConnections(): Promise<void> {
    // Close all tenant connections
    for (const [tenantId, client] of connectionPool.entries()) {
      await client.$disconnect();
      connectionPool.delete(tenantId);
    }
  }

  /**
   * Get connection statistics
   */
  static getConnectionStats(): {
    tenantConnections: number;
    tenantIds: string[];
  } {
    return {
      tenantConnections: connectionPool.size,
      tenantIds: Array.from(connectionPool.keys())
    };
  }
}

/**
 * Tenant-aware Prisma client wrapper
 */
export class TenantPrismaClient {
  private client: PrismaClient;
  private tenantId: string;

  constructor(client: PrismaClient, tenantId: string) {
    this.client = client;
    this.tenantId = tenantId;
  }

  // Proxy all Prisma methods with tenant context
  get user() {
    return this.client.user;
  }

  get page() {
    return this.client.page;
  }

  // Add more model proxies as needed

  async $disconnect() {
    return this.client.$disconnect();
  }

  async $queryRaw(query: any, ...args: any[]) {
    return this.client.$queryRaw(query, ...args);
  }

  async $executeRaw(query: any, ...args: any[]) {
    return this.client.$executeRaw(query, ...args);
  }

  async $transaction(fn: any) {
    return this.client.$transaction(fn);
  }
}

/**
 * Factory function to create tenant-aware database client
 */
export async function createTenantClient(tenantConfig: TenantConfig): Promise<TenantPrismaClient> {
  const client = await DatabaseService.getConnection(tenantConfig);
  return new TenantPrismaClient(client, tenantConfig.id);
}

export default DatabaseService;
