import { NextRequest } from 'next/server';
import { createTenantMiddleware } from './lib/middleware/tenant-new';

// Configure tenant middleware with file-based system
const tenantMiddleware = createTenantMiddleware({
  skipPaths: [
    '/api/health',
    '/api/system',
    '/api/admin/tenants',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/.well-known',
    '/tenant-not-found',
    '/tenant-unavailable'
  ],
  requireTenant: true,
  fallbackTenant: 'demo', // Fallback to demo tenant in development
  enableDevMode: process.env.NODE_ENV === 'development'
});

export async function middleware(request: NextRequest) {
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
