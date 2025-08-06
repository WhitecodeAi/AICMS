import { NextRequest, NextResponse } from 'next/server';
import { 
  TenantIdentificationService,
  TenantContext,
  TenantConfig
} from '../tenant-config';

export interface TenantMiddlewareOptions {
  skipPaths?: string[];
  requireTenant?: boolean;
  fallbackTenant?: string;
  enableDevMode?: boolean;
}

/**
 * Middleware function for file-based tenant identification
 */
export function createTenantMiddleware(options: TenantMiddlewareOptions = {}) {
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
    fallbackTenant,
    enableDevMode = process.env.NODE_ENV === 'development'
  } = options;

  return async (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;
    
    // Skip tenant identification for certain paths
    if (TenantIdentificationService.shouldBypassTenantIdentification(pathname) || 
        skipPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Identify tenant using all available strategies
    const tenantId = await TenantIdentificationService.identifyTenant(request);
    
    // Handle missing tenant
    if (!tenantId) {
      // Try fallback tenant in development
      if (enableDevMode && fallbackTenant) {
        const fallbackConfig = await TenantIdentificationService.getTenantConfig(fallbackTenant);
        if (fallbackConfig) {
          return createTenantResponse(request, fallbackConfig, fallbackTenant);
        }
      }

      if (requireTenant) {
        // Handle missing tenant - redirect to tenant selection or show error
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
        
        // For web requests, redirect to tenant selection page or show error
        const url = new URL('/tenant-not-found', request.url);
        url.searchParams.set('host', request.headers.get('host') || '');
        url.searchParams.set('path', pathname);
        return NextResponse.redirect(url);
      }

      // Continue without tenant if not required
      return NextResponse.next();
    }

    // Get tenant configuration
    const config = await TenantIdentificationService.getTenantConfig(tenantId);
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
      
      const url = new URL('/tenant-not-found', request.url);
      url.searchParams.set('tenantId', tenantId);
      return NextResponse.redirect(url);
    }

    // Check tenant status
    if (config.status !== 'active') {
      const statusMessages = {
        suspended: 'This tenant has been suspended',
        pending: 'This tenant is pending activation',
        archived: 'This tenant has been archived'
      };

      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            error: 'Tenant unavailable',
            message: statusMessages[config.status] || 'Tenant is not active',
            status: config.status,
            code: 'TENANT_UNAVAILABLE'
          },
          { status: 403 }
        );
      }

      const url = new URL('/tenant-unavailable', request.url);
      url.searchParams.set('tenantId', tenantId);
      url.searchParams.set('status', config.status);
      return NextResponse.redirect(url);
    }

    return createTenantResponse(request, config, tenantId);
  };
}

/**
 * Create response with tenant information
 */
function createTenantResponse(
  request: NextRequest,
  config: TenantConfig,
  tenantId: string
): NextResponse {
  const response = NextResponse.next();
  
  // Add tenant information to headers for downstream processing
  response.headers.set('x-tenant-id', tenantId);
  response.headers.set('x-tenant-name', config.name);
  response.headers.set('x-tenant-subdomain', config.subdomain);
  response.headers.set('x-tenant-status', config.status);
  
  // Add tenant configuration (without sensitive data)
  const publicConfig = {
    id: config.id,
    name: config.name,
    subdomain: config.subdomain,
    domain: config.domain,
    status: config.status,
    features: config.features,
    limits: config.limits,
    branding: config.branding,
    seo: config.seo
  };
  response.headers.set('x-tenant-config', JSON.stringify(publicConfig));
  
  // Add tenant-specific environment variables (non-sensitive)
  const publicEnvVars = Object.entries(config.environment)
    .filter(([key]) => !key.toLowerCase().includes('secret') && 
                      !key.toLowerCase().includes('key') &&
                      !key.toLowerCase().includes('password'))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  Object.entries(publicEnvVars).forEach(([key, value]) => {
    response.headers.set(`x-tenant-env-${key.toLowerCase()}`, value);
  });

  // Add tenant features as headers
  Object.entries(config.features).forEach(([key, value]) => {
    response.headers.set(`x-tenant-feature-${key.toLowerCase()}`, value.toString());
  });

  // Add database URL for server-side usage (without credentials)
  const dbUrl = TenantIdentificationService.getTenantDatabaseUrl(config);
  const sanitizedDbUrl = dbUrl.replace(/:\/\/[^@]+@/, '://***:***@');
  response.headers.set('x-tenant-db-type', config.database.type);
  response.headers.set('x-tenant-db-name', config.database.database);

  return response;
}

/**
 * Hook to get tenant context in React components
 */
export function useTenantContext(): TenantContext | null {
  if (typeof window !== 'undefined') {
    // Client-side: get from headers or localStorage
    const tenantId = localStorage.getItem('currentTenantId');
    const tenantConfigStr = localStorage.getItem('currentTenantConfig');
    
    if (tenantId && tenantConfigStr) {
      try {
        const config = JSON.parse(tenantConfigStr);
        return {
          tenantId,
          subdomain: config.subdomain,
          config
        };
      } catch (error) {
        console.error('Error parsing tenant config from localStorage:', error);
        localStorage.removeItem('currentTenantId');
        localStorage.removeItem('currentTenantConfig');
      }
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
 * Get tenant context from request headers (for API routes)
 */
export function getTenantContext(request: Request): TenantContext | null {
  return getTenantFromHeaders(new Headers(request.headers));
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
export async function getCurrentTenant(request: NextRequest): Promise<{ 
  id: string; 
  name: string; 
  config: TenantConfig 
} | null> {
  const tenantId = await TenantIdentificationService.identifyTenant(request);

  if (!tenantId) {
    return null;
  }

  const config = await TenantIdentificationService.getTenantConfig(tenantId);
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
 * Get tenant database connection info from headers
 */
export function getTenantDatabaseInfo(headers: Headers): {
  type: string;
  database: string;
} | null {
  const dbType = headers.get('x-tenant-db-type');
  const dbName = headers.get('x-tenant-db-name');
  
  if (!dbType || !dbName) return null;
  
  return { type: dbType, database: dbName };
}

/**
 * Check if tenant has feature enabled
 */
export function tenantHasFeature(headers: Headers, feature: string): boolean {
  const featureValue = headers.get(`x-tenant-feature-${feature.toLowerCase()}`);
  return featureValue === 'true';
}

/**
 * Get tenant environment variable
 */
export function getTenantEnvVar(headers: Headers, key: string): string | null {
  return headers.get(`x-tenant-env-${key.toLowerCase()}`);
}

/**
 * Middleware for API routes that require tenant context
 */
export function withTenant<T extends any[]>(
  handler: (context: TenantContext, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const context = getTenantContext(request);
    
    if (!context) {
      return NextResponse.json(
        { 
          error: 'Tenant context not found',
          message: 'This API requires tenant context',
          code: 'TENANT_CONTEXT_REQUIRED'
        },
        { status: 400 }
      );
    }

    return handler(context, ...args);
  };
}

export default TenantIdentificationService;
