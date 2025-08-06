import { NextRequest, NextResponse } from 'next/server';
import DomainTenantService, { DomainTenantMapping } from '../tenant-config/domain-tenant-service';
import TenantEnvLoader from '../tenant-config/env-loader';

export interface DomainTenantMiddlewareOptions {
  skipPaths?: string[];
  requireTenant?: boolean;
  enableDevMode?: boolean;
  fallbackDomain?: string;
  enableLogging?: boolean;
}

/**
 * Domain-based tenant middleware for Next.js
 * Identifies tenants based on domain and loads appropriate environment
 */
export class DomainTenantMiddleware {
  private options: DomainTenantMiddlewareOptions;

  constructor(options: DomainTenantMiddlewareOptions = {}) {
    this.options = {
      skipPaths: [
        '/api/health',
        '/api/system',
        '/_next',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
        '/.well-known'
      ],
      requireTenant: false,
      enableDevMode: process.env.NODE_ENV === 'development',
      enableLogging: process.env.NODE_ENV === 'development',
      ...options
    };
  }

  /**
   * Main middleware function
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    const pathname = request.nextUrl.pathname;
    const host = request.headers.get('host') || '';

    // Log request if enabled
    if (this.options.enableLogging) {
      console.log(`🌐 [Domain Middleware] ${request.method} ${pathname} - Host: ${host}`);
    }

    // Skip tenant identification for certain paths
    if (this.shouldSkipTenantIdentification(pathname)) {
      if (this.options.enableLogging) {
        console.log(`⏭️ [Domain Middleware] Skipping tenant identification for: ${pathname}`);
      }
      return NextResponse.next();
    }

    try {
      // Identify tenant from domain
      const tenantInfo = await DomainTenantService.getTenantFromRequest(request);

      if (!tenantInfo) {
        return this.handleMissingTenant(request, host, pathname);
      }

      // Validate tenant environment
      const validation = DomainTenantService.validateTenantEnv(tenantInfo.envConfig);
      if (!validation.isValid) {
        console.error(`❌ [Domain Middleware] Invalid tenant configuration for ${host}:`, validation.missingFields);
        return this.handleInvalidTenant(request, host, pathname, validation.missingFields);
      }

      // Create response with tenant information
      return this.createTenantResponse(request, tenantInfo);

    } catch (error) {
      console.error(`❌ [Domain Middleware] Error processing request for ${host}:`, error);
      return this.handleTenantError(request, host, pathname, error as Error);
    }
  }

  /**
   * Handle missing tenant
   */
  private async handleMissingTenant(request: NextRequest, host: string, pathname: string): Promise<NextResponse> {
    if (this.options.enableLogging) {
      console.warn(`⚠️ [Domain Middleware] No tenant found for domain: ${host}`);
    }

    // Try fallback in development mode
    if (this.options.enableDevMode && this.options.fallbackDomain) {
      const fallbackInfo = await DomainTenantService.getTenantFromRequest({
        ...request,
        headers: new Headers([...request.headers.entries(), ['host', this.options.fallbackDomain]])
      } as NextRequest);

      if (fallbackInfo) {
        if (this.options.enableLogging) {
          console.log(`🔄 [Domain Middleware] Using fallback domain: ${this.options.fallbackDomain}`);
        }
        return this.createTenantResponse(request, fallbackInfo);
      }
    }

    // Handle based on request type
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Tenant not found',
          message: `No tenant configuration found for domain: ${host}`,
          code: 'TENANT_NOT_FOUND',
          domain: host
        },
        { status: 404 }
      );
    }

    // For web requests, redirect to error page or continue without tenant
    if (this.options.requireTenant) {
      return NextResponse.redirect(new URL(`/?error=tenant-not-found&domain=${encodeURIComponent(host)}`, request.url));
    }

    return NextResponse.next();
  }

  /**
   * Handle invalid tenant configuration
   */
  private handleInvalidTenant(
    request: NextRequest,
    host: string,
    pathname: string,
    missingFields: string[]
  ): NextResponse {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Invalid tenant configuration',
          message: `Tenant configuration is missing required fields: ${missingFields.join(', ')}`,
          code: 'TENANT_CONFIG_INVALID',
          domain: host,
          missingFields
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL(`/?error=tenant-config-invalid&domain=${encodeURIComponent(host)}`, request.url));
  }

  /**
   * Handle tenant processing errors
   */
  private handleTenantError(request: NextRequest, host: string, pathname: string, error: Error): NextResponse {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Tenant processing error',
          message: error.message,
          code: 'TENANT_ERROR',
          domain: host
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL(`/?error=tenant-error&domain=${encodeURIComponent(host)}`, request.url));
  }

  /**
   * Create response with tenant information
   */
  private createTenantResponse(
    request: NextRequest,
    tenantInfo: {
      domain: string;
      mapping: DomainTenantMapping;
      envConfig: any;
      tenantId: string;
    }
  ): NextResponse {
    const response = NextResponse.next();

    // Add tenant headers for downstream processing
    response.headers.set('x-tenant-id', tenantInfo.tenantId);
    response.headers.set('x-tenant-domain', tenantInfo.domain);
    response.headers.set('x-tenant-type', tenantInfo.mapping.tenantType);
    response.headers.set('x-tenant-env-file', tenantInfo.mapping.envFile);
    response.headers.set('x-tenant-active', tenantInfo.mapping.isActive.toString());

    // Add database information (without sensitive data)
    if (tenantInfo.envConfig.DATABASE_URL) {
      const dbUrl = tenantInfo.envConfig.DATABASE_URL;
      const maskedUrl = dbUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
      response.headers.set('x-tenant-database', maskedUrl);
    }

    // Add tenant configuration (public data only)
    const publicConfig = {
      tenantId: tenantInfo.tenantId,
      domain: tenantInfo.domain,
      type: tenantInfo.mapping.tenantType,
      envFile: tenantInfo.mapping.envFile,
      isActive: tenantInfo.mapping.isActive
    };
    response.headers.set('x-tenant-config', JSON.stringify(publicConfig));

    if (this.options.enableLogging) {
      console.log(`✅ [Domain Middleware] Tenant identified: ${tenantInfo.tenantId} (${tenantInfo.mapping.tenantType}) - ${tenantInfo.domain}`);
    }

    return response;
  }

  /**
   * Check if request should skip tenant identification
   */
  private shouldSkipTenantIdentification(pathname: string): boolean {
    return this.options.skipPaths?.some(path => pathname.startsWith(path)) || false;
  }
}

