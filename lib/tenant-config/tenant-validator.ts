import { TenantConfig, CreateTenantRequest, TenantValidationResult, TenantValidationError } from './types';

export class TenantValidator {
  private static readonly RESERVED_SUBDOMAINS = [
    'www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost', 'test', 'dev', 'staging',
    'console', 'dashboard', 'portal', 'support', 'help', 'docs', 'blog', 'news'
  ];

  private static readonly SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

  /**
   * Validate create tenant request
   */
  static validateCreateRequest(request: CreateTenantRequest): TenantValidationResult {
    const errors: TenantValidationError[] = [];

    // Validate basic fields
    if (!request.name?.trim()) {
      errors.push({ field: 'name', message: 'Tenant name is required' });
    } else if (request.name.length < 2 || request.name.length > 100) {
      errors.push({ field: 'name', message: 'Tenant name must be between 2 and 100 characters' });
    }

    if (!request.subdomain?.trim()) {
      errors.push({ field: 'subdomain', message: 'Subdomain is required' });
    } else {
      const subdomainErrors = this.validateSubdomain(request.subdomain);
      errors.push(...subdomainErrors);
    }

    if (request.domain) {
      const domainErrors = this.validateDomain(request.domain);
      errors.push(...domainErrors);
    }

    // Validate admin user
    if (!request.adminEmail?.trim()) {
      errors.push({ field: 'adminEmail', message: 'Admin email is required' });
    } else if (!this.EMAIL_REGEX.test(request.adminEmail)) {
      errors.push({ field: 'adminEmail', message: 'Invalid email format' });
    }

    if (!request.adminFirstName?.trim()) {
      errors.push({ field: 'adminFirstName', message: 'Admin first name is required' });
    }

    if (!request.adminLastName?.trim()) {
      errors.push({ field: 'adminLastName', message: 'Admin last name is required' });
    }

    // Validate optional configurations
    if (request.features) {
      const featureErrors = this.validateFeatures(request.features);
      errors.push(...featureErrors);
    }

    if (request.limits) {
      const limitErrors = this.validateLimits(request.limits);
      errors.push(...limitErrors);
    }

    if (request.branding) {
      const brandingErrors = this.validateBranding(request.branding);
      errors.push(...brandingErrors);
    }

    if (request.smtp) {
      const smtpErrors = this.validateSMTP(request.smtp);
      errors.push(...smtpErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate complete tenant configuration
   */
  static validateConfig(config: TenantConfig): TenantValidationResult {
    const errors: TenantValidationError[] = [];

    // Validate basic fields
    if (!config.id?.trim()) {
      errors.push({ field: 'id', message: 'Tenant ID is required' });
    }

    if (!config.name?.trim()) {
      errors.push({ field: 'name', message: 'Tenant name is required' });
    }

    const subdomainErrors = this.validateSubdomain(config.subdomain);
    errors.push(...subdomainErrors);

    if (config.domain) {
      const domainErrors = this.validateDomain(config.domain);
      errors.push(...domainErrors);
    }

    // Validate status
    if (!['active', 'suspended', 'pending', 'archived'].includes(config.status)) {
      errors.push({ field: 'status', message: 'Invalid status value' });
    }

    // Validate database configuration
    const databaseErrors = this.validateDatabase(config.database);
    errors.push(...databaseErrors);

    // Validate features
    const featureErrors = this.validateFeatures(config.features);
    errors.push(...featureErrors);

    // Validate limits
    const limitErrors = this.validateLimits(config.limits);
    errors.push(...limitErrors);

    // Validate branding
    const brandingErrors = this.validateBranding(config.branding);
    errors.push(...brandingErrors);

    // Validate security
    const securityErrors = this.validateSecurity(config.security);
    errors.push(...securityErrors);

    // Validate SMTP
    const smtpErrors = this.validateSMTP(config.smtp);
    errors.push(...smtpErrors);

    // Validate storage
    const storageErrors = this.validateStorage(config.storage);
    errors.push(...storageErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate subdomain
   */
  static validateSubdomain(subdomain: string): TenantValidationError[] {
    const errors: TenantValidationError[] = [];

    if (!subdomain?.trim()) {
      errors.push({ field: 'subdomain', message: 'Subdomain is required' });
      return errors;
    }

    const sub = subdomain.toLowerCase().trim();

    if (sub.length < 2) {
      errors.push({ field: 'subdomain', message: 'Subdomain must be at least 2 characters long' });
    }

    if (sub.length > 63) {
      errors.push({ field: 'subdomain', message: 'Subdomain must be no more than 63 characters long' });
    }

    if (!this.SUBDOMAIN_REGEX.test(sub)) {
      errors.push({ 
        field: 'subdomain', 
        message: 'Subdomain can only contain lowercase letters, numbers, and hyphens (not at start/end)' 
      });
    }

    if (this.RESERVED_SUBDOMAINS.includes(sub)) {
      errors.push({ field: 'subdomain', message: 'This subdomain is reserved and cannot be used' });
    }

    return errors;
  }

  /**
   * Validate domain
   */
  static validateDomain(domain: string): TenantValidationError[] {
    const errors: TenantValidationError[] = [];

    if (domain && !this.DOMAIN_REGEX.test(domain)) {
      errors.push({ field: 'domain', message: 'Invalid domain format' });
    }

    return errors;
  }

  /**
   * Validate database configuration
   */
  static validateDatabase(database: TenantConfig['database']): TenantValidationError[] {
    const errors: TenantValidationError[] = [];

    if (!database.type) {
      errors.push({ field: 'database.type', message: 'Database type is required' });
    } else if (!['mysql', 'postgresql', 'sqlite'].includes(database.type)) {
      errors.push({ field: 'database.type', message: 'Invalid database type' });
    }

    if (!database.host?.trim()) {
      errors.push({ field: 'database.host', message: 'Database host is required' });
    }

    if (!database.port || database.port < 1 || database.port > 65535) {
      errors.push({ field: 'database.port', message: 'Invalid database port' });
    }

    if (!database.database?.trim()) {
      errors.push({ field: 'database.database', message: 'Database name is required' });
    }

    if (!database.username?.trim()) {
      errors.push({ field: 'database.username', message: 'Database username is required' });
    }

    if (!database.password?.trim()) {
      errors.push({ field: 'database.password', message: 'Database password is required' });
    }

    if (database.connectionLimit && (database.connectionLimit < 1 || database.connectionLimit > 100)) {
      errors.push({ field: 'database.connectionLimit', message: 'Connection limit must be between 1 and 100' });
    }

    return errors;
  }

  /**
   * Validate features configuration
   */
  static validateFeatures(features: Partial<TenantConfig['features']>): TenantValidationError[] {
    const errors: TenantValidationError[] = [];

    // Features are all boolean values, so just check types if provided
    const booleanFields = [
      'advancedEditor', 'customBranding', 'apiAccess', 'fileUpload',
      'analytics', 'customDomain', 'sslEnabled', 'multiLanguage',
      'ecommerce', 'socialLogin'
    ];

    for (const field of booleanFields) {
      if (features[field as keyof typeof features] !== undefined && 
          typeof features[field as keyof typeof features] !== 'boolean') {
        errors.push({ field: `features.${field}`, message: `${field} must be a boolean value` });
      }
    }

    return errors;
  }

  /**
   * Validate limits configuration
   */
  static validateLimits(limits: Partial<TenantConfig['limits']>): TenantValidationError[] {
    const errors: TenantValidationError[] = [];

    const numericFields = {
      maxUsers: { min: 1, max: 10000 },
      maxPages: { min: 1, max: 100000 },
      maxPosts: { min: 1, max: 1000000 },
      maxStorage: { min: 100, max: 100000 }, // 100MB to 100GB
      maxApiCalls: { min: 1000, max: 10000000 },
      maxFileSize: { min: 1, max: 1000 }, // 1MB to 1GB
      maxMenus: { min: 1, max: 100 },
      maxGalleries: { min: 1, max: 1000 },
      maxSliders: { min: 1, max: 100 }
    };

    for (const [field, constraints] of Object.entries(numericFields)) {
      const value = limits[field as keyof typeof limits];
      if (value !== undefined) {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          errors.push({ field: `limits.${field}`, message: `${field} must be an integer` });
        } else if (value < constraints.min || value > constraints.max) {
          errors.push({ 
            field: `limits.${field}`, 
            message: `${field} must be between ${constraints.min} and ${constraints.max}` 
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate branding configuration
   */
  static validateBranding(branding: Partial<TenantConfig['branding']>): TenantValidationError[] {
    const errors: TenantValidationError[] = [];

    // Validate color formats
    const colorFields = ['primaryColor', 'secondaryColor'];
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;

    for (const field of colorFields) {
      const value = branding[field as keyof typeof branding];
      if (value && !colorRegex.test(value)) {
        errors.push({ 
          field: `branding.${field}`, 
          message: `${field} must be a valid hex color (e.g., #FF0000)` 
        });
      }
    }

    // Validate string lengths
    if (branding.brandName && branding.brandName.length > 100) {
      errors.push({ field: 'branding.brandName', message: 'Brand name must be no more than 100 characters' });
    }

    if (branding.tagline && branding.tagline.length > 200) {
      errors.push({ field: 'branding.tagline', message: 'Tagline must be no more than 200 characters' });
    }

    if (branding.fontFamily && branding.fontFamily.length > 50) {
      errors.push({ field: 'branding.fontFamily', message: 'Font family must be no more than 50 characters' });
    }

    return errors;
  }

  /**
   * Validate security configuration
   */
  static validateSecurity(security: TenantConfig['security']): TenantValidationError[] {
    const errors: TenantValidationError[] = [];

    if (!security.jwtSecret || security.jwtSecret.length < 32) {
      errors.push({ field: 'security.jwtSecret', message: 'JWT secret must be at least 32 characters long' });
    }

    if (!security.encryptionKey || security.encryptionKey.length < 32) {
      errors.push({ field: 'security.encryptionKey', message: 'Encryption key must be at least 32 characters long' });
    }

    if (!security.sessionSecret || security.sessionSecret.length < 32) {
      errors.push({ field: 'security.sessionSecret', message: 'Session secret must be at least 32 characters long' });
    }

    if (security.rateLimitRequests && (security.rateLimitRequests < 1 || security.rateLimitRequests > 10000)) {
      errors.push({ 
        field: 'security.rateLimitRequests', 
        message: 'Rate limit requests must be between 1 and 10000' 
      });
    }

    return errors;
  }

  /**
   * Validate SMTP configuration
   */
  static validateSMTP(smtp: Partial<TenantConfig['smtp']>): TenantValidationError[] {
    const errors: TenantValidationError[] = [];

    if (smtp.enabled) {
      if (!smtp.host?.trim()) {
        errors.push({ field: 'smtp.host', message: 'SMTP host is required when SMTP is enabled' });
      }

      if (!smtp.port || smtp.port < 1 || smtp.port > 65535) {
        errors.push({ field: 'smtp.port', message: 'Invalid SMTP port' });
      }

      if (!smtp.username?.trim()) {
        errors.push({ field: 'smtp.username', message: 'SMTP username is required when SMTP is enabled' });
      }

      if (!smtp.password?.trim()) {
        errors.push({ field: 'smtp.password', message: 'SMTP password is required when SMTP is enabled' });
      }

      if (smtp.fromEmail && !this.EMAIL_REGEX.test(smtp.fromEmail)) {
        errors.push({ field: 'smtp.fromEmail', message: 'Invalid from email format' });
      }
    }

    return errors;
  }

  /**
   * Validate storage configuration
   */
  static validateStorage(storage: TenantConfig['storage']): TenantValidationError[] {
    const errors: TenantValidationError[] = [];

    if (!['local', 's3', 'cloudinary', 'gcs'].includes(storage.type)) {
      errors.push({ field: 'storage.type', message: 'Invalid storage type' });
    }

    if (storage.type === 'local' && !storage.basePath?.trim()) {
      errors.push({ field: 'storage.basePath', message: 'Base path is required for local storage' });
    }

    if (['s3', 'gcs'].includes(storage.type)) {
      if (!storage.bucket?.trim()) {
        errors.push({ field: 'storage.bucket', message: 'Bucket is required for cloud storage' });
      }

      if (!storage.accessKey?.trim()) {
        errors.push({ field: 'storage.accessKey', message: 'Access key is required for cloud storage' });
      }

      if (!storage.secretKey?.trim()) {
        errors.push({ field: 'storage.secretKey', message: 'Secret key is required for cloud storage' });
      }
    }

    return errors;
  }
}
