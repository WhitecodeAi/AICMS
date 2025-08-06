// Types for file-based tenant configuration system

export interface TenantDatabase {
  type: 'mysql' | 'postgresql' | 'sqlite';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionLimit?: number;
  url?: string; // Generated connection URL
}

export interface TenantFeatures {
  advancedEditor: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  fileUpload: boolean;
  analytics: boolean;
  customDomain: boolean;
  sslEnabled: boolean;
  multiLanguage: boolean;
  ecommerce: boolean;
  socialLogin: boolean;
}

export interface TenantLimits {
  maxUsers: number;
  maxPages: number;
  maxPosts: number;
  maxStorage: number; // in MB
  maxApiCalls: number; // per month
  maxFileSize: number; // in MB
  maxMenus: number;
  maxGalleries: number;
  maxSliders: number;
}

export interface TenantBranding {
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor?: string;
  fontFamily?: string;
  customCSS?: string;
  brandName?: string;
  tagline?: string;
}

export interface TenantSEO {
  defaultTitle?: string;
  defaultDescription?: string;
  defaultKeywords?: string;
  robotsTxt?: string;
  sitemapEnabled: boolean;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
}

export interface TenantSecurity {
  jwtSecret: string;
  encryptionKey: string;
  sessionSecret: string;
  apiKeyEnabled: boolean;
  apiKey?: string;
  corsOrigins?: string[];
  rateLimitEnabled: boolean;
  rateLimitRequests?: number; // per minute
}

export interface TenantSMTP {
  enabled: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface TenantStorage {
  type: 'local' | 's3' | 'cloudinary' | 'gcs';
  basePath?: string; // for local storage
  bucket?: string; // for cloud storage
  region?: string;
  accessKey?: string;
  secretKey?: string;
  endpoint?: string;
}

export interface TenantConfig {
  // Basic Information
  id: string;
  name: string;
  subdomain: string;
  domain?: string; // custom domain
  status: 'active' | 'suspended' | 'pending' | 'archived';
  
  // Database Configuration
  database: TenantDatabase;
  
  // Feature Configuration
  features: TenantFeatures;
  
  // Usage Limits
  limits: TenantLimits;
  
  // Branding & UI
  branding: TenantBranding;
  
  // SEO Configuration
  seo: TenantSEO;
  
  // Security Settings
  security: TenantSecurity;
  
  // Email Configuration
  smtp: TenantSMTP;
  
  // File Storage Configuration
  storage: TenantStorage;
  
  // Environment Variables
  environment: Record<string, string>;
  
  // Custom Settings (flexible JSON)
  customSettings: Record<string, any>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Admin User (initial setup)
  adminUser?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTenantRequest {
  name: string;
  subdomain: string;
  domain?: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  
  // Optional overrides
  features?: Partial<TenantFeatures>;
  limits?: Partial<TenantLimits>;
  branding?: Partial<TenantBranding>;
  seo?: Partial<TenantSEO>;
  smtp?: Partial<TenantSMTP>;
  storage?: Partial<TenantStorage>;
  environment?: Record<string, string>;
  customSettings?: Record<string, any>;
}

export interface TenantUsageStats {
  tenantId: string;
  userCount: number;
  pageCount: number;
  postCount: number;
  fileCount: number;
  storageUsed: number; // in MB
  apiCallsThisMonth: number;
  lastActivity: Date;
  databaseSize: number; // in MB
}

export interface TenantListItem {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  status: TenantConfig['status'];
  createdAt: string;
  updatedAt: string;
  userCount?: number;
  pageCount?: number;
  storageUsed?: number;
}

// Validation interfaces
export interface TenantValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface TenantValidationResult {
  isValid: boolean;
  errors: TenantValidationError[];
}