/**
 * Create domain-based tenant middleware
 */
export function createDomainTenantMiddleware(options: DomainTenantMiddlewareOptions = {}) {
  const middleware = new DomainTenantMiddleware(options);
  
  return async (request: NextRequest) => {
    return middleware.handle(request);
  };
}

/**
 * Helper function to get tenant information from request headers
 */
export function getTenantFromHeaders(headers: Headers): {
  tenantId: string;
  domain: string;
  type: string;
  envFile: string;
  isActive: boolean;
  config?: any;
} | null {
  const tenantId = headers.get('x-tenant-id');
  const domain = headers.get('x-tenant-domain');
  const type = headers.get('x-tenant-type');
  const envFile = headers.get('x-tenant-env-file');
  const isActive = headers.get('x-tenant-active');
  const configStr = headers.get('x-tenant-config');

  if (!tenantId || !domain || !type || !envFile) {
    return null;
  }

  let config = undefined;
  if (configStr) {
    try {
      config = JSON.parse(configStr);
    } catch (error) {
      console.warn('Failed to parse tenant config from headers:', error);
    }
  }

  return {
    tenantId,
    domain,
    type,
    envFile,
    isActive: isActive === 'true',
    config
  };
}

/**
 * Helper function to check if request is for admin or website
 */
export function isAdminRequest(headers: Headers): boolean {
  const tenantType = headers.get('x-tenant-type');
  return tenantType === 'admin';
}

/**
 * Helper function to check if request is for website
 */
export function isWebsiteRequest(headers: Headers): boolean {
  const tenantType = headers.get('x-tenant-type');
  return tenantType === 'website';
}

/**
 * Middleware for API routes to ensure tenant context
 */
export function requireTenant(handler: (request: NextRequest, tenant: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const tenant = getTenantFromHeaders(request.headers);
    
    if (!tenant) {
      return NextResponse.json(
        {
          error: 'Tenant required',
          message: 'This endpoint requires tenant identification',
          code: 'TENANT_REQUIRED'
        },
        { status: 400 }
      );
    }

    return handler(request, tenant);
  };
}

/**
 * Middleware for API routes that only work with admin tenants
 */
export function requireAdminTenant(handler: (request: NextRequest, tenant: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const tenant = getTenantFromHeaders(request.headers);
    
    if (!tenant) {
      return NextResponse.json(
        {
          error: 'Tenant required',
          message: 'This endpoint requires tenant identification',
          code: 'TENANT_REQUIRED'
        },
        { status: 400 }
      );
    }

    if (tenant.type !== 'admin') {
      return NextResponse.json(
        {
          error: 'Admin tenant required',
          message: 'This endpoint is only available for admin tenants',
          code: 'ADMIN_TENANT_REQUIRED'
        },
        { status: 403 }
      );
    }

    return handler(request, tenant);
  };
}

export default DomainTenantMiddleware;
