# Multi-Tenant SaaS Architecture Guide (Dedicated Database Strategy)

## Architecture Overview

This guide implements a scalable multi-tenant SaaS architecture with dedicated databases and environment files for each tenant:

- **Tenant Identification**: Subdomain, header, or token-based
- **Database Strategy**: Dedicated database per tenant (only)
- **Environment Management**: Separate .env file per tenant with credentials
- **Security**: Complete data and configuration isolation per tenant
- **Scalability**: Horizontal scaling with tenant-aware load balancing

## Architecture Pattern: Database-per-Tenant

### Benefits
- **Complete Data Isolation**: Each tenant has their own database
- **Enhanced Security**: No risk of data leakage between tenants
- **Compliance Ready**: Easier GDPR, HIPAA, and industry compliance
- **Performance Isolation**: Tenant workloads don't affect each other
- **Backup Granularity**: Individual tenant backup and restore
- **Customization**: Per-tenant database configurations and tuning

### Structure
- Each tenant gets a dedicated PostgreSQL database
- Separate environment file with database credentials
- Unique security keys per tenant
- Independent scaling and maintenance

## Recommended Stack

```
Frontend: Next.js 14 (current)
Backend: Node.js + Express
Database: MySQL 8.0 with Prisma ORM
Cache: Redis (tenant-aware)
Queue: Bull/BullMQ (tenant-aware)
Monitoring: Tenant-specific logging
```

## Folder Structure

```
├── lib/
│   ├── middleware/
│   │   └── tenant.ts           # Tenant identification and context
│   ├── services/
│   │   ├── tenant-service.ts   # Tenant management & creation
│   │   └── database-service.ts # Dedicated DB connections & env management
│   └── stores/
│       └── page-store.ts       # Tenant-aware page store
├── config/
│   └── tenants/                # Per-tenant configurations and env files
│       ├── demo.json           # Tenant configuration
│       ├── demo.env            # Tenant environment variables & DB credentials
│       ├── acme.json           # Another tenant config
│       └── acme.env            # Another tenant env file
├── scripts/
│   └── tenant-setup.ts         # CLI tool for tenant management
├── prisma/
│   ├── schema.prisma           # Schema without tenant_id fields
│   └── migrations/             # Standard migrations (applied per tenant)
├── docker/
│   ├── docker-compose.multi-tenant.yml  # Multi-database Docker setup
│   └── tenant-db/              # Docker configs for tenant databases
└── docs/
    ├── MULTI_TENANT_ARCHITECTURE.md     # This guide
    └── IMPLEMENTATION_CHECKLIST.md      # Step-by-step setup
```

## Environment File Structure

Each tenant has its own `.env` file in `config/tenants/`:

```bash
# config/tenants/acme.env
# MySQL Database Configuration
TENANT_ACME_DATABASE_URL="mysql://tenant_acme:secure_password@localhost:3306/tenant_acme"
TENANT_ACME_DB_HOST="localhost"
TENANT_ACME_DB_PORT="3306"
TENANT_ACME_DB_NAME="tenant_acme"
TENANT_ACME_DB_USER="tenant_acme"
TENANT_ACME_DB_PASSWORD="secure_password"
TENANT_ACME_DB_CHARSET="utf8mb4"

# Tenant Configuration
TENANT_ID="acme"
TENANT_NAME="Acme Corporation"
TENANT_SUBDOMAIN="acme"

# Database Type
DATABASE_TYPE="mysql"
MYSQL_CHARSET="utf8mb4"
MYSQL_COLLATION="utf8mb4_unicode_ci"

# Security Keys (unique per tenant)
TENANT_ACME_JWT_SECRET="unique-jwt-secret-for-acme"
TENANT_ACME_ENCRYPTION_KEY="unique-encryption-key"
TENANT_ACME_SESSION_SECRET="unique-session-secret"

# Custom Environment Variables
ACME_API_KEY="acme-specific-api-key"
ENTERPRISE_FEATURES="enabled"
CUSTOM_DOMAIN="cms.acme.com"
```

## Implementation Steps

### Step 1: Tenant Identification (Multi-Strategy)

