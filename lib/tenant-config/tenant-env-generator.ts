import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import DomainTenantService from './domain-tenant-service';

export interface TenantEnvTemplate {
  // Database Configuration
  databaseHost: string;
  databasePort: number;
  databaseName: string;
  databaseUser: string;
  databasePassword: string;
  databaseCharset?: string;
  databaseSsl?: boolean;

  // Tenant Information
  tenantId: string;
  tenantName: string;

  // Security Keys (auto-generated if not provided)
  jwtSecret?: string;
  encryptionKey?: string;
  sessionSecret?: string;

  // Additional Environment Variables
  additionalVars?: Record<string, string>;
}

export interface GeneratedTenantEnv {
  envFile: string;
  envPath: string;
  databaseUrl: string;
  tenantId: string;
  domain: string;
  generatedAt: Date;
}

/**
 * Tenant environment file generator
 * Creates .env files for new tenants based on domain patterns
 */
export class TenantEnvGenerator {
  /**
   * Generate environment file for a tenant
   */
  static async generateTenantEnv(
    domain: string,
    template: TenantEnvTemplate
  ): Promise<GeneratedTenantEnv> {
    // Generate env file name from domain
    const envFile = DomainTenantService.domainToEnvFileName(domain);
    const envPath = path.join(process.cwd(), envFile);

    // Generate security keys if not provided
    const jwtSecret = template.jwtSecret || this.generateSecureKey(64);
    const encryptionKey = template.encryptionKey || this.generateSecureKey(32);
    const sessionSecret = template.sessionSecret || this.generateSecureKey(64);

    // Create database URL
    const databaseUrl = this.createDatabaseUrl(template);

    // Generate env file content
    const envContent = this.createEnvFileContent(template, {
      jwtSecret,
      encryptionKey,
      sessionSecret,
      databaseUrl
    });

    // Write env file
    await fs.writeFile(envPath, envContent, 'utf-8');

    // Add domain mapping
    await DomainTenantService.addDomainMapping({
      domain,
      envFile,
      tenantType: this.determineTenantType(domain),
      isActive: true
    });

    console.log(`✅ Generated tenant environment file: ${envFile}`);

    return {
      envFile,
      envPath,
      databaseUrl,
      tenantId: template.tenantId,
      domain,
      generatedAt: new Date()
    };
  }

  /**
   * Generate environment files for both admin and website tenants
   */
  static async generateTenantPair(
    baseDomain: string,
    tenantId: string,
    template: Omit<TenantEnvTemplate, 'tenantId'>
  ): Promise<{
    admin: GeneratedTenantEnv;
    website: GeneratedTenantEnv;
  }> {
    // Parse base domain (e.g., "whitecodetech.com")
    const domainParts = baseDomain.split('.');
    const baseDomainName = domainParts.join('.');

    // Create domains
    const adminDomain = `${tenantId}admin.${baseDomainName}`;
    const websiteDomain = `${tenantId}.${baseDomainName}`;

    // Create database names
    const adminDbName = `${tenantId}_admin_cms`;
    const websiteDbName = `${tenantId}_cms`;

    // Generate admin environment
    const adminTemplate: TenantEnvTemplate = {
      ...template,
      tenantId: `${tenantId}_admin`,
      databaseName: adminDbName,
      databaseUser: template.databaseUser || `${tenantId}_admin_user`,
      databasePassword: template.databasePassword || this.generateSecureKey(16)
    };

    // Generate website environment
    const websiteTemplate: TenantEnvTemplate = {
      ...template,
      tenantId: tenantId,
      databaseName: websiteDbName,
      databaseUser: template.databaseUser || `${tenantId}_user`,
      databasePassword: template.databasePassword || this.generateSecureKey(16)
    };

    const admin = await this.generateTenantEnv(adminDomain, adminTemplate);
    const website = await this.generateTenantEnv(websiteDomain, websiteTemplate);

    return { admin, website };
  }

  /**
   * Create database URL from template
   */
  private static createDatabaseUrl(template: TenantEnvTemplate): string {
    const {
      databaseHost,
      databasePort,
      databaseName,
      databaseUser,
      databasePassword,
      databaseSsl
    } = template;

    let url = `mysql://${databaseUser}:${databasePassword}@${databaseHost}:${databasePort}/${databaseName}`;
    
    if (databaseSsl) {
      url += '?ssl=true';
    }

    return url;
  }

