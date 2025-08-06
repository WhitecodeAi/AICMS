import { NextRequest } from 'next/server';
import { createTenantMiddleware } from './lib/middleware/tenant';

// Create the tenant middleware
const tenantMiddleware = createTenantMiddleware();

export async function middleware(request: NextRequest) {
  return tenantMiddleware(request);
}

export const config = {
  // Skip middleware for static files and API routes that don't need tenant context
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
     */
    '/((?!api/health|api/system|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