```typescript
// Extract tenant from subdomain (primary method)
// acme.yourapp.com → tenant: "acme"
const extractTenantFromSubdomain = (host: string): string | null => {
  const subdomain = host.split('.')[0];
  return subdomain !== 'www' && subdomain !== 'yourapp' ? subdomain : null;
};

// Fallback: Header-based identification
// X-Tenant-ID: acme
const extractTenantFromHeader = (headers: Headers): string | null => {
  return headers.get('x-tenant-id') || headers.get('X-Tenant-ID');
};

// Token-based (for API access)
const extractTenantFromToken = (token: string): string | null => {
  const decoded = jwt.verify(token, secret);
  return decoded.tenant || decoded.tenantId || null;
};
```

### Step 2: Dedicated Database Architecture

```typescript
interface TenantDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  charset?: string;
}

class DatabaseService {
  // Load tenant-specific environment variables
  static async loadTenantEnv(tenantId: string): Promise<void> {
    const envPath = `config/tenants/${tenantId}.env`;
    const envContent = await fs.readFile(envPath, 'utf-8');
    // Parse and set environment variables
  }

  // Get dedicated MySQL connection for tenant
  static async getConnection(tenantConfig: TenantConfig): Promise<PrismaClient> {
    await this.loadTenantEnv(tenantConfig.id);
    const connectionString = process.env[`TENANT_${tenantConfig.id.toUpperCase()}_DATABASE_URL`];
    return this.getDedicatedConnection(tenantConfig.id, connectionString);
  }
}
```

### Step 3: Environment File Management