  /**
   * Create environment file content
   */
  private static createEnvFileContent(
    template: TenantEnvTemplate,
    generated: {
      jwtSecret: string;
      encryptionKey: string;
      sessionSecret: string;
      databaseUrl: string;
    }
  ): string {
    const timestamp = new Date().toISOString();
    
    return `# Environment configuration for tenant: ${template.tenantId}
# Domain: ${template.tenantName}
# Generated: ${timestamp}

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DATABASE_URL="${generated.databaseUrl}"
DATABASE_HOST="${template.databaseHost}"
DATABASE_PORT="${template.databasePort}"
DATABASE_NAME="${template.databaseName}"
DATABASE_USER="${template.databaseUser}"
DATABASE_PASSWORD="${template.databasePassword}"
DATABASE_CHARSET="${template.databaseCharset || 'utf8mb4'}"
${template.databaseSsl ? 'DATABASE_SSL="true"' : '# DATABASE_SSL="false"'}

# ===========================================
# TENANT INFORMATION
# ===========================================
TENANT_ID="${template.tenantId}"
TENANT_NAME="${template.tenantName}"

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
JWT_SECRET="${generated.jwtSecret}"
ENCRYPTION_KEY="${generated.encryptionKey}"
SESSION_SECRET="${generated.sessionSecret}"

# ===========================================
# APPLICATION CONFIGURATION
# ===========================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://${template.tenantName}"

# ===========================================
# ADDITIONAL ENVIRONMENT VARIABLES
# ===========================================
${this.formatAdditionalVars(template.additionalVars)}

# ===========================================
# SYSTEM CONFIGURATION
# ===========================================
# Auto-generated tenant configuration
TENANT_CONFIG_VERSION="1.0"
TENANT_CONFIG_GENERATED="${timestamp}"
`;
  }

  /**
   * Format additional environment variables
   */
  private static formatAdditionalVars(additionalVars?: Record<string, string>): string {
    if (!additionalVars || Object.keys(additionalVars).length === 0) {
      return '# No additional environment variables';
    }

    return Object.entries(additionalVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
  }

  /**
   * Determine tenant type from domain
   */
  private static determineTenantType(domain: string): 'admin' | 'website' {
    return domain.includes('admin') ? 'admin' : 'website';
  }

  /**
   * Generate secure random key
   */
  private static generateSecureKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Update existing tenant environment file
   */
  static async updateTenantEnv(
    domain: string,
    updates: Partial<TenantEnvTemplate>
  ): Promise<void> {
    const envFile = DomainTenantService.domainToEnvFileName(domain);
    const envPath = path.join(process.cwd(), envFile);

    try {
      // Check if file exists
      await fs.access(envPath);
      
      // Read current content
      let content = await fs.readFile(envPath, 'utf-8');

      // Update variables
      for (const [key, value] of Object.entries(this.flattenTemplate(updates))) {
        if (value !== undefined) {
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(content)) {
            content = content.replace(regex, `${key}="${value}"`);
          } else {
            content += `\n${key}="${value}"`;
          }
        }
      }

      // Update timestamp
      const timestamp = new Date().toISOString();
      content = content.replace(
        /^TENANT_CONFIG_GENERATED=.*$/m,
        `TENANT_CONFIG_GENERATED="${timestamp}"`
      );

      // Write updated content
      await fs.writeFile(envPath, content, 'utf-8');
      
      console.log(`✅ Updated tenant environment file: ${envFile}`);
    } catch (error) {
      console.error(`Failed to update tenant environment file ${envFile}:`, error);
      throw error;
    }
  }

  /**
   * Flatten template to key-value pairs
   */
  private static flattenTemplate(template: Partial<TenantEnvTemplate>): Record<string, string> {
    const flattened: Record<string, string> = {};

    if (template.databaseHost) flattened.DATABASE_HOST = template.databaseHost;
    if (template.databasePort) flattened.DATABASE_PORT = template.databasePort.toString();
    if (template.databaseName) flattened.DATABASE_NAME = template.databaseName;
    if (template.databaseUser) flattened.DATABASE_USER = template.databaseUser;
    if (template.databasePassword) flattened.DATABASE_PASSWORD = template.databasePassword;
    if (template.databaseCharset) flattened.DATABASE_CHARSET = template.databaseCharset;
    if (template.databaseSsl !== undefined) flattened.DATABASE_SSL = template.databaseSsl.toString();
    if (template.tenantId) flattened.TENANT_ID = template.tenantId;
    if (template.tenantName) flattened.TENANT_NAME = template.tenantName;
    if (template.jwtSecret) flattened.JWT_SECRET = template.jwtSecret;
    if (template.encryptionKey) flattened.ENCRYPTION_KEY = template.encryptionKey;
    if (template.sessionSecret) flattened.SESSION_SECRET = template.sessionSecret;

    // Add additional vars
    if (template.additionalVars) {
      Object.assign(flattened, template.additionalVars);
    }

    // Update database URL if relevant fields changed
    if (template.databaseHost || template.databasePort || template.databaseName || 
        template.databaseUser || template.databasePassword || template.databaseSsl) {
      const currentTemplate = {
        databaseHost: template.databaseHost || '',
        databasePort: template.databasePort || 3306,
        databaseName: template.databaseName || '',
        databaseUser: template.databaseUser || '',
        databasePassword: template.databasePassword || '',
        databaseSsl: template.databaseSsl || false
      };
      flattened.DATABASE_URL = this.createDatabaseUrl(currentTemplate as TenantEnvTemplate);
    }

    return flattened;
  }

