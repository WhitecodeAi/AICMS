// File-based tenant configuration system
// Exports all components for easy importing

export * from './types';
export * from './tenant-config-manager';
export * from './tenant-validator';
export * from './tenant-identification';

// Default exports
export { TenantConfigManager as default } from './tenant-config-manager';
export { TenantConfigManager } from './tenant-config-manager';
export { TenantValidator } from './tenant-validator';
export { TenantIdentificationService } from './tenant-identification';

// Re-export types for convenience
export type {
  TenantConfig,
  TenantDatabase,
  TenantFeatures,
  TenantLimits,
  TenantBranding,
  TenantSEO,
  TenantSecurity,
  TenantSMTP,
  TenantStorage,
  CreateTenantRequest,
  TenantUsageStats,
  TenantListItem,
  TenantValidationError,
  TenantValidationResult,
  TenantContext
} from './types';
