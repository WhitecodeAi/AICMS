import { NextRequest } from 'next/server';
import { createDomainTenantMiddleware } from './lib/middleware/domain-tenant-middleware';

// Configure domain-based tenant middleware
const tenantMiddleware = createDomainTenantMiddleware({
  skipPaths: [
    '/api/health',
    '/api/system',
    '/api/admin/tenants',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/.well-known'
  ],
  requireTenant: false, // Don't require tenant for now to avoid blocking
  enableDevMode: process.env.NODE_ENV === 'development',
  fallbackDomain: 'demo.whitecodetech.com',
  enableLogging: process.env.NODE_ENV === 'development'
});

export function middleware(request: NextRequest) {
  return tenantMiddleware(request);
}

export const config = {
  // Skip middleware for static files and certain API routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check endpoints)
     * - api/system (system-level endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     * - .well-known (well-known URIs)
     */
    '/((?!api/health|api/system|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|\\.well-known).*)',
  ],
};
