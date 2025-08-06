import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { TenantConfig, TenantConfigManager } from '../tenant-config';

export class TenantUtils {
  private static configManager = TenantConfigManager.getInstance();

  /**
   * Create example tenant configurations for development
   */
  static async createExampleTenants(): Promise<void> {
    const tenantsDir = path.join(process.cwd(), 'config', 'tenants');
    
    // Ensure directory exists
    await fs.mkdir(tenantsDir, { recursive: true });

    // Create demo tenant
    const demoTenant: TenantConfig = {
      id: 'demo',
      name: 'Demo Company',
      subdomain: 'demo',
      status: 'active',
      
      database: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'demo_cms',
        username: 'demo_user',
        password: this.generateSecureKey(16),
        ssl: false,
        connectionLimit: 10,
        url: 'mysql://demo_user:password@localhost:3306/demo_cms'
      },
      
      features: {
        advancedEditor: true,
        customBranding: true,
        apiAccess: true,
        fileUpload: true,
        analytics: true,
        customDomain: false,
        sslEnabled: false,
        multiLanguage: false,
        ecommerce: false,
        socialLogin: false
      },
      
      limits: {
        maxUsers: 25,
        maxPages: 500,
        maxPosts: 1000,
        maxStorage: 2000, // 2GB
        maxApiCalls: 25000,
        maxFileSize: 50, // 50MB
        maxMenus: 5,
        maxGalleries: 20,
        maxSliders: 5
      },
      
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        fontFamily: 'Inter',
        brandName: 'Demo CMS',
        tagline: 'Your demo website builder'
      },
      
      seo: {
        defaultTitle: 'Demo CMS',
        defaultDescription: 'A demo content management system',
        sitemapEnabled: true
      },
      
      security: {
        jwtSecret: this.generateSecureKey(64),
        encryptionKey: this.generateSecureKey(32),
        sessionSecret: this.generateSecureKey(64),
        apiKeyEnabled: true,
        apiKey: this.generateSecureKey(32),
        corsOrigins: [],
        rateLimitEnabled: true,
        rateLimitRequests: 100
      },
      
      smtp: {
        enabled: false
      },
      
      storage: {
        type: 'local',
        basePath: '/uploads/demo'
      },
      
      environment: {
        NODE_ENV: 'development',
        TENANT_MODE: 'demo'
      },
      
