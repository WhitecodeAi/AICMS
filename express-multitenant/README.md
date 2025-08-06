# Multi-Tenant Express.js Backend

A robust, scalable multi-tenant backend system where each tenant has a separate database. The system automatically identifies tenants via subdomain, headers, or JWT tokens, loads their configuration, and connects to the appropriate database.

## 🏗️ Architecture Overview

```
Request → Tenant Identification → Config Loading → Database Connection → Business Logic
```

### Key Features

- **Multiple Tenant Identification Methods**: Subdomain, HTTP headers, JWT tokens
- **Dynamic Database Connection Pooling**: Separate database per tenant with connection pooling
- **Configuration Management**: File-based or environment variable configuration
- **Security**: Rate limiting, input validation, SQL injection prevention
- **Error Handling**: Comprehensive error handling with specific tenant error types
- **Monitoring**: Health checks, statistics, and logging

## 🚀 Quick Start

### 1. Installation

```bash
cd express-multitenant
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Tenant Configuration

Create tenant configuration files in `config/tenants/`:

```json
{
  "tenantId": "acme-corp",
  "subdomain": "acme",
  "database": {
    "host": "localhost",
    "port": 3306,
    "database": "acme_corp_db",
    "user": "acme_user",
    "password": "secure_password",
    "connectionLimit": 10
  },
  "features": ["analytics", "api_access"]
}
```

### 4. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🎯 Tenant Identification Methods

### 1. Subdomain Method

```bash
curl http://tenant1.localhost:3000/api/users
```

### 2. HTTP Header Method

```bash
curl -H "X-Tenant-ID: tenant1" http://localhost:3000/api/users
```

### 3. JWT Token Method

```bash
# Generate token with tenantId claim
curl -H "Authorization: Bearer your-jwt-token" http://localhost:3000/api/users
```

## 📁 Project Structure

```
express-multitenant/
├── types/
│   └── tenant.ts                 # TypeScript interfaces
├── services/
│   ├── tenant-config.service.ts  # Configuration management
│   ├── tenant-identification.service.ts # Tenant identification
│   ├── database-pool.service.ts  # Database connection pooling
│   └── tenant.service.ts         # Main tenant service
├── middleware/
│   └── tenant.middleware.ts      # Express middleware
├── utils/
│   ├── security.ts              # Security utilities
│   └── error-handler.ts         # Error handling
├── config/
│   └── tenants/                 # Tenant configuration files
│       ├── tenant1.json
│       ├── tenant2.json
│       └── admin.json
├── app.ts                       # Main Express application
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration Options

### Tenant Configuration File Structure

```typescript
interface TenantConfig {
  tenantId: string;           // Unique tenant identifier
  subdomain: string;          // Subdomain for identification
  database: {
    host: string;             // Database host
    port: number;             // Database port
    database: string;         // Database name
    user: string;             // Database user
    password: string;         // Database password
    ssl?: boolean;            // SSL connection
    connectionLimit?: number; // Max connections
  };
  redis?: {                   // Optional Redis config
    host: string;
    port: number;
    password?: string;
  };
  features?: string[];        // Enabled features
  customSettings?: any;       // Custom tenant settings
}
```

### Environment Variables

```bash
# Application
PORT=3000
JWT_SECRET=your-secret-key

# Tenant Configuration
TENANT_CONFIG_PATH=./config/tenants
TENANT_CACHE_TTL=300000

# Alternative: Configure tenants via environment
TENANT_ACME_DB_HOST=localhost
TENANT_ACME_DB_NAME=acme_db
TENANT_ACME_DB_USER=acme_user
TENANT_ACME_DB_PASSWORD=password
```

## 🔒 Security Features

### Rate Limiting

```typescript
// Configure rate limiting per IP
const rateLimiter = SecurityUtils.createRateLimiter(
  900000, // 15 minutes window
  100     // 100 requests max
);
```

### Input Validation

```typescript
// Automatic SQL injection prevention
const sanitized = SecurityUtils.sanitizeQuery(userQuery);
```

### Configuration Encryption

