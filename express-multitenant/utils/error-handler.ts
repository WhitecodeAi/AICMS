import { Request, Response, NextFunction } from 'express';

export enum ErrorCode {
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  TENANT_CONFIG_INVALID = 'TENANT_CONFIG_INVALID',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  UNAUTHORIZED_TENANT_ACCESS = 'UNAUTHORIZED_TENANT_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TENANT_TOKEN = 'INVALID_TENANT_TOKEN',
  TENANT_DATABASE_ERROR = 'TENANT_DATABASE_ERROR',
  TENANT_CREATION_FAILED = 'TENANT_CREATION_FAILED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION'
}

export class TenantError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly tenantId?: string;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    tenantId?: string,
    details?: any
  ) {
    super(message);
    this.name = 'TenantError';
    this.code = code;
    this.statusCode = statusCode;
    this.tenantId = tenantId;
    this.details = details;
  }
}

export class ErrorHandler {
  static handleTenantError(
    error: Error | TenantError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    console.error('Tenant Error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (error instanceof TenantError) {
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          tenantId: error.tenantId,
          details: error.details,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Handle specific error types
    if (error.message.includes('connect ECONNREFUSED')) {
      res.status(503).json({
        error: {
          code: ErrorCode.DATABASE_CONNECTION_FAILED,
          message: 'Database connection failed',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
      res.status(401).json({
        error: {
          code: ErrorCode.UNAUTHORIZED_TENANT_ACCESS,
          message: 'Database access denied',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Generic error
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }
    });
  }

  static createTenantNotFoundError(tenantId: string): TenantError {
    return new TenantError(
      ErrorCode.TENANT_NOT_FOUND,
      `Tenant '${tenantId}' not found or not configured`,
      404,
      tenantId
    );
  }

  static createDatabaseConnectionError(tenantId: string, originalError: Error): TenantError {
    return new TenantError(
      ErrorCode.DATABASE_CONNECTION_FAILED,
      `Failed to connect to database for tenant '${tenantId}'`,
      503,
      tenantId,
      { originalError: originalError.message }
    );
  }

  static createUnauthorizedAccessError(tenantId: string): TenantError {
    return new TenantError(
      ErrorCode.UNAUTHORIZED_TENANT_ACCESS,
      `Unauthorized access to tenant '${tenantId}'`,
      403,
      tenantId
    );
  }

  static createRateLimitError(tenantId?: string): TenantError {
    return new TenantError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded for this tenant',
      429,
      tenantId
    );
  }

  static createSecurityViolationError(violation: string, tenantId?: string): TenantError {
    return new TenantError(
      ErrorCode.SECURITY_VIOLATION,
      `Security violation: ${violation}`,
      400,
      tenantId,
      { violation }
    );
  }

  static createConfigInvalidError(tenantId: string, validationErrors: string[]): TenantError {
    return new TenantError(
      ErrorCode.TENANT_CONFIG_INVALID,
      `Invalid configuration for tenant '${tenantId}'`,
      400,
      tenantId,
      { validationErrors }
    );
  }

  // Wrapper for async route handlers to catch errors
  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Database error handler
  static handleDatabaseError(error: any, tenantId?: string): TenantError {
    console.error('Database error:', error);

    // MySQL specific error codes
    switch (error.code) {
      case 'ER_ACCESS_DENIED_ERROR':
        return new TenantError(
          ErrorCode.UNAUTHORIZED_TENANT_ACCESS,
          'Database access denied',
          401,
          tenantId
        );
      
      case 'ER_BAD_DB_ERROR':
        return new TenantError(
          ErrorCode.TENANT_DATABASE_ERROR,
          'Database does not exist',
          404,
          tenantId
        );
      
      case 'ECONNREFUSED':
        return new TenantError(
          ErrorCode.DATABASE_CONNECTION_FAILED,
          'Cannot connect to database server',
          503,
          tenantId
        );
      
      case 'ER_TOO_MANY_CONNECTIONS':
        return new TenantError(
          ErrorCode.DATABASE_CONNECTION_FAILED,
          'Too many database connections',
          503,
          tenantId
        );
      
      default:
        return new TenantError(
          ErrorCode.TENANT_DATABASE_ERROR,
          'Database operation failed',
          500,
          tenantId,
          { originalError: error.message }
        );
    }
  }

  // Graceful shutdown handler
  static setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Close database pools
        const { databasePoolService } = await import('../services/database-pool.service');
        await databasePoolService.closeAllPools();
        
        console.log('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }
}

// Middleware for handling async errors
export const asyncErrorHandler = ErrorHandler.asyncHandler;

// Default error handling middleware
export const errorHandlingMiddleware = ErrorHandler.handleTenantError;
