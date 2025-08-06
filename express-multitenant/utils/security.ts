import crypto from 'crypto';
import { TenantConfig } from '../types/tenant';

export class SecurityUtils {
  // Validate tenant configuration for security
  static validateTenantConfig(config: TenantConfig): string[] {
    const issues: string[] = [];

    // Check for SQL injection patterns in database config
    const sqlInjectionPatterns = [
      /['";]/,
      /--/,
      /\/\*/,
      /xp_/i,
      /sp_/i,
    ];

    const sensitiveFields = [
      config.database.host,
      config.database.database,
      config.database.user,
      config.subdomain,
      config.tenantId
    ];

    for (const field of sensitiveFields) {
      if (field) {
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(field)) {
            issues.push(`Potentially dangerous characters detected in configuration field: ${field}`);
          }
        }
      }
    }

    // Validate database connection limits
    if (config.database.connectionLimit && config.database.connectionLimit > 100) {
      issues.push('Database connection limit is too high (max 100 recommended)');
    }

    // Check for secure password requirements
    if (config.database.password && config.database.password.length < 8) {
      issues.push('Database password should be at least 8 characters long');
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(config.subdomain)) {
      issues.push('Invalid subdomain format - must be lowercase alphanumeric with hyphens');
    }

    return issues;
  }

  // Sanitize database queries
  static sanitizeQuery(query: string): string {
    // Remove dangerous SQL patterns
    const dangerousPatterns = [
      /;\s*(drop|delete|truncate|alter|create|insert|update)\s+/gi,
      /union\s+select/gi,
      /\/\*.*?\*\//g,
      /--.*$/gm,
    ];

    let sanitized = query;
    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  // Rate limiting helper
  static createRateLimiter(windowMs: number = 900000, max: number = 100) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      for (const [key, value] of requests.entries()) {
        if (value.resetTime < windowStart) {
          requests.delete(key);
        }
      }

      const current = requests.get(identifier) || { count: 0, resetTime: now + windowMs };
      
      if (current.resetTime < now) {
        current.count = 0;
        current.resetTime = now + windowMs;
      }

      current.count++;
      requests.set(identifier, current);

      return {
        allowed: current.count <= max,
        remaining: Math.max(0, max - current.count),
        resetTime: current.resetTime
      };
    };
  }

  // Encrypt sensitive configuration data
  static encryptConfig(config: TenantConfig, encryptionKey: string): TenantConfig {
    const sensitiveFields = ['password'];
    const encrypted = { ...config };
    
    if (encrypted.database.password) {
      encrypted.database.password = this.encrypt(encrypted.database.password, encryptionKey);
    }

    return encrypted;
  }

  // Decrypt sensitive configuration data
  static decryptConfig(config: TenantConfig, encryptionKey: string): TenantConfig {
    const decrypted = { ...config };
    
    if (decrypted.database.password) {
      try {
        decrypted.database.password = this.decrypt(decrypted.database.password, encryptionKey);
      } catch (error) {
        console.error('Failed to decrypt database password:', error);
        throw new Error('Invalid encryption key or corrupted configuration');
      }
    }

    return decrypted;
  }

  private static encrypt(text: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, keyHash);
    cipher.setAAD(Buffer.from('tenant-config'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private static decrypt(encryptedData: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const keyHash = crypto.createHash('sha256').update(key).digest();
    
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, keyHash);
    decipher.setAAD(Buffer.from('tenant-config'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Generate secure random tenant ID
  static generateSecureTenantId(prefix?: string): string {
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return prefix ? `${prefix}-${randomBytes}` : randomBytes;
  }

  // Validate IP whitelist
  static isIPAllowed(ip: string, whitelist: string[]): boolean {
    if (!whitelist || whitelist.length === 0) {
      return true; // No restrictions
    }

    return whitelist.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // CIDR notation support (basic)
        const [network, prefixLength] = allowedIP.split('/');
        // Simplified CIDR check - in production use a proper CIDR library
        return ip.startsWith(network.split('.').slice(0, Math.floor(parseInt(prefixLength) / 8)).join('.'));
      }
      return ip === allowedIP;
    });
  }

  // Log security events
  static logSecurityEvent(event: {
    type: 'TENANT_ACCESS' | 'CONFIG_LOADED' | 'DB_CONNECTION' | 'RATE_LIMIT' | 'UNAUTHORIZED';
    tenantId?: string;
    ip: string;
    userAgent?: string;
    details?: any;
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: event.type,
      tenantId: event.tenantId || 'unknown',
      ip: event.ip,
      userAgent: event.userAgent || 'unknown',
      details: event.details
    };

    // In production, send to proper logging service
    console.log('[SECURITY]', JSON.stringify(logEntry));
  }
}
