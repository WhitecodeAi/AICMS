import { NextRequest, NextResponse } from 'next/server';

// Simple tenant configuration for Edge Runtime
interface EdgeTenantConfig {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  status: 'active' | 'suspended' | 'pending' | 'archived';
}

// Hardcoded tenant configurations for Edge Runtime
// In production, this could be loaded from a CDN or external API
const EDGE_TENANT_CONFIGS: EdgeTenantConfig[] = [
  {
    id: 'demo',
    name: 'Demo Company',
    subdomain: 'demo',
    status: 'active'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Corp',
    subdomain: 'enterprise',
    domain: 'cms.enterprise.com',
    status: 'active'
  }
];

export interface TenantMiddlewareOptions {
  skipPaths?: string[];
  requireTenant?: boolean;
  fallbackTenant?: string;
  enableDevMode?: boolean;
}

/**
 * Edge Runtime compatible tenant identification
 */
export class EdgeTenantIdentification {
  /**
   * Extract tenant ID from subdomain
   */
  static extractTenantFromSubdomain(host: string): string | null {
    try {
      const parts = host.split('.');
      
      // Handle localhost development
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
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
  static extractTenantFromDomain(host: string): string | null {
    try {
      // Remove port number if present
      const domain = host.split(':')[0];
      
      // Check if this is a custom domain for any tenant
      const tenant = EDGE_TENANT_CONFIGS.find(t => t.domain === domain);
      return tenant?.id || null;
    } catch (error) {
      console.error('Error extracting tenant from domain:', error);
      return null;
    }
  }

  /**
   * Extract tenant ID from custom header
   */
  static extractTenantFromHeader(headers: Headers): string | null {
    return headers.get('x-tenant-id') || headers.get('X-Tenant-ID');
  }

  /**
   * Extract tenant ID from URL path
   */
  static extractTenantFromPath(pathname: string): string | null {
    const match = pathname.match(/^\/tenant\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract tenant ID from query parameter
   */
  static extractTenantFromQuery(searchParams: URLSearchParams): string | null {
    return searchParams.get('tenant') || searchParams.get('t');
  }

  /**
   * Identify tenant using multiple strategies
   */
  static identifyTenant(request: NextRequest): string | null {
    const host = request.headers.get('host') || '';
    const pathname = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;
    
    // Strategy 1: Check custom domain first
    let tenantId = this.extractTenantFromDomain(host);
    if (tenantId && this.getTenantConfig(tenantId)) return tenantId;

    // Strategy 2: Check subdomain
    tenantId = this.extractTenantFromSubdomain(host);
    if (tenantId && this.getTenantConfig(tenantId)) return tenantId;

    // Strategy 3: Check custom header
    tenantId = this.extractTenantFromHeader(request.headers);
    if (tenantId && this.getTenantConfig(tenantId)) return tenantId;

    // Strategy 4: Check URL path
    tenantId = this.extractTenantFromPath(pathname);
    if (tenantId && this.getTenantConfig(tenantId)) return tenantId;

    // Strategy 5: Check query parameter
    tenantId = this.extractTenantFromQuery(searchParams);
    if (tenantId && this.getTenantConfig(tenantId)) return tenantId;

    return null;
  }

  /**
   * Get tenant configuration (Edge Runtime compatible)
   */
  static getTenantConfig(tenantId: string): EdgeTenantConfig | null {
    return EDGE_TENANT_CONFIGS.find(t => t.id === tenantId) || null;
  }

  /**
   * Check if tenant exists by subdomain
   */
  static getTenantBySubdomain(subdomain: string): EdgeTenantConfig | null {
    return EDGE_TENANT_CONFIGS.find(t => t.subdomain === subdomain) || null;
  }

  /**
   * Check if tenant exists by domain
   */
  static getTenantByDomain(domain: string): EdgeTenantConfig | null {
    return EDGE_TENANT_CONFIGS.find(t => t.domain === domain) || null;
  }
}

/**
 * Create tenant middleware for Edge Runtime
 */
export function createEdgeTenantMiddleware(options: TenantMiddlewareOptions = {}) {
  const {
    skipPaths = [
      '/api/health',
      '/api/system',
      '/api/admin/tenants',
      '/_next',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/.well-known'
    ],
    requireTenant = true,
    fallbackTenant = 'demo',
    enableDevMode = process.env.NODE_ENV === 'development'
  } = options;

  return (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;
    
    // Skip tenant identification for certain paths
    if (shouldBypassTenantIdentification(pathname) || 
        skipPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Identify tenant
    const tenantId = EdgeTenantIdentification.identifyTenant(request);
    
    // Handle missing tenant
    if (!tenantId) {
      // Try fallback tenant in development
      if (enableDevMode && fallbackTenant) {
        const fallbackConfig = EdgeTenantIdentification.getTenantConfig(fallbackTenant);
        if (fallbackConfig) {
          return createTenantResponse(request, fallbackConfig, fallbackTenant);
        }
      }

      if (requireTenant) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { 
              error: 'Tenant not specified',
              message: 'Please specify a tenant using subdomain, domain, or query parameter',
              code: 'TENANT_REQUIRED'
            },
            { status: 400 }
          );
        }
        
        // For web requests, add tenant parameter and continue
        const url = new URL(request.url);
        if (fallbackTenant && enableDevMode) {
          url.searchParams.set('tenant', fallbackTenant);
          return NextResponse.redirect(url);
        }
        
        // Redirect to a tenant selection page or homepage
        return NextResponse.redirect(new URL('/?error=tenant-required', request.url));
      }

      return NextResponse.next();
    }

    // Get tenant configuration
    const config = EdgeTenantIdentification.getTenantConfig(tenantId);
    if (!config) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            error: 'Invalid tenant',
            message: `Tenant '${tenantId}' not found`,
            code: 'TENANT_NOT_FOUND'
          },
          { status: 404 }
        );
      }
      
