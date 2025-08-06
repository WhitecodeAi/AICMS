import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export interface DomainTenantMapping {
  domain: string;
  envFile: string;
  tenantType: 'admin' | 'website';
  isActive: boolean;
}

export interface TenantEnvConfig {
  DATABASE_URL: string;
  DATABASE_HOST: string;
  DATABASE_PORT: string;
  DATABASE_NAME: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  TENANT_ID: string;
  TENANT_NAME: string;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  SESSION_SECRET: string;
  [key: string]: string;
}

/**
 * Domain-based tenant identification service
 * Maps domains to .env files for multi-tenant support
 */
export class DomainTenantService {
  private static envCache = new Map<string, TenantEnvConfig>();
  private static domainMappings: DomainTenantMapping[] = [];
  private static initialized = false;

  /**
   * Initialize the service with domain mappings
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load domain mappings from configuration file
      await this.loadDomainMappings();
      this.initialized = true;
      console.log('✅ Domain tenant service initialized');
    } catch (error) {
      console.error('Failed to initialize domain tenant service:', error);
      throw error;
    }
  }

  /**
   * Load domain mappings configuration
   */
  private static async loadDomainMappings(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'config', 'domain-mappings.json');
      
      // Check if config file exists
      try {
        await fs.access(configPath);
      } catch {
        // Create default configuration if file doesn't exist
        await this.createDefaultDomainMappings();
        return;
      }

