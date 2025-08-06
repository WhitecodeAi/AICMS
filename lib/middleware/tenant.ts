import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  config: TenantConfig;
  user?: any;
}

export interface TenantConfig {
  id: string;
  name: string;
  subdomain: string;
  database: {
    strategy: 'dedicated';
    connectionString: string;
    envFilePath: string;
  };
  features: {
    advancedEditor: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    maxUsers: number;
    customDomain?: boolean;
    sslEnabled?: boolean;
  };
  branding: {
    logo: string;
    primaryColor: string;
    customCSS?: string;
    favicon?: string;
    brandName?: string;
  };
  environment: {
    [key: string]: string;
  };
  limits: {
    maxPages: number;
    maxStorage: number; // in MB
    maxApiCalls: number; // per month
    maxUsers: number;
    maxFileSize: number; // in MB
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    sessionSecret: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Store for tenant configurations (in production, this would be loaded from files or database)
const tenantConfigs = new Map<string, TenantConfig>();

// Initialize with example tenant configs (these would be loaded from config files)
tenantConfigs.set('demo', {
  id: 'demo',
  name: 'Demo Company',
  subdomain: 'demo',
  database: {
    strategy: 'dedicated',
    connectionString: 'postgresql://tenant_demo:demo_password@localhost:5432/tenant_demo',
    envFilePath: 'config/tenants/demo.env'
  },
  features: {
    advancedEditor: true,
    customBranding: true,
    apiAccess: true,
    maxUsers: 25,
    customDomain: false,
    sslEnabled: true
  },
  branding: {
    logo: '/demo-logo.png',
    primaryColor: '#3b82f6',
    favicon: '/demo-favicon.ico',
    brandName: 'Demo CMS'
  },
  environment: {
    DEMO_MODE: 'true',
    FEATURE_FLAG_ADVANCED: 'enabled'
  },
  limits: {
    maxPages: 500,
    maxStorage: 2000, // 2GB
    maxApiCalls: 25000,
    maxUsers: 25,
    maxFileSize: 50 // 50MB
  },
  security: {
    jwtSecret: 'demo-jwt-secret-key',
    encryptionKey: 'demo-encryption-key',
    sessionSecret: 'demo-session-secret'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

tenantConfigs.set('acme', {
  id: 'acme',
  name: 'Acme Corporation',
  subdomain: 'acme',
  database: {
    strategy: 'dedicated',
    connectionString: 'postgresql://tenant_acme:acme_secure_password@localhost:5433/tenant_acme',
    envFilePath: 'config/tenants/acme.env'
  },
  features: {
    advancedEditor: true,
    customBranding: true,
    apiAccess: true,
    maxUsers: 100,
    customDomain: true,
    sslEnabled: true
  },
  branding: {
    logo: '/acme-logo.png',
    primaryColor: '#ef4444',
    customCSS: '.brand-header { background: linear-gradient(45deg, #ef4444, #f97316); }',
    favicon: '/acme-favicon.ico',
    brandName: 'Acme CMS'
  },
  environment: {
    ACME_API_KEY: 'acme-secret-api-key',
    ENTERPRISE_FEATURES: 'enabled',
    CUSTOM_DOMAIN: 'cms.acme.com'
  },
  limits: {
    maxPages: 5000,
    maxStorage: 20000, // 20GB
    maxApiCalls: 200000,
    maxUsers: 100,
    maxFileSize: 200 // 200MB
  },
  security: {
    jwtSecret: 'acme-enterprise-jwt-secret',
    encryptionKey: 'acme-enterprise-encryption-key',
    sessionSecret: 'acme-enterprise-session-secret'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export class TenantIdentificationService {
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
        return 'demo'; // Default for development
      }
      
      // For production domains like tenant.yourapp.com
      if (parts.length >= 3) {
        const subdomain = parts[0];
        // Exclude common non-tenant subdomains
        if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
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
   * Extract tenant ID from custom header
   * X-Tenant-ID: tenant-name
   */
  static extractTenantFromHeader(headers: Headers): string | null {
    return headers.get('x-tenant-id') || headers.get('X-Tenant-ID');
  }

  /**
   * Extract tenant ID from JWT token
   */
  static extractTenantFromToken(token: string): string | null {
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret) as any;
      return decoded.tenant || decoded.tenantId || null;
    } catch (error) {
      console.error('Error extracting tenant from token:', error);
      return null;
    }
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
   * Identify tenant using multiple strategies (in order of preference)
   */
  static identifyTenant(request: NextRequest): string | null {
    const host = request.headers.get('host') || '';
    const pathname = request.nextUrl.pathname;
    
    // Strategy 1: Check subdomain (primary method)
    let tenantId = this.extractTenantFromSubdomain(host);
    if (tenantId) return tenantId;

    // Strategy 2: Check custom header
    tenantId = this.extractTenantFromHeader(request.headers);
    if (tenantId) return tenantId;

    // Strategy 3: Check authorization token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      tenantId = this.extractTenantFromToken(token);
      if (tenantId) return tenantId;
    }

    // Strategy 4: Check URL path (for API routes)
    tenantId = this.extractTenantFromPath(pathname);
    if (tenantId) return tenantId;

    // Strategy 5: Check query parameter (fallback for development)
    tenantId = request.nextUrl.searchParams.get('tenant');
    if (tenantId) return tenantId;

    return null;
  }

  /**
   * Get tenant configuration
   */
  static async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    // In production, this would query a database or cache
    return tenantConfigs.get(tenantId) || null;
  }

  /**
   * Validate tenant access for the current user
   */
  static async validateTenantAccess(tenantId: string, userId?: string): Promise<boolean> {
    // In production, check if user has access to this tenant
    // This could involve checking user-tenant relationships in the database
    
    const config = await this.getTenantConfig(tenantId);
    if (!config) return false;

    // Add your access validation logic here
    // For example, check if user is member of the tenant
    
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
}

/**
 * Middleware function for tenant identification
 */
export function createTenantMiddleware() {
  return async (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;
    
    // Skip tenant identification for certain paths
    const skipPaths = [
      '/api/health',
      '/api/system',
      '/_next',
      '/favicon.ico',
      '/robots.txt'
    ];
    
    if (skipPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Identify tenant
    const tenantId = TenantIdentificationService.identifyTenant(request);
    
    if (!tenantId) {
      // Handle missing tenant - redirect to tenant selection or show error
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Tenant not specified' },
          { status: 400 }
        );
      }
      
      // For web requests, redirect to tenant selection page
      return NextResponse.redirect(new URL('/select-tenant', request.url));
    }

    // Validate tenant exists
    const config = await TenantIdentificationService.getTenantConfig(tenantId);
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 404 }
      );
    }

    // Create response with tenant headers
    const response = NextResponse.next();
    
    // Add tenant information to headers for downstream processing
    response.headers.set('x-tenant-id', tenantId);
    response.headers.set('x-tenant-name', config.name);
    response.headers.set('x-tenant-config', JSON.stringify(config));
    
    // Add tenant-specific environment variables
    Object.entries(config.environment).forEach(([key, value]) => {
      response.headers.set(`x-tenant-env-${key.toLowerCase()}`, value);
    });

    return response;
  };
}

/**
 * Hook to get tenant context in React components
 */
export function useTenantContext(): TenantContext | null {
  // This would be implemented using React Context or a state management library
  // For now, return null - implement based on your state management choice
  
  if (typeof window !== 'undefined') {
    // Client-side: get from headers or localStorage
    const tenantId = localStorage.getItem('currentTenantId');
    const tenantConfig = localStorage.getItem('currentTenantConfig');
    
    if (tenantId && tenantConfig) {
      return {
        tenantId,
        subdomain: tenantId,
        config: JSON.parse(tenantConfig)
      };
    }
  }
  
  return null;
}

/**
 * Server-side function to get tenant context from headers
 */
export function getTenantFromHeaders(headers: Headers): TenantContext | null {
  const tenantId = headers.get('x-tenant-id');
  const tenantConfigStr = headers.get('x-tenant-config');
  
  if (!tenantId || !tenantConfigStr) return null;
  
  try {
    const config = JSON.parse(tenantConfigStr);
    return {
      tenantId,
      subdomain: config.subdomain,
      config
    };
  } catch (error) {
    console.error('Error parsing tenant config from headers:', error);
    return null;
  }
}

/**
 * Utility to set tenant in localStorage (client-side)
 */
export function setCurrentTenant(context: TenantContext): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentTenantId', context.tenantId);
    localStorage.setItem('currentTenantConfig', JSON.stringify(context.config));
  }
}

/**
 * Get current tenant from NextRequest (for API routes)
 */
export async function getCurrentTenant(request: NextRequest): Promise<{ id: string; name: string } | null> {
  const tenantId = TenantIdentificationService.identifyTenant(request);

  if (!tenantId) {
    return null;
  }

  const config = await TenantIdentificationService.getTenantConfig(tenantId);
  if (!config) {
    return null;
  }

  return {
    id: tenantId,
    name: config.name
  };
}

export default TenantIdentificationService;
