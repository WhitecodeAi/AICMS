# Multi-Tenant Implementation Checklist (Dedicated Database Strategy)

## Phase 1: Planning and Setup ✅

### Architecture Decisions
- [x] Choose tenant identification strategy (subdomain recommended)
- [x] Choose database strategy (dedicated databases only)
- [x] Plan tenant configuration structure with env files
- [x] Design security and isolation requirements

### Development Environment
- [ ] Install required dependencies
- [ ] Set up MySQL 8.0 server for tenant databases
- [ ] Configure tenant environment files structure
- [ ] Test basic tenant identification

## Phase 2: Core Implementation

### Database Setup
- [ ] Create Prisma schema without tenant_id fields
- [ ] Set up dedicated database creation scripts
- [ ] Implement environment file management
- [ ] Create database connection pooling for dedicated DBs

### Middleware Implementation
- [ ] Install tenant identification middleware
- [ ] Configure Next.js middleware.ts
- [ ] Test tenant detection from subdomains/headers
- [ ] Implement tenant validation

### Service Layer
- [ ] Implement DatabaseService for tenant connections
- [ ] Create TenantService for tenant management
- [ ] Set up tenant configuration management
- [ ] Add tenant usage tracking

## Phase 3: Integration

### Update Existing Components
- [ ] Modify page store for tenant awareness
- [ ] Update API routes with tenant context
- [ ] Add tenant branding to components
- [ ] Implement tenant feature flags

### Page Builder Integration
- [ ] Update FastEditor with tenant context
- [ ] Modify GrapesJS editor for tenant isolation
- [ ] Update Puck editor for tenant data
- [ ] Ensure page data is tenant-isolated

### User Management
- [ ] Add tenant-user relationships
- [ ] Implement tenant admin roles
- [ ] Create user invitation system
- [ ] Set up tenant-specific authentication

## Phase 4: Security and Performance

### Security Implementation
- [ ] Verify complete data isolation
- [ ] Implement tenant access validation
- [ ] Add rate limiting per tenant
- [ ] Security audit for tenant leakage

### Performance Optimization
- [ ] Implement tenant-aware caching
- [ ] Optimize database queries with proper indexing
- [ ] Set up connection pooling
- [ ] Monitor per-tenant performance

## Phase 5: Management and Operations

### Tenant Management
- [ ] Create tenant onboarding flow
- [ ] Implement tenant admin dashboard
- [ ] Set up usage monitoring
- [ ] Create billing integration (if needed)

### Operational Tools
- [ ] Set up tenant health monitoring
- [ ] Create backup/restore procedures
- [ ] Implement tenant data export
- [ ] Set up logging and alerting

## Quick Start Guide

### 1. Install Dependencies

```bash
npm install @prisma/client prisma jsonwebtoken mysql2
npm install -D @types/jsonwebtoken tsx
```

### 2. Environment Variables

Add to your `.env.local`:

```env
# MySQL server for creating tenant databases
DB_HOST="localhost"
DB_PORT="3306"
MYSQL_ROOT_PASSWORD="root_secure_password"
MYSQL_ADMIN_USER="cms_admin"
MYSQL_ADMIN_PASSWORD="cms_admin_password"

# System configuration
TENANT_STRATEGY="dedicated"
DEFAULT_TENANT="demo"

# Security (system-level)
SYSTEM_JWT_SECRET="your-super-secure-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
```

Note: Each tenant will have its own environment file with MySQL database credentials.

### 3. Database Schema (Dedicated Only)

```bash
# Use the clean schema without tenant_id fields
cp prisma/schema-multitenant.prisma prisma/schema.prisma
# Remove all tenantId fields and related indexes from the schema
# Generate Prisma client
npx prisma generate
# Initial migration (will be applied to each tenant database)
npx prisma migrate dev --name init
```

### 4. Middleware Setup

```bash
# Copy the provided middleware
cp middleware.ts ./middleware.ts
```

### 5. Create First Tenant

```bash
# Install tsx for running TypeScript scripts
npm install -D tsx

# Create starter tier tenant
npx tsx scripts/tenant-setup.ts create demo "Demo Company" admin@demo.com starter

# Create enterprise tier tenant
npx tsx scripts/tenant-setup.ts create acme "Acme Corp" admin@acme.com enterprise

# List all tenants
npx tsx scripts/tenant-setup.ts list

# Show tenant details and environment
npx tsx scripts/tenant-setup.ts stats demo
npx tsx scripts/tenant-setup.ts env show demo
```

### 6. Test Tenant Access

Start your development server:
```bash
# Start MySQL and other services with Docker
docker-compose -f docker/docker-compose.multi-tenant.yml up -d

# Start the Next.js application
npm run dev
```

Access your tenant:
- Subdomain: `http://demo.localhost:3000` (requires local DNS setup)
- Query param: `http://localhost:3000?tenant=demo`
- Header: Add `X-Tenant-ID: demo` to requests

**Database Administration**: Access phpMyAdmin at `http://localhost:8080`

### 7. Update Your Components

Replace your existing page store usage:

```typescript
// Before
import { usePageStore } from '@/lib/stores/page-store';

// After
import { useTenantPageStore } from '@/lib/stores/tenant-page-store';
import { useTenantContext } from '@/lib/middleware/tenant';

function MyComponent() {
  const tenantContext = useTenantContext();
  const { pages, setPages } = useTenantPageStore();
  
  // Your component logic
}
```

## Development Tips

### Local Development with Subdomains

Add to your `/etc/hosts` file:
```
127.0.0.1 demo.localhost
127.0.0.1 acme.localhost
127.0.0.1 enterprise.localhost
```

### Testing Tenant Isolation

1. Create multiple tenants
2. Create data in each tenant
3. Verify data doesn't leak between tenants
4. Test with different user sessions

### Debugging

Enable debug logging:
```env
DEBUG=tenant:*
```

Check tenant context in browser dev tools:
```javascript
// In browser console
localStorage.getItem('currentTenantId')
localStorage.getItem('currentTenantConfig')
```

## Common Issues and Solutions

### Issue: Tenant not detected
**Solution**: Check middleware configuration and host headers

### Issue: Data leaking between tenants
**Solution**: Verify all database queries include tenant filtering

### Issue: Performance issues
**Solution**: Implement proper indexing and connection pooling

### Issue: Hydration errors
**Solution**: Use dynamic imports for tenant-aware components

## Next Steps

1. **Production Deployment**: Set up proper subdomain DNS
2. **Monitoring**: Implement tenant-specific metrics
3. **Billing**: Integrate usage-based billing
4. **Scaling**: Set up horizontal scaling with tenant awareness
5. **Backup**: Implement tenant-specific backup strategies

## Resources

- [Architecture Documentation](./MULTI_TENANT_ARCHITECTURE.md)
- [Example Integrations](../examples/multi-tenant-integration.tsx)
- [Tenant Setup Scripts](../scripts/tenant-setup.ts)
- [Docker Configuration](../docker/docker-compose.multi-tenant.yml)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the example implementations
3. Test with the provided scripts
4. Verify tenant isolation thoroughly
