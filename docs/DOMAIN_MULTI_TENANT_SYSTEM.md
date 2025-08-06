# Domain-Based Multi-Tenant System

A comprehensive multi-tenant backend system where each tenant has a dedicated database identified by domain/subdomain.

## Overview

This system allows you to run multiple tenants from the same codebase, where:

- **Tenant Identification**: Based on domain/subdomain (e.g., `hirayadmin.whitecodetech.com`)
- **Database Isolation**: Each tenant has its own dedicated database
- **Environment Configuration**: Dynamic loading of tenant-specific `.env` files
- **Same Codebase**: All tenants use the same application code and APIs
- **Admin vs Website**: Supports both admin panels and public websites per tenant

## Architecture

### Domain Patterns

- **Admin Domains**: `{tenant}admin.{basedomain}.com` (e.g., `hirayadmin.whitecodetech.com`)
- **Website Domains**: `{tenant}.{basedomain}.com` (e.g., `hiray.whitecodetech.com`)

### Environment Files

Each domain maps to a specific `.env` file:

- `hirayadmin.whitecodetech.com` → `.env.hirayadminwhitecodetechcom`
- `hiray.whitecodetech.com` → `.env.hiraywhitecodetechcom`

## Key Components

### 1. Domain Tenant Service (`lib/tenant-config/domain-tenant-service.ts`)

Handles tenant identification and domain-to-env mapping:

```typescript
// Identify tenant from domain
const mapping = await DomainTenantService.identifyTenantFromDomain('hiray.whitecodetech.com');

// Load tenant environment
const envConfig = await DomainTenantService.loadTenantEnv('.env.hiraywhitecodetechcom');
```

### 2. Environment Loader (`lib/tenant-config/env-loader.ts`)

Dynamic loading and caching of tenant environments:

```typescript
// Load and apply environment for domain
const loadedEnv = await TenantEnvLoader.loadAndApplyForDomain('hiray.whitecodetech.com');
```

### 3. Database Manager (`lib/tenant-config/tenant-database-manager.ts`)

Manages database connections per tenant:

```typescript
// Get database connection for domain
const client = await TenantDatabaseManager.getConnectionForDomain('hiray.whitecodetech.com');
```

### 4. Tenant Prisma Client (`lib/tenant-prisma.ts`)

Tenant-aware Prisma client that automatically connects to the correct database:

```typescript
// Get Prisma client for current tenant
const client = await prisma();

// Use in API routes
export const withTenantDatabase = (handler) => {
  return async (req, res) => {
    const client = await useTenantPrisma(req.headers);
    return handler(req, res, client);
  };
};
```

### 5. Middleware (`lib/middleware/domain-tenant-middleware.ts`)

Processes requests and sets tenant context:

```typescript
// Automatic tenant identification from domain
// Sets headers: x-tenant-id, x-tenant-domain, x-tenant-type, etc.
```

### 6. Environment Generator (`lib/tenant-config/tenant-env-generator.ts`)

Creates and manages tenant `.env` files:

```typescript
// Generate tenant pair (admin + website)
const { admin, website } = await TenantEnvGenerator.generateTenantPair(
  'whitecodetech.com',
  'hiray',
  {
    databaseHost: 'localhost',
    databasePort: 3306,
    tenantName: 'Hiray Company'
  }
);
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install commander
```

### 2. Create Tenant Configuration

Use the CLI to create tenants:

```bash
# Create both admin and website tenants
npm run tenant:create -- --tenant-id hiray --domain whitecodetech.com --name "Hiray Company"

# Create only admin tenant
npm run tenant:create -- --tenant-id hiray --domain whitecodetech.com --name "Hiray Company" --admin-only

# Create with custom database settings
npm run tenant:create -- \
  --tenant-id hiray \
  --domain whitecodetech.com \
  --name "Hiray Company" \
  --db-host localhost \
  --db-port 3306 \
  --db-user hiray_user \
  --db-password secure_password
```

### 3. Example Environment File

The generator creates files like `.env.hirayadminwhitecodetechcom`:

```env
# Environment configuration for tenant: hiray_admin
# Domain: Hiray Company
# Generated: 2024-01-01T00:00:00.000Z

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DATABASE_URL="mysql://hiray_admin_user:secure_password@localhost:3306/hiray_admin_cms"
DATABASE_HOST="localhost"
DATABASE_PORT="3306"
DATABASE_NAME="hiray_admin_cms"
DATABASE_USER="hiray_admin_user"
DATABASE_PASSWORD="secure_password"
DATABASE_CHARSET="utf8mb4"

# ===========================================
# TENANT INFORMATION
# ===========================================
TENANT_ID="hiray_admin"
TENANT_NAME="Hiray Company"

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
JWT_SECRET="auto_generated_64_char_secret"
ENCRYPTION_KEY="auto_generated_32_char_key"
SESSION_SECRET="auto_generated_64_char_secret"

# ===========================================
# APPLICATION CONFIGURATION
# ===========================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://Hiray Company"

# ===========================================
# ADDITIONAL ENVIRONMENT VARIABLES
# ===========================================
NEXT_PUBLIC_SITE_NAME="Hiray Company"
SUPPORT_EMAIL="support@hiray.whitecodetech.com"
```

### 4. Domain Mapping Configuration

The system creates `config/domain-mappings.json`:

```json
[
  {
    "domain": "hirayadmin.whitecodetech.com",
    "envFile": ".env.hirayadminwhitecodetechcom",
    "tenantType": "admin",
    "isActive": true
  },
  {
    "domain": "hiray.whitecodetech.com",
    "envFile": ".env.hiraywhitecodetechcom",
    "tenantType": "website",
    "isActive": true
  }
]
```

## CLI Commands

### Create Tenants

```bash
# Create tenant pair (admin + website)
npm run tenant:create -- --tenant-id hiray --domain whitecodetech.com --name "Hiray Company"

# Create admin only
npm run tenant:create -- --tenant-id hiray --domain whitecodetech.com --name "Hiray Company" --admin-only

# Create website only  
npm run tenant:create -- --tenant-id hiray --domain whitecodetech.com --name "Hiray Company" --website-only
```

### Manage Tenants

```bash
# List all tenants
npm run tenant:list

# List with detailed information
npm run tenant:list -- --detailed

# Validate tenant configuration
npm run tenant:validate -- hiray.whitecodetech.com

# Update tenant
npm run tenant:update -- hiray.whitecodetech.com --tenant-name "New Name"

# Delete tenant
npm run tenant:delete -- hiray.whitecodetech.com --force

# Test tenant
npm run tenant:test -- hiray.whitecodetech.com

# Health check all tenants
npm run tenant:health

# Create example tenant
npm run tenant:example
```

## Usage in Application Code

### API Routes

```typescript
// app/api/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { useTenantPrisma } from '@/lib/tenant-prisma';

export async function GET(request: NextRequest) {
  const prisma = await useTenantPrisma(request.headers);
  
  if (!prisma) {
    return NextResponse.json({ error: 'No tenant database' }, { status: 400 });
  }

  const pages = await prisma.page.findMany();
  return NextResponse.json(pages);
}

// Or using the wrapper
import { withTenantDatabase } from '@/lib/tenant-prisma';

export const GET = withTenantDatabase(async (req, res, prisma) => {
  const pages = await prisma.page.findMany();
  return NextResponse.json(pages);
});
```

### React Components

```typescript
// components/TenantAwarePage.tsx
import { useEffect, useState } from 'react';
import { prisma } from '@/lib/tenant-prisma';

export default function TenantAwarePage() {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    const loadPages = async () => {
      const client = await prisma();
      if (client) {
        const data = await client.page.findMany();
        setPages(data);
      }
    };
    
    loadPages();
  }, []);

  return (
    <div>
      {pages.map(page => (
        <div key={page.id}>{page.title}</div>
      ))}
    </div>
  );
}
```

### Middleware Usage

The middleware automatically:

1. Identifies tenant from domain
2. Loads appropriate environment variables
3. Sets tenant context headers
4. Validates tenant configuration

Headers set by middleware:

- `x-tenant-id`: Tenant identifier
- `x-tenant-domain`: Original domain
- `x-tenant-type`: "admin" or "website"
- `x-tenant-env-file`: Environment file used
- `x-tenant-config`: JSON tenant configuration

## Database Setup

### 1. Create Databases

For each tenant, create dedicated databases:

```sql
-- For hiray admin
CREATE DATABASE hiray_admin_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hiray_admin_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON hiray_admin_cms.* TO 'hiray_admin_user'@'%';

-- For hiray website
CREATE DATABASE hiray_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hiray_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON hiray_cms.* TO 'hiray_user'@'%';

FLUSH PRIVILEGES;
```

### 2. Run Migrations

Use Prisma to run migrations on each tenant database:

```bash
# Set environment for specific tenant
export DATABASE_URL="mysql://hiray_admin_user:password@localhost:3306/hiray_admin_cms"
npx prisma migrate deploy

# Repeat for each tenant database
export DATABASE_URL="mysql://hiray_user:password@localhost:3306/hiray_cms"
npx prisma migrate deploy
```

## Development Workflow

### 1. Local Development

For local development, use the fallback domain in middleware:

```typescript
// middleware.ts
const tenantMiddleware = createDomainTenantMiddleware({
  enableDevMode: true,
  fallbackDomain: 'demo.whitecodetech.com',
  enableLogging: true
});
```

### 2. Testing Tenants

```bash
# Test tenant configuration
npm run tenant:test -- hiray.whitecodetech.com

# Validate all tenants
npm run tenant:list
npm run tenant:health
```

### 3. Adding New Tenants

```bash
# Create new tenant
npm run tenant:create -- --tenant-id newclient --domain whitecodetech.com --name "New Client"

# Validate configuration
npm run tenant:validate -- newclient.whitecodetech.com

# Test connection
npm run tenant:test -- newclient.whitecodetech.com
```

## Production Deployment

### 1. Environment Setup

- Ensure all tenant `.env` files are present
- Configure domain mappings in `config/domain-mappings.json`
- Set up DNS records for all tenant domains

### 2. Database Setup

- Create dedicated databases for each tenant
- Run migrations on all tenant databases
- Set up proper database users and permissions

### 3. Monitoring

- Use health check endpoint: `npm run tenant:health`
- Monitor connection pool: `TenantDatabaseManager.getConnectionStats()`
- Check environment cache: `TenantEnvLoader.getCacheStats()`

## Security Considerations

1. **Database Isolation**: Each tenant has its own database and user
2. **Environment Isolation**: Tenant-specific environment variables
3. **Auto-generated Secrets**: Unique JWT secrets, encryption keys per tenant
4. **Connection Limits**: Configurable connection pools per tenant
5. **Validation**: Environment validation before allowing connections

## Troubleshooting

### Common Issues

1. **Tenant Not Found**
   ```bash
   npm run tenant:validate -- yourdomain.com
   npm run tenant:list
   ```

2. **Database Connection Failed**
   ```bash
   npm run tenant:test -- yourdomain.com
   ```

3. **Environment Loading Issues**
   - Check if `.env` file exists
   - Validate file permissions
   - Check domain mapping in `config/domain-mappings.json`

### Debug Commands

```bash
# List all tenants and their status
npm run tenant:list -- --detailed

# Test specific tenant
npm run tenant:test -- problematic-domain.com

# Health check all connections
npm run tenant:health

# Validate tenant configuration
npm run tenant:validate -- problematic-domain.com
```

## Performance Optimization

1. **Connection Pooling**: Automatic connection management with timeouts
2. **Environment Caching**: Cached environment loading with TTL
3. **Connection Cleanup**: Automatic cleanup of expired connections
4. **Lazy Loading**: Connections created only when needed

## Extending the System

### Adding New Tenant Types

Modify the `tenantType` enum in `domain-tenant-service.ts`:

```typescript
export interface DomainTenantMapping {
  domain: string;
  envFile: string;
  tenantType: 'admin' | 'website' | 'api' | 'mobile'; // Add new types
  isActive: boolean;
}
```

### Custom Environment Variables

Add to tenant environment template:

```typescript
const template: TenantEnvTemplate = {
  // ... existing config
  additionalVars: {
    'CUSTOM_API_KEY': 'your-api-key',
    'THIRD_PARTY_URL': 'https://api.example.com',
    'FEATURE_FLAGS': 'flag1,flag2,flag3'
  }
};
```

This system provides a robust, scalable solution for multi-tenant applications with complete database isolation and domain-based tenant identification.