      const configContent = await fs.readFile(configPath, 'utf-8');
      this.domainMappings = JSON.parse(configContent);
    } catch (error) {
      console.error('Failed to load domain mappings:', error);
      // Use default mappings as fallback
      this.domainMappings = this.getDefaultDomainMappings();
    }
  }

  /**
   * Create default domain mappings configuration
   */
  private static async createDefaultDomainMappings(): Promise<void> {
    const configDir = path.join(process.cwd(), 'config');
    const configPath = path.join(configDir, 'domain-mappings.json');

    // Ensure config directory exists
    await fs.mkdir(configDir, { recursive: true });

    const defaultMappings = this.getDefaultDomainMappings();
    
    await fs.writeFile(configPath, JSON.stringify(defaultMappings, null, 2));
    this.domainMappings = defaultMappings;
    
    console.log('✅ Created default domain mappings configuration');
  }

  /**
   * Get default domain mappings
   */
  private static getDefaultDomainMappings(): DomainTenantMapping[] {
    return [
      {
        domain: 'demoadmin.whitecodetech.com',
        envFile: '.env.demoadminwhitecodetechcom',
        tenantType: 'admin',
        isActive: true
      },
      {
        domain: 'demo.whitecodetech.com',
        envFile: '.env.demowhitecodetechcom',
        tenantType: 'website',
        isActive: true
      },
      {
        domain: 'hirayadmin.whitecodetech.com',
        envFile: '.env.hirayadminwhitecodetechcom',
        tenantType: 'admin',
        isActive: true
      },
      {
        domain: 'hiray.whitecodetech.com',
        envFile: '.env.hiraywhitecodetechcom',
        tenantType: 'website',
        isActive: true
      }
    ];
  }

  /**
   * Convert domain to env file name
   * Example: hirayadmin.whitecodetech.com → .env.hirayadminwhitecodetechcom
   */
  static domainToEnvFileName(domain: string): string {
    // Remove port if present
    const cleanDomain = domain.split(':')[0];
    
    // Convert domain to env file name by removing dots and adding .env prefix
    const envFileName = `.env.${cleanDomain.replace(/\./g, '')}`;
    
    return envFileName;
  }

  /**
   * Identify tenant from domain
   */
  static async identifyTenantFromDomain(domain: string): Promise<DomainTenantMapping | null> {
    await this.initialize();

    // Remove port if present
    const cleanDomain = domain.split(':')[0];

    // First, try exact match
    let mapping = this.domainMappings.find(m => m.domain === cleanDomain && m.isActive);
    
    // If no exact match, try to find by subdomain pattern
    if (!mapping) {
      // Extract subdomain for pattern matching
      const parts = cleanDomain.split('.');
      if (parts.length >= 3) {
        const subdomain = parts[0];
        const baseDomain = parts.slice(1).join('.');
        
        // Look for patterns like {tenant}admin.domain.com or {tenant}.domain.com
        mapping = this.domainMappings.find(m => {
          const mParts = m.domain.split('.');
          if (mParts.length >= 3) {
            const mSubdomain = mParts[0];
            const mBaseDomain = mParts.slice(1).join('.');
            
            // Check if base domains match and subdomain patterns match
            return mBaseDomain === baseDomain && 
                   (mSubdomain === subdomain || 
                    mSubdomain.includes(subdomain) || 
                    subdomain.includes(mSubdomain));
          }
          return false;
        });
      }
    }

    return mapping || null;
  }

  /**
   * Load tenant environment variables from .env file
   */
  static async loadTenantEnv(envFileName: string): Promise<TenantEnvConfig | null> {
    // Check cache first
    if (this.envCache.has(envFileName)) {
      return this.envCache.get(envFileName)!;
    }

    try {
      const envPath = path.join(process.cwd(), envFileName);
      
      // Check if env file exists
      try {
        await fs.access(envPath);
      } catch {
        console.warn(`Environment file not found: ${envFileName}`);
        return null;
      }

      const envContent = await fs.readFile(envPath, 'utf-8');
      const envConfig: TenantEnvConfig = {} as TenantEnvConfig;

      // Parse .env file
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            let value = trimmedLine.substring(equalIndex + 1).trim();
            
            // Remove surrounding quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            
            envConfig[key] = value;
          }
        }
      }

      // Cache the configuration
      this.envCache.set(envFileName, envConfig);
      
      return envConfig;
    } catch (error) {
      console.error(`Failed to load environment file ${envFileName}:`, error);
      return null;
    }
  }

  /**
   * Get tenant information from NextRequest
   */
  static async getTenantFromRequest(request: NextRequest): Promise<{
    domain: string;
    mapping: DomainTenantMapping;
    envConfig: TenantEnvConfig;
    tenantId: string;
  } | null> {
    const host = request.headers.get('host');
    if (!host) return null;

    const mapping = await this.identifyTenantFromDomain(host);
    if (!mapping) return null;

    const envConfig = await this.loadTenantEnv(mapping.envFile);
    if (!envConfig) return null;

    const tenantId = envConfig.TENANT_ID || this.extractTenantIdFromDomain(host);

    return {
      domain: host,
      mapping,
      envConfig,
      tenantId
    };
  }

  /**
   * Extract tenant ID from domain
   * Example: hirayadmin.whitecodetech.com → hiray
   */
  private static extractTenantIdFromDomain(domain: string): string {
    const parts = domain.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      // Remove 'admin' suffix if present
      return subdomain.replace(/admin$/, '');
    }
    return domain.replace(/\./g, '');
  }

  /**
   * Set tenant environment variables in process.env
   */
  static setTenantEnvironment(envConfig: TenantEnvConfig): void {
    // Set database-related environment variables
    process.env.DATABASE_URL = envConfig.DATABASE_URL;
    process.env.DATABASE_HOST = envConfig.DATABASE_HOST;
    process.env.DATABASE_PORT = envConfig.DATABASE_PORT;
    process.env.DATABASE_NAME = envConfig.DATABASE_NAME;
    process.env.DATABASE_USER = envConfig.DATABASE_USER;
    process.env.DATABASE_PASSWORD = envConfig.DATABASE_PASSWORD;

    // Set tenant-specific variables
    process.env.TENANT_ID = envConfig.TENANT_ID;
    process.env.TENANT_NAME = envConfig.TENANT_NAME;

    // Set security-related variables
    process.env.JWT_SECRET = envConfig.JWT_SECRET;
    process.env.ENCRYPTION_KEY = envConfig.ENCRYPTION_KEY;
    process.env.SESSION_SECRET = envConfig.SESSION_SECRET;

    // Set any additional environment variables
    Object.keys(envConfig).forEach(key => {
      if (!['DATABASE_URL', 'DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_NAME', 
            'DATABASE_USER', 'DATABASE_PASSWORD', 'TENANT_ID', 'TENANT_NAME',
            'JWT_SECRET', 'ENCRYPTION_KEY', 'SESSION_SECRET'].includes(key)) {
        process.env[key] = envConfig[key];
      }
    });
  }

  /**
   * Add new domain mapping
   */
  static async addDomainMapping(mapping: DomainTenantMapping): Promise<void> {
    await this.initialize();
    
    // Check if domain already exists
    const existingIndex = this.domainMappings.findIndex(m => m.domain === mapping.domain);
    
    if (existingIndex >= 0) {
      // Update existing mapping
      this.domainMappings[existingIndex] = mapping;
    } else {
      // Add new mapping
      this.domainMappings.push(mapping);
    }

    // Save to configuration file
    await this.saveDomainMappings();
  }

  /**
   * Remove domain mapping
   */
  static async removeDomainMapping(domain: string): Promise<boolean> {
    await this.initialize();
    
    const initialLength = this.domainMappings.length;
    this.domainMappings = this.domainMappings.filter(m => m.domain !== domain);
    
    if (this.domainMappings.length < initialLength) {
      await this.saveDomainMappings();
      return true;
    }
    
    return false;
  }

  /**
   * Save domain mappings to configuration file
   */
  private static async saveDomainMappings(): Promise<void> {
    const configPath = path.join(process.cwd(), 'config', 'domain-mappings.json');
    await fs.writeFile(configPath, JSON.stringify(this.domainMappings, null, 2));
  }

  /**
   * List all domain mappings
   */
  static async listDomainMappings(): Promise<DomainTenantMapping[]> {
    await this.initialize();
    return [...this.domainMappings];
  }

  /**
   * Clear environment cache
   */
  static clearEnvCache(): void {
    this.envCache.clear();
  }

  /**
   * Validate tenant environment configuration
   */
  static validateTenantEnv(envConfig: TenantEnvConfig): {
    isValid: boolean;
    missingFields: string[];
  } {
    const requiredFields = [
      'DATABASE_URL',
      'TENANT_ID',
      'JWT_SECRET'
    ];

    const missingFields = requiredFields.filter(field => !envConfig[field]);
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Check if a path should bypass tenant identification
   */
  static shouldBypassTenantIdentification(pathname: string): boolean {
    const bypassPaths = [
      '/api/health',
      '/api/system',
      '/_next',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/.well-known'
    ];
    
    return bypassPaths.some(path => pathname.startsWith(path));
  }
}

export default DomainTenantService;
