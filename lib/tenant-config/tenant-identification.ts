import { NextRequest } from 'next/server';
import { TenantConfig } from './types';
import { TenantConfigManager } from './tenant-config-manager';

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  config: TenantConfig;
  user?: any;
}

export class TenantIdentificationService {
  private static configManager = TenantConfigManager.getInstance();

  /**
   * Extract tenant ID from subdomain
   * e.g., demo.yourapp.com → demo
   */
  static extractTenantFromSubdomain(host: string): string | null {
    try {
      const parts = host.split('.');
      
      // Handle localhost development
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        // For development, use a query parameter or default tenant
        return null; // Will fallback to other methods
      }
      
      // For production domains like tenant.yourapp.com
      if (parts.length >= 3) {
        const subdomain = parts[0];
        // Exclude common non-tenant subdomains
        if (!['www', 'api', 'admin', 'app', 'mail', 'ftp'].includes(subdomain)) {
          return subdomain;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting tenant from subdomain:', error);
      return null;
    }
  }

  /**
   * Extract tenant ID from custom domain
   */
  static async extractTenantFromDomain(host: string): Promise<string | null> {
    try {
      // Remove port number if present
      const domain = host.split(':')[0];
      
      // Check if this is a custom domain for any tenant
      const tenants = await this.configManager.listTenants();
      const tenant = tenants.find(t => t.domain === domain);
      
      return tenant?.id || null;
    } catch (error) {
      console.error('Error extracting tenant from domain:', error);
      return null;
    }
  }

  /**
   * Extract tenant ID from custom header
   * X-Tenant-ID: tenant-name
   */
  static extractTenantFromHeader(headers: Headers): string | null {
    return headers.get('x-tenant-id') || headers.get('X-Tenant-ID');
  }

  /**
   * Extract tenant ID from URL path
   * /tenant/tenant-name/... → tenant-name
   */
  static extractTenantFromPath(pathname: string): string | null {
    const match = pathname.match(/^\/tenant\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract tenant ID from query parameter
   * ?tenant=tenant-name
   */
  static extractTenantFromQuery(searchParams: URLSearchParams): string | null {
    return searchParams.get('tenant') || searchParams.get('t');
  }

  /**
   * Identify tenant using multiple strategies (in order of preference)
   */
  static async identifyTenant(request: NextRequest): Promise<string | null> {
    const host = request.headers.get('host') || '';
    const pathname = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;
    
    // Strategy 1: Check custom domain first
    let tenantId = await this.extractTenantFromDomain(host);
    if (tenantId) return tenantId;

    // Strategy 2: Check subdomain (primary method for multi-tenant subdomains)
    tenantId = this.extractTenantFromSubdomain(host);
    if (tenantId) return tenantId;

    // Strategy 3: Check custom header
    tenantId = this.extractTenantFromHeader(request.headers);
    if (tenantId) return tenantId;

    // Strategy 4: Check URL path (for API routes like /tenant/acme/api/...)
    tenantId = this.extractTenantFromPath(pathname);
    if (tenantId) return tenantId;

    // Strategy 5: Check query parameter (fallback for development/testing)
    tenantId = this.extractTenantFromQuery(searchParams);
    if (tenantId) return tenantId;

    return null;
  }

  /**
   * Get tenant configuration by ID
   */
  static async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    return await this.configManager.getTenantConfig(tenantId);
  }

  /**
   * Get tenant configuration by subdomain
   */
  static async getTenantBySubdomain(subdomain: string): Promise<TenantConfig | null> {
    return await this.configManager.getTenantBySubdomain(subdomain);
  }

  /**
   * Get tenant configuration by domain
   */
  static async getTenantByDomain(domain: string): Promise<TenantConfig | null> {
    return await this.configManager.getTenantByDomain(domain);
  }

  /**
   * Validate tenant access for the current user
   */
  static async validateTenantAccess(tenantId: string, userId?: string): Promise<boolean> {
    const config = await this.getTenantConfig(tenantId);
    if (!config) return false;

    // Check if tenant is active
    if (config.status !== 'active') return false;

    // Add your access validation logic here
    // For example, check if user is member of the tenant
    // This would involve checking user-tenant relationships
    
    return true;
  }

  /**
   * Create tenant context for the request
   */
  static async createTenantContext(
    tenantId: string, 
    user?: any
  ): Promise<TenantContext | null> {
    const config = await this.getTenantConfig(tenantId);
    if (!config) return null;

    return {
      tenantId,
      subdomain: config.subdomain,
      config,
      user
    };
  }

  /**
   * Get current tenant from NextRequest (for API routes)
   */
  static async getCurrentTenant(request: NextRequest): Promise<{ id: string; name: string; config: TenantConfig } | null> {
    const tenantId = await this.identifyTenant(request);

    if (!tenantId) {
      return null;
    }

    const config = await this.getTenantConfig(tenantId);
    if (!config) {
      return null;
    }

    return {
      id: tenantId,
      name: config.name,
      config
    };
  }

  /**
   * Identify tenant and return full context
   */
  static async identifyTenantWithContext(request: NextRequest): Promise<TenantContext | null> {
    const tenantId = await this.identifyTenant(request);
    if (!tenantId) return null;

    return await this.createTenantContext(tenantId);
  }

  /**
   * Check if a request should bypass tenant identification
   */
  static shouldBypassTenantIdentification(pathname: string): boolean {
    const bypassPaths = [
      '/api/health',
      '/api/system',
      '/api/admin/tenants', // Admin tenant management
      '/_next',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/.well-known'
    ];
    
    return bypassPaths.some(path => pathname.startsWith(path));
  }

  /**
   * Get tenant-specific database URL
   */
  static getTenantDatabaseUrl(config: TenantConfig): string {
    return config.database.url || this.generateDatabaseUrl(config.database);
  }

  /**
   * Generate database URL from config
   */
  private static generateDatabaseUrl(dbConfig: TenantConfig['database']): string {
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
   * Get tenant environment variables
   */
  static getTenantEnvironment(config: TenantConfig): Record<string, string> {
    return {
      ...config.environment,
      DATABASE_URL: this.getTenantDatabaseUrl(config),
      TENANT_ID: config.id,
      TENANT_NAME: config.name,
      TENANT_SUBDOMAIN: config.subdomain,
      JWT_SECRET: config.security.jwtSecret,
      ENCRYPTION_KEY: config.security.encryptionKey,
      SESSION_SECRET: config.security.sessionSecret
    };
  }
}

export default TenantIdentificationService;