  /**
   * Delete tenant environment file
   */
  static async deleteTenantEnv(domain: string): Promise<void> {
    const envFile = DomainTenantService.domainToEnvFileName(domain);
    const envPath = path.join(process.cwd(), envFile);

    try {
      await fs.unlink(envPath);
      await DomainTenantService.removeDomainMapping(domain);
      console.log(`✅ Deleted tenant environment file: ${envFile}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to delete tenant environment file ${envFile}:`, error);
        throw error;
      }
    }
  }

  /**
   * List all tenant environment files
   */
  static async listTenantEnvFiles(): Promise<Array<{
    domain: string;
    envFile: string;
    exists: boolean;
    size?: number;
    modifiedAt?: Date;
  }>> {
    const mappings = await DomainTenantService.listDomainMappings();
    const result = [];

    for (const mapping of mappings) {
      const envPath = path.join(process.cwd(), mapping.envFile);
      let exists = false;
      let size = undefined;
      let modifiedAt = undefined;

      try {
        const stats = await fs.stat(envPath);
        exists = true;
        size = stats.size;
        modifiedAt = stats.mtime;
      } catch (error) {
        // File doesn't exist
      }

      result.push({
        domain: mapping.domain,
        envFile: mapping.envFile,
        exists,
        size,
        modifiedAt
      });
    }

    return result;
  }

  /**
   * Validate tenant environment file
   */
  static async validateTenantEnvFile(domain: string): Promise<{
    isValid: boolean;
    exists: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const envFile = DomainTenantService.domainToEnvFileName(domain);
    const envPath = path.join(process.cwd(), envFile);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if file exists
    let exists = false;
    try {
      await fs.access(envPath);
      exists = true;
    } catch {
      errors.push('Environment file does not exist');
      return { isValid: false, exists, errors, warnings };
    }

    // Load and validate content
    try {
      const envConfig = await DomainTenantService.loadTenantEnv(envFile);
      if (!envConfig) {
        errors.push('Failed to load environment configuration');
        return { isValid: false, exists, errors, warnings };
      }

      // Validate required fields
      const validation = DomainTenantService.validateTenantEnv(envConfig);
      if (!validation.isValid) {
        errors.push(...validation.missingFields.map(field => `Missing required field: ${field}`));
      }

      // Check for weak security keys
      if (envConfig.JWT_SECRET && envConfig.JWT_SECRET.length < 32) {
        warnings.push('JWT_SECRET should be at least 32 characters long');
      }

      if (envConfig.ENCRYPTION_KEY && envConfig.ENCRYPTION_KEY.length < 32) {
        warnings.push('ENCRYPTION_KEY should be at least 32 characters long');
      }

      // Check database URL format
      if (envConfig.DATABASE_URL && !envConfig.DATABASE_URL.startsWith('mysql://')) {
        warnings.push('DATABASE_URL should start with mysql://');
      }

    } catch (error) {
      errors.push(`Failed to validate environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      exists,
      errors,
      warnings
    };
  }

  /**
   * Create example tenant environment
   */
  static async createExampleTenant(): Promise<GeneratedTenantEnv[]> {
    const examples = await this.generateTenantPair('whitecodetech.com', 'example', {
      databaseHost: 'localhost',
      databasePort: 3306,
      databaseUser: 'example_user',
      databasePassword: 'example_password_123',
      tenantName: 'Example Tenant',
      additionalVars: {
        'NEXT_PUBLIC_SITE_NAME': 'Example Site',
        'SUPPORT_EMAIL': 'support@example.com'
      }
    });

    return [examples.admin, examples.website];
  }
}

export default TenantEnvGenerator;
