import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { TenantIdentificationResult } from '../types/tenant';

export class TenantIdentificationService {
  private jwtSecret: string;

  constructor(jwtSecret: string = process.env.JWT_SECRET || 'default-secret') {
    this.jwtSecret = jwtSecret;
  }

  identifyTenant(req: Request): TenantIdentificationResult {
    // Strategy 1: Check subdomain
    const subdomainResult = this.identifyBySubdomain(req);
    if (subdomainResult.tenantId) {
      return subdomainResult;
    }

    // Strategy 2: Check custom header
    const headerResult = this.identifyByHeader(req);
    if (headerResult.tenantId) {
      return headerResult;
    }

    // Strategy 3: Check JWT token
    const tokenResult = this.identifyByToken(req);
    if (tokenResult.tenantId) {
      return tokenResult;
    }

    // Strategy 4: Check query parameter (fallback)
    const queryResult = this.identifyByQuery(req);
    if (queryResult.tenantId) {
      return queryResult;
    }

    return { tenantId: null, method: 'none' };
  }

  private identifyBySubdomain(req: Request): TenantIdentificationResult {
    const host = req.get('host');
    if (!host) {
      return { tenantId: null, method: 'subdomain' };
    }

    // Extract subdomain (assumes format: tenant.domain.com)
    const parts = host.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      
      // Skip common subdomains
      if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
        return {
          tenantId: subdomain,
          method: 'subdomain',
          value: subdomain
        };
      }
    }

    return { tenantId: null, method: 'subdomain' };
  }

  private identifyByHeader(req: Request): TenantIdentificationResult {
    const tenantHeader = req.get('X-Tenant-ID') || req.get('x-tenant-id');
    
    if (tenantHeader && this.isValidTenantId(tenantHeader)) {
      return {
        tenantId: tenantHeader,
        method: 'header',
        value: tenantHeader
      };
    }

    return { tenantId: null, method: 'header' };
  }

  private identifyByToken(req: Request): TenantIdentificationResult {
    const authHeader = req.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { tenantId: null, method: 'token' };
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const tenantId = decoded.tenantId || decoded.tenant;
      
      if (tenantId && this.isValidTenantId(tenantId)) {
        return {
          tenantId,
          method: 'token',
          value: token
        };
      }
    } catch (error) {
      console.warn('Invalid JWT token for tenant identification:', error.message);
    }

    return { tenantId: null, method: 'token' };
  }

  private identifyByQuery(req: Request): TenantIdentificationResult {
    const tenantId = req.query.tenant as string;
    
    if (tenantId && this.isValidTenantId(tenantId)) {
      return {
        tenantId,
        method: 'header',
        value: tenantId
      };
    }

    return { tenantId: null, method: 'none' };
  }

  private isValidTenantId(tenantId: string): boolean {
    // Basic validation: alphanumeric, hyphens, underscores, 3-50 chars
    const tenantIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    return tenantIdRegex.test(tenantId);
  }

  // Generate a tenant-specific JWT token
  generateTenantToken(tenantId: string, userId?: string, expiresIn: string = '24h'): string {
    const payload: any = { tenantId };
    if (userId) {
      payload.userId = userId;
    }

    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  // Validate and extract tenant from token
  validateTenantToken(token: string): { tenantId: string; userId?: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return {
        tenantId: decoded.tenantId,
        userId: decoded.userId
      };
    } catch (error) {
      return null;
    }
  }
}