```typescript
// Create tenant environment file with MySQL database credentials
static async createTenantEnvFile(
  tenantId: string,
  config: DatabaseConfig,
  additionalEnvVars: Record<string, string> = {}
): Promise<void> {
  const connectionString = `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;

  const envContent = `
# MySQL Database Configuration
TENANT_${tenantId.toUpperCase()}_DATABASE_URL="${connectionString}"
TENANT_${tenantId.toUpperCase()}_DB_HOST="${config.host}"
TENANT_${tenantId.toUpperCase()}_DB_PORT="${config.port}"
TENANT_${tenantId.toUpperCase()}_DB_NAME="${config.database}"
TENANT_${tenantId.toUpperCase()}_DB_USER="${config.username}"
TENANT_${tenantId.toUpperCase()}_DB_PASSWORD="${config.password}"
TENANT_${tenantId.toUpperCase()}_DB_CHARSET="${config.charset || 'utf8mb4'}"

# Database Type
DATABASE_TYPE="mysql"
MYSQL_CHARSET="utf8mb4"
MYSQL_COLLATION="utf8mb4_unicode_ci"

# Security Keys (unique per tenant)
TENANT_${tenantId.toUpperCase()}_JWT_SECRET="${generateSecureKey()}"
TENANT_${tenantId.toUpperCase()}_ENCRYPTION_KEY="${generateSecureKey()}"
`;

  await fs.writeFile(`config/tenants/${tenantId}.env`, envContent);
}
```

### Step 4: Tenant Configuration Management

#### Enhanced Tenant Configuration Schema
```typescript
interface TenantConfig {
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
```

#### Tenant Tiers

```typescript
const TENANT_TIERS = {
  starter: {
    features: {
      advancedEditor: true,
      customBranding: false,
      apiAccess: true,
      maxUsers: 5,
      customDomain: false,
      sslEnabled: true
    },
    limits: {
      maxPages: 100,
      maxStorage: 1000, // 1GB
      maxApiCalls: 10000,
      maxUsers: 5,
      maxFileSize: 25 // 25MB
    }
  },
  professional: {
    features: {
      advancedEditor: true,
      customBranding: true,
      apiAccess: true,
      maxUsers: 25,
      customDomain: false,
      sslEnabled: true
    },
    limits: {
      maxPages: 1000,
      maxStorage: 5000, // 5GB
      maxApiCalls: 50000,
      maxUsers: 25,
      maxFileSize: 100 // 100MB
    }
  },
  enterprise: {
    features: {
      advancedEditor: true,
      customBranding: true,
      apiAccess: true,
      maxUsers: 100,
      customDomain: true,
      sslEnabled: true
    },
    limits: {
      maxPages: 10000,
      maxStorage: 20000, // 20GB
      maxApiCalls: 200000,
      maxUsers: 100,
      maxFileSize: 500 // 500MB
    }
  }
};
```

### Step 4: Security Considerations

1. **Data Isolation**: Ensure complete separation between tenants
2. **Query Filtering**: Always include tenant_id in queries (shared DB)
3. **Connection Security**: Use connection pooling with tenant awareness
4. **Configuration Isolation**: Separate config files/DB records per tenant
5. **API Rate Limiting**: Tenant-specific rate limits
6. **Logging**: Tenant-aware logging for debugging and auditing

### Step 5: Scalability Features

1. **Database Sharding**: Distribute tenants across multiple DB instances
2. **Caching**: Tenant-aware Redis caching
3. **CDN**: Tenant-specific asset serving
4. **Load Balancing**: Route requests based on tenant
5. **Background Jobs**: Tenant-aware job queuing

## Libraries and Tools

### Essential Libraries
```json
{
  "express": "^4.18.2",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "jsonwebtoken": "^9.0.0",
  "redis": "^4.6.0",
  "bull": "^4.11.0",
  "helmet": "^7.0.0",
  "rate-limiter-flexible": "^2.4.0"
}
```

### Monitoring & Observability
- **Winston**: Tenant-aware logging
- **Prometheus**: Metrics per tenant
- **Sentry**: Error tracking with tenant context
- **NewRelic/DataDog**: APM with tenant segmentation

## Tenant Management CLI

### Quick Setup Commands

```bash
# Create starter tier tenant
npx tsx scripts/tenant-setup.ts create demo "Demo Company" admin@demo.com starter

# Create enterprise tier tenant
npx tsx scripts/tenant-setup.ts create acme "Acme Corp" admin@acme.com enterprise

# List all tenants
npx tsx scripts/tenant-setup.ts list

# Show tenant statistics
npx tsx scripts/tenant-setup.ts stats acme

# Show tenant environment variables
npx tsx scripts/tenant-setup.ts env show acme

# Set custom environment variable
npx tsx scripts/tenant-setup.ts env set acme CUSTOM_FEATURE enabled

# Run database migrations for tenant
npx tsx scripts/tenant-setup.ts migrate acme

# Health check for tenant
npx tsx scripts/tenant-setup.ts health acme

# Delete tenant (database, env file, config)
npx tsx scripts/tenant-setup.ts delete demo
```

### Tenant Creation Process

When creating a tenant, the system:

1. **Validates** subdomain availability and format
2. **Creates** dedicated PostgreSQL database
3. **Generates** secure credentials and keys
4. **Creates** environment file with all credentials
5. **Applies** database schema migrations
6. **Creates** default admin user
7. **Saves** tenant configuration file

```bash
# Example output
✅ Tenant created successfully!
Tenant ID: acme
Subdomain: acme
Tier: enterprise
Database: postgresql://tenant_acme:secure_password@localhost:5433/tenant_acme
Environment file: config/tenants/acme.env

📊 Limits:
  Max Pages: 10000
  Max Storage: 20000MB
  Max Users: 100
  Max API Calls: 200000/month

🌐 Access URL: https://acme.yourapp.com
📧 Admin login: admin@acme.com
📄 Environment file: config/tenants/acme.env
```

## Best Practices

1. **Always validate tenant access**: Never trust client-sent tenant IDs
2. **Use middleware consistently**: Apply tenant filtering at the middleware level
3. **Implement proper error handling**: Don't leak tenant information in errors
4. **Monitor per-tenant metrics**: Track usage, performance, and costs per tenant
5. **Plan for growth**: Design for easy tenant onboarding and scaling
6. **Backup strategy**: Per-tenant backup and restore capabilities
7. **Testing**: Test tenant isolation thoroughly
8. **Documentation**: Maintain clear tenant onboarding documentation

## Performance Optimization

1. **Connection Pooling**: Reuse database connections per tenant
2. **Query Optimization**: Index tenant_id columns
3. **Caching**: Implement tenant-aware caching strategies
4. **Lazy Loading**: Load tenant configs only when needed
5. **Background Processing**: Separate tenant workloads