```typescript
// Encrypt sensitive configuration data
const encrypted = SecurityUtils.encryptConfig(config, encryptionKey);
```

## 📊 API Endpoints

### Health Check
```
GET /health
```

### Tenant Information
```
GET /tenant/info
Headers: X-Tenant-ID: tenant1
```

### Business Logic Examples
```
GET /api/users           # Get tenant users
POST /api/users          # Create user
POST /api/transfer       # Execute transaction
POST /api/query          # Custom query (admin)
```

### Admin Endpoints
```
GET /admin/tenants       # List active tenants
POST /admin/tenant/create # Create new tenant
```

## 🎮 Usage Examples

### Basic Express Route with Tenant

```typescript
app.get('/api/products', tenantMiddleware, async (req: TenantRequest, res) => {
  const products = await tenantService.executeQuery(
    req.tenant!,
    'SELECT * FROM products WHERE active = 1'
  );
  res.json(products);
});
```

### Transaction Example

```typescript
app.post('/api/order', tenantMiddleware, async (req: TenantRequest, res) => {
  const result = await tenantService.executeTransaction(req.tenant!, async (connection) => {
    // Create order
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (customer_id, total) VALUES (?, ?)',
      [customerId, total]
    );
    
    // Update inventory
    await connection.execute(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [quantity, productId]
    );
    
    return { orderId: orderResult.insertId };
  });
  
  res.json(result);
});
```

### Custom Middleware for Specific Tenant

```typescript
const adminMiddleware = new TenantMiddleware({ requireTenant: false });

app.use('/admin/*', adminMiddleware.forTenant('admin'));
```

## 🏥 Monitoring & Health Checks

### Tenant Health Check

```bash
curl http://localhost:3000/tenant/info
```

Response:
```json
{
  "tenantId": "tenant1",
  "subdomain": "tenant1",
  "database": "tenant1_db",
  "health": {
    "status": "healthy",
    "database": true,
    "latency": 12
  }
}
```

### Database Statistics

```bash
curl http://localhost:3000/tenant/stats
```

### Pool Statistics

```typescript
const stats = databasePoolService.getPoolStats();
// Returns connection pool information for all tenants
```

## 🔧 Advanced Configuration

### Custom Error Handling

```typescript
const tenantMiddleware = createTenantMiddleware({
  onTenantNotFound: (req, res) => {
    res.status(404).json({ error: 'Tenant not configured' });
  },
  onError: (error, req, res, next) => {
    console.error('Custom error handler:', error);
    res.status(500).json({ error: 'Service unavailable' });
  }
});
```

### Custom Tenant Identification

```typescript
class CustomTenantIdentification extends TenantIdentificationService {
  identifyTenant(req: Request): TenantIdentificationResult {
    // Custom logic here
    const customHeader = req.get('X-Custom-Tenant');
    if (customHeader) {
      return { tenantId: customHeader, method: 'header' };
    }
    return super.identifyTenant(req);
  }
}
```

## 🚀 Production Deployment

### Docker Example

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY config ./config
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=production-secret-key
TENANT_CONFIG_PATH=/app/config/tenants
CONFIG_ENCRYPTION_KEY=production-encryption-key
```

### Load Balancer Configuration

For subdomain-based routing with load balancers:

```nginx
server {
    server_name ~^(?<tenant>.+)\.yourdomain\.com$;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Tenant-ID $tenant;
    }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Tenant Not Found**
   - Check tenant configuration files
   - Verify subdomain/header format
   - Review logs for identification method

2. **Database Connection Failed**
   - Verify database credentials
   - Check network connectivity
   - Review connection limits

3. **Rate Limiting**
   - Check IP address
   - Review rate limit configuration
   - Consider whitelisting

### Debug Mode

```bash
DEBUG=tenant:* npm run dev
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific tenant
curl -H "X-Tenant-ID: test-tenant" http://localhost:3000/api/users
```

## 📈 Performance Considerations

- **Connection Pooling**: Configured per tenant with automatic cleanup
- **Configuration Caching**: 5-minute TTL by default
- **Rate Limiting**: IP-based with configurable windows
- **Graceful Shutdown**: Proper cleanup of database connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