      customSettings: {
        welcomeMessage: 'Welcome to the demo tenant!',
        supportEmail: 'demo@example.com'
      },
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      adminUser: {
        email: 'admin@demo.com',
        firstName: 'Demo',
        lastName: 'Admin'
      }
    };

    // Create enterprise tenant
    const enterpriseTenant: TenantConfig = {
      id: 'enterprise',
      name: 'Enterprise Corp',
      subdomain: 'enterprise',
      domain: 'cms.enterprise.com',
      status: 'active',
      
      database: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'enterprise_cms',
        username: 'enterprise_user',
        password: this.generateSecureKey(16),
        ssl: true,
        connectionLimit: 20,
        url: 'mysql://enterprise_user:password@localhost:3306/enterprise_cms'
      },
      
      features: {
        advancedEditor: true,
        customBranding: true,
        apiAccess: true,
        fileUpload: true,
        analytics: true,
        customDomain: true,
        sslEnabled: true,
        multiLanguage: true,
        ecommerce: true,
        socialLogin: true
      },
      
      limits: {
        maxUsers: 500,
        maxPages: 10000,
        maxPosts: 50000,
        maxStorage: 50000, // 50GB
        maxApiCalls: 500000,
        maxFileSize: 500, // 500MB
        maxMenus: 50,
        maxGalleries: 500,
        maxSliders: 20
      },
      
      branding: {
        primaryColor: '#ef4444',
        secondaryColor: '#f97316',
        fontFamily: 'Roboto',
        brandName: 'Enterprise CMS',
        tagline: 'Enterprise-grade content management',
        customCSS: '.enterprise-theme { background: linear-gradient(45deg, #ef4444, #f97316); }'
      },
      
      seo: {
        defaultTitle: 'Enterprise CMS',
        defaultDescription: 'Enterprise content management system',
        sitemapEnabled: true,
        googleAnalyticsId: 'GA-ENTERPRISE-123'
      },
      
      security: {
        jwtSecret: this.generateSecureKey(64),
        encryptionKey: this.generateSecureKey(32),
        sessionSecret: this.generateSecureKey(64),
        apiKeyEnabled: true,
        apiKey: this.generateSecureKey(32),
        corsOrigins: ['https://enterprise.com', 'https://app.enterprise.com'],
        rateLimitEnabled: true,
        rateLimitRequests: 1000
      },
      
      smtp: {
        enabled: true,
        host: 'smtp.enterprise.com',
        port: 587,
        username: 'noreply@enterprise.com',
        password: 'smtp_password',
        fromEmail: 'noreply@enterprise.com',
        fromName: 'Enterprise CMS'
      },
      
      storage: {
        type: 's3',
        bucket: 'enterprise-cms-files',
        region: 'us-east-1',
        accessKey: 'AWS_ACCESS_KEY',
        secretKey: 'AWS_SECRET_KEY'
      },
      
      environment: {
        NODE_ENV: 'production',
        TENANT_MODE: 'enterprise',
        ENTERPRISE_FEATURES: 'enabled'
      },
      
      customSettings: {
        welcomeMessage: 'Welcome to Enterprise CMS',
        supportEmail: 'support@enterprise.com',
        maintenanceMode: false,
        backupEnabled: true,
        auditLogging: true
      },
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      adminUser: {
        email: 'admin@enterprise.com',
        firstName: 'Enterprise',
        lastName: 'Admin'
      }
    };

    // Save tenant configurations
    await fs.writeFile(
      path.join(tenantsDir, 'demo.json'),
      JSON.stringify(demoTenant, null, 2)
    );

    await fs.writeFile(
      path.join(tenantsDir, 'enterprise.json'),
      JSON.stringify(enterpriseTenant, null, 2)
    );

    console.log('✅ Example tenant configurations created successfully');
  }

  /**
   * Backup all tenant configurations
   */
  static async backupTenantConfigs(backupDir?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultBackupDir = path.join(process.cwd(), 'backups', 'tenants');
    const targetDir = backupDir || path.join(defaultBackupDir, `backup-${timestamp}`);

    // Ensure backup directory exists
    await fs.mkdir(targetDir, { recursive: true });

    // Get all tenant configurations
    const tenants = await this.configManager.listTenants();

    for (const tenant of tenants) {
      const backupFile = path.join(targetDir, `${tenant.id}.json`);
      await fs.writeFile(backupFile, JSON.stringify(tenant, null, 2));
    }

    console.log(`✅ Backed up ${tenants.length} tenant configurations to: ${targetDir}`);
    return targetDir;
  }

  /**
   * Restore tenant configurations from backup
   */
  static async restoreTenantConfigs(backupDir: string): Promise<number> {
    try {
      const files = await fs.readdir(backupDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      let restoredCount = 0;

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(backupDir, file);
          const configData = await fs.readFile(filePath, 'utf-8');
          const config = JSON.parse(configData) as TenantConfig;

          // Validate configuration
          const validation = this.configManager.validateConfig(config);
          if (!validation.isValid) {
            console.warn(`Skipping invalid config ${file}: ${validation.errors[0].message}`);
            continue;
          }

          // Save configuration
          const tenantsDir = path.join(process.cwd(), 'config', 'tenants');
          await fs.mkdir(tenantsDir, { recursive: true });
          await fs.writeFile(
            path.join(tenantsDir, file),
            JSON.stringify(config, null, 2)
          );

          restoredCount++;
        } catch (error) {
          console.error(`Failed to restore ${file}:`, error);
        }
      }

      console.log(`✅ Restored ${restoredCount} tenant configurations from: ${backupDir}`);
      return restoredCount;
    } catch (error) {
      console.error('Failed to restore tenant configurations:', error);
      throw error;
    }
  }

  /**
   * Migrate tenant configurations to new schema
   */
  static async migrateTenantConfigs(migrationFn: (config: TenantConfig) => TenantConfig): Promise<number> {
    const tenants = await this.configManager.listTenants();
    let migratedCount = 0;

    for (const tenant of tenants) {
      try {
        const migratedConfig = migrationFn(tenant);
        
        // Validate migrated configuration
        const validation = this.configManager.validateConfig(migratedConfig);
        if (!validation.isValid) {
          console.warn(`Migration failed for ${tenant.id}: ${validation.errors[0].message}`);
          continue;
        }

        // Update configuration
        await this.configManager.updateTenantConfig(tenant.id, migratedConfig);
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate tenant ${tenant.id}:`, error);
      }
    }

    console.log(`✅ Migrated ${migratedCount} tenant configurations`);
    return migratedCount;
  }

  /**
   * Generate tenant configuration report
   */
  static async generateTenantReport(): Promise<{
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    tenantsByFeature: Record<string, number>;
    storageByType: Record<string, number>;
    databaseTypes: Record<string, number>;
  }> {
    const tenants = await this.configManager.listTenants();

    const report = {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.status === 'active').length,
      suspendedTenants: tenants.filter(t => t.status === 'suspended').length,
      tenantsByFeature: {} as Record<string, number>,
      storageByType: {} as Record<string, number>,
      databaseTypes: {} as Record<string, number>
    };

    // Count features
    const features = [
      'advancedEditor', 'customBranding', 'apiAccess', 'fileUpload',
      'analytics', 'customDomain', 'sslEnabled', 'multiLanguage',
      'ecommerce', 'socialLogin'
    ];

    features.forEach(feature => {
      report.tenantsByFeature[feature] = tenants.filter(
        t => t.features[feature as keyof typeof t.features]
      ).length;
    });

    // Count storage types
    tenants.forEach(tenant => {
      const storageType = tenant.storage.type;
      report.storageByType[storageType] = (report.storageByType[storageType] || 0) + 1;
    });

    // Count database types
    tenants.forEach(tenant => {
      const dbType = tenant.database.type;
      report.databaseTypes[dbType] = (report.databaseTypes[dbType] || 0) + 1;
    });

    return report;
  }

  /**
   * Validate all tenant configurations
   */
  static async validateAllTenantConfigs(): Promise<{
    valid: number;
    invalid: number;
    errors: Array<{ tenantId: string; errors: string[] }>;
  }> {
    const tenants = await this.configManager.listTenants();
    const result = {
      valid: 0,
      invalid: 0,
      errors: [] as Array<{ tenantId: string; errors: string[] }>
    };

    for (const tenant of tenants) {
      const validation = this.configManager.validateConfig(tenant);
      if (validation.isValid) {
        result.valid++;
      } else {
        result.invalid++;
        result.errors.push({
          tenantId: tenant.id,
          errors: validation.errors.map(e => e.message)
        });
      }
    }

    return result;
  }

  /**
   * Clean up orphaned tenant files
   */
  static async cleanupOrphanedFiles(): Promise<number> {
    // This would implement cleanup of files that belong to deleted tenants
    // For now, just return 0 as placeholder
    return 0;
  }

  /**
   * Get tenant configuration file path
   */
  static getTenantConfigPath(tenantId: string): string {
    return path.join(process.cwd(), 'config', 'tenants', `${tenantId}.json`);
  }

  /**
   * Check if tenant configuration file exists
   */
  static async tenantConfigExists(tenantId: string): Promise<boolean> {
    try {
      const configPath = this.getTenantConfigPath(tenantId);
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate secure key
   */
  private static generateSecureKey(length: number): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default TenantUtils;
