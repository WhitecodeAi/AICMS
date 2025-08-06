import { Request, Response, NextFunction } from 'express';
import { TenantRequest, TenantContext } from '../types/tenant';
import { TenantConfigService } from '../services/tenant-config.service';
import { TenantIdentificationService } from '../services/tenant-identification.service';
import { databasePoolService } from '../services/database-pool.service';

export interface TenantMiddlewareOptions {
  configPath?: string;
  cacheTTL?: number;
  jwtSecret?: string;
  requireTenant?: boolean;
  defaultTenant?: string;
  onTenantNotFound?: (req: Request, res: Response) => void;
  onError?: (error: Error, req: Request, res: Response, next: NextFunction) => void;
}

export class TenantMiddleware {
  private configService: TenantConfigService;
  private identificationService: TenantIdentificationService;
  private options: Required<TenantMiddlewareOptions>;

  constructor(options: TenantMiddlewareOptions = {}) {
    this.options = {
      configPath: options.configPath || './config/tenants',
      cacheTTL: options.cacheTTL || 300000, // 5 minutes
      jwtSecret: options.jwtSecret || process.env.JWT_SECRET || 'default-secret',
      requireTenant: options.requireTenant ?? true,
      defaultTenant: options.defaultTenant || 'default',
      onTenantNotFound: options.onTenantNotFound || this.defaultTenantNotFoundHandler,
      onError: options.onError || this.defaultErrorHandler
    };

    this.configService = new TenantConfigService(
      this.options.configPath,
      this.options.cacheTTL
    );
    
    this.identificationService = new TenantIdentificationService(
      this.options.jwtSecret
    );
  }

  middleware() {
    return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const identification = this.identificationService.identifyTenant(req);
        let tenantId = identification.tenantId;

        // Use default tenant if none identified and not required
        if (!tenantId && !this.options.requireTenant) {
          tenantId = this.options.defaultTenant;
        }

        if (!tenantId) {
          this.options.onTenantNotFound(req, res);
          return;
        }

        // Load tenant configuration
        const config = await this.configService.getTenantConfig(tenantId);
        
        if (!config) {
          console.error(`Tenant configuration not found for: ${tenantId}`);
          this.options.onTenantNotFound(req, res);
          return;
        }

        // Get database connection
        const dbConnection = await databasePoolService.getConnection(tenantId, config);

        // Create tenant context
        const tenantContext: TenantContext = {
          tenantId,
          config,
          dbConnection
        };

        // Attach to request
        req.tenant = tenantContext;

        // Add tenant info to response headers (optional)
        res.set('X-Tenant-ID', tenantId);
        res.set('X-Tenant-Method', identification.method);

        next();
      } catch (error) {
        console.error('Tenant middleware error:', error);
        this.options.onError(error as Error, req, res, next);
      }
    };
  }

  // Create a middleware for specific tenant (bypass identification)
  forTenant(tenantId: string) {
    return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const config = await this.configService.getTenantConfig(tenantId);
        
        if (!config) {
          throw new Error(`Tenant configuration not found for: ${tenantId}`);
        }

        const dbConnection = await databasePoolService.getConnection(tenantId, config);

        const tenantContext: TenantContext = {
          tenantId,
          config,
          dbConnection
        };

        req.tenant = tenantContext;
        res.set('X-Tenant-ID', tenantId);

        next();
      } catch (error) {
        console.error(`Error loading tenant ${tenantId}:`, error);
        this.options.onError(error as Error, req, res, next);
      }
    };
  }

  // Middleware to validate tenant access (for protected routes)
  requireTenantAccess(allowedTenants?: string[]) {
    return (req: TenantRequest, res: Response, next: NextFunction): void => {
      if (!req.tenant) {
        res.status(401).json({ error: 'Tenant context not found' });
        return;
      }

      if (allowedTenants && !allowedTenants.includes(req.tenant.tenantId)) {
        res.status(403).json({ 
          error: 'Access denied for this tenant',
          tenantId: req.tenant.tenantId
        });
        return;
      }

      next();
    };
  }

  private defaultTenantNotFoundHandler(req: Request, res: Response): void {
    res.status(400).json({
      error: 'Tenant not found or not specified',
      message: 'Please provide tenant information via subdomain, X-Tenant-ID header, or bearer token'
    });
  }

  private defaultErrorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load tenant configuration'
    });
  }
}

// Helper function to create middleware instance
export function createTenantMiddleware(options?: TenantMiddlewareOptions) {
  const middleware = new TenantMiddleware(options);
  return middleware.middleware();
}

// Export for easy use
export const tenantMiddleware = createTenantMiddleware();
