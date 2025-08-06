export interface TenantConfig {
  tenantId: string;
  subdomain: string;
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    connectionLimit?: number;
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  features?: string[];
  customSettings?: Record<string, any>;
}

export interface TenantContext {
  tenantId: string;
  config: TenantConfig;
  dbConnection: any; // Will be typed based on your DB driver
}

export interface TenantIdentificationResult {
  tenantId: string | null;
  method: 'subdomain' | 'header' | 'token' | 'none';
  value?: string;
}

export interface TenantRequest extends Request {
  tenant?: TenantContext;
}