      return NextResponse.redirect(new URL('/?error=tenant-not-found', request.url));
    }

    // Check tenant status
    if (config.status !== 'active') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            error: 'Tenant unavailable',
            message: `Tenant is ${config.status}`,
            status: config.status,
            code: 'TENANT_UNAVAILABLE'
          },
          { status: 403 }
        );
      }

      return NextResponse.redirect(new URL(`/?error=tenant-${config.status}`, request.url));
    }

    return createTenantResponse(request, config, tenantId);
  };
}

/**
 * Create response with tenant information
 */
function createTenantResponse(
  request: NextRequest,
  config: EdgeTenantConfig,
  tenantId: string
): NextResponse {
  const response = NextResponse.next();
  
  // Add tenant information to headers for downstream processing
  response.headers.set('x-tenant-id', tenantId);
  response.headers.set('x-tenant-name', config.name);
  response.headers.set('x-tenant-subdomain', config.subdomain);
  response.headers.set('x-tenant-status', config.status);
  
  // Add basic tenant configuration
  const publicConfig = {
    id: config.id,
    name: config.name,
    subdomain: config.subdomain,
    domain: config.domain,
    status: config.status
  };
  response.headers.set('x-tenant-config', JSON.stringify(publicConfig));

  return response;
}

/**
 * Check if a request should bypass tenant identification
 */
function shouldBypassTenantIdentification(pathname: string): boolean {
  const bypassPaths = [
    '/api/health',
    '/api/system',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/.well-known'
  ];
  
  return bypassPaths.some(path => pathname.startsWith(path));
}

/**
 * Get tenant context from headers (for API routes)
 */
export function getTenantFromHeaders(headers: Headers): { id: string; name: string } | null {
  const tenantId = headers.get('x-tenant-id');
  const tenantName = headers.get('x-tenant-name');
  
  if (!tenantId || !tenantName) return null;
  
  return { id: tenantId, name: tenantName };
}

export default EdgeTenantIdentification;
