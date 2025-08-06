import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { TenantRequest } from './types/tenant';
import { createTenantMiddleware, TenantMiddleware } from './middleware/tenant.middleware';
import { tenantService } from './services/tenant.service';
import { SecurityUtils } from './utils/security';
import { ErrorHandler, errorHandlingMiddleware, asyncErrorHandler } from './utils/error-handler';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting by IP
const rateLimiter = SecurityUtils.createRateLimiter(900000, 100); // 100 requests per 15 minutes

app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const rateLimit = rateLimiter(clientIP);
  
  if (!rateLimit.allowed) {
    SecurityUtils.logSecurityEvent({
      type: 'RATE_LIMIT',
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      details: { remaining: rateLimit.remaining }
    });
    
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    });
  }
  
  res.set({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': rateLimit.resetTime.toString()
  });
  
  next();
});

// Initialize tenant middleware
const tenantMiddleware = createTenantMiddleware({
  configPath: process.env.TENANT_CONFIG_PATH || './config/tenants',
  requireTenant: true,
  onTenantNotFound: (req, res) => {
    SecurityUtils.logSecurityEvent({
      type: 'UNAUTHORIZED',
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      details: { reason: 'Tenant not found' }
    });
    
    res.status(400).json({
      error: 'Tenant identification required',
      methods: [
        'Set X-Tenant-ID header',
        'Use subdomain: tenant.yourdomain.com',
        'Include tenant in JWT token'
      ]
    });
  }
});

// Health check endpoint (no tenant required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Tenant information endpoint
app.get('/tenant/info', tenantMiddleware, asyncErrorHandler(async (req: TenantRequest, res) => {
  const healthCheck = await tenantService.healthCheck(req.tenant!);
  
  res.json({
    tenantId: req.tenant!.tenantId,
    subdomain: req.tenant!.config.subdomain,
    database: req.tenant!.config.database.database,
    health: healthCheck,
    features: req.tenant!.config.features || []
  });
}));

// Tenant statistics endpoint
app.get('/tenant/stats', tenantMiddleware, asyncErrorHandler(async (req: TenantRequest, res) => {
  const stats = await tenantService.getTenantDatabaseStats(req.tenant!);
  res.json(stats);
}));

// Example business logic endpoints
app.get('/api/users', tenantMiddleware, asyncErrorHandler(async (req: TenantRequest, res) => {
  const users = await tenantService.executeQuery(
    req.tenant!,
    'SELECT id, name, email, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
  );
  
  SecurityUtils.logSecurityEvent({
    type: 'TENANT_ACCESS',
    tenantId: req.tenant!.tenantId,
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent'),
    details: { endpoint: '/api/users', recordCount: users.length }
  });
  
  res.json(users);
}));

app.post('/api/users', tenantMiddleware, asyncErrorHandler(async (req: TenantRequest, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const result = await tenantService.executeQuery(
    req.tenant!,
    'INSERT INTO users (name, email, created_at) VALUES (?, ?, NOW())',
    [name, email]
  );
  
  res.status(201).json({
    id: (result as any).insertId,
    name,
    email,
    message: 'User created successfully'
  });
}));

// Admin endpoints (specific tenant access)
const adminMiddleware = new TenantMiddleware({ requireTenant: false });

app.get('/admin/tenants', adminMiddleware.forTenant('admin'), asyncErrorHandler(async (req, res) => {
  const activeTenants = await tenantService.getActiveTenants();
  res.json({ tenants: activeTenants });
}));

app.post('/admin/tenant/create', adminMiddleware.forTenant('admin'), asyncErrorHandler(async (req, res) => {
  const tenantConfig = req.body;
  
  // Validate configuration
  const securityIssues = SecurityUtils.validateTenantConfig(tenantConfig);
  if (securityIssues.length > 0) {
    return res.status(400).json({
      error: 'Configuration validation failed',
      issues: securityIssues
    });
  }
  
  await tenantService.createTenant(tenantConfig);
  res.status(201).json({ message: 'Tenant created successfully' });
}));

// Transaction example
app.post('/api/transfer', tenantMiddleware, asyncErrorHandler(async (req: TenantRequest, res) => {
  const { fromAccountId, toAccountId, amount } = req.body;
  
  const result = await tenantService.executeTransaction(req.tenant!, async (connection) => {
    // Debit from account
    await connection.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?',
      [amount, fromAccountId, amount]
    );
    
    // Credit to account
    await connection.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [amount, toAccountId]
    );
    
    // Log transaction
    const [result] = await connection.execute(
      'INSERT INTO transactions (from_account_id, to_account_id, amount, created_at) VALUES (?, ?, ?, NOW())',
      [fromAccountId, toAccountId, amount]
    );
    
    return { transactionId: (result as any).insertId };
  });
  
  res.json({
    message: 'Transfer completed successfully',
    transactionId: result.transactionId
  });
}));

// Custom query endpoint (be careful with this in production)
app.post('/api/query', tenantMiddleware, asyncErrorHandler(async (req: TenantRequest, res) => {
  const { query, params } = req.body;
  
  // Security check
  const sanitizedQuery = SecurityUtils.sanitizeQuery(query);
  if (sanitizedQuery !== query) {
    SecurityUtils.logSecurityEvent({
      type: 'SECURITY_VIOLATION',
      tenantId: req.tenant!.tenantId,
      ip: req.ip || 'unknown',
      details: { originalQuery: query, sanitizedQuery }
    });
    
    return res.status(400).json({
      error: 'Query contains potentially dangerous patterns'
    });
  }
  
  const results = await tenantService.executeQuery(req.tenant!, query, params);
  res.json(results);
}));

// Error handling middleware (must be last)
app.use(errorHandlingMiddleware);

// Setup graceful shutdown
ErrorHandler.setupGracefulShutdown();

// Start server
app.listen(PORT, () => {
  console.log(`Multi-tenant server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('Tenant access methods:');
  console.log('  - Subdomain: http://tenant1.localhost:' + PORT);
  console.log('  - Header: X-Tenant-ID: tenant1');
  console.log('  - JWT token with tenantId claim');
});

export default app;
