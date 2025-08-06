#!/usr/bin/env tsx

import { TenantService, CreateTenantRequest } from '../lib/services/tenant-service';
import DatabaseService from '../lib/services/database-service';
import { PrismaClient } from '@prisma/client';

/**
 * Script to set up new tenants
 * Usage: npx tsx scripts/tenant-setup.ts create <subdomain> <name> <admin-email> [strategy]
 */

async function createTenant(
  subdomain: string,
  name: string,
  adminEmail: string,
  tier: 'starter' | 'professional' | 'enterprise' = 'starter'
) {
  try {
    console.log(`Creating tenant: ${name} (${subdomain})`);
    console.log(`Tier: ${tier}`);
    console.log(`Admin email: ${adminEmail}`);

    // Validate subdomain
    if (!TenantService.validateSubdomain(subdomain)) {
      throw new Error(`Invalid subdomain: ${subdomain}`);
    }

    // Define tier-based configurations
    const tierConfigs = {
      starter: {
        features: {
          advancedEditor: true,
          customBranding: false,
          apiAccess: true,
          maxUsers: 5,
          customDomain: false,
          sslEnabled: true
        },
        limits: {
          maxPages: 100,
          maxStorage: 1000, // 1GB
          maxApiCalls: 10000,
          maxUsers: 5,
          maxFileSize: 25 // 25MB
        }
      },
      professional: {
        features: {
          advancedEditor: true,
          customBranding: true,
          apiAccess: true,
          maxUsers: 25,
          customDomain: false,
          sslEnabled: true
        },
        limits: {
          maxPages: 1000,
          maxStorage: 5000, // 5GB
          maxApiCalls: 50000,
          maxUsers: 25,
          maxFileSize: 100 // 100MB
        }
      },
      enterprise: {
        features: {
          advancedEditor: true,
          customBranding: true,
          apiAccess: true,
          maxUsers: 100,
          customDomain: true,
          sslEnabled: true
        },
        limits: {
          maxPages: 10000,
          maxStorage: 20000, // 20GB
          maxApiCalls: 200000,
          maxUsers: 100,
          maxFileSize: 500 // 500MB
        }
      }
    };

    const config = tierConfigs[tier];

    const request: CreateTenantRequest = {
      name,
      subdomain,
      adminEmail,
      adminName: 'Admin User',
      features: config.features,
      branding: {
        logo: '/default-logo.png',
        primaryColor: '#3b82f6',
        favicon: '/favicon.ico',
        brandName: name
      },
      limits: config.limits,
      customEnvVars: {
        TENANT_TIER: tier.toUpperCase(),
        CREATED_BY: 'tenant-setup-script',
        SETUP_DATE: new Date().toISOString()
      }
    };

    const tenant = await TenantService.createTenant(request);

    console.log('\n✅ Tenant created successfully!');
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`Subdomain: ${tenant.subdomain}`);
    console.log(`Tier: ${tier}`);
    console.log(`Database: ${tenant.database.connectionString}`);
    console.log(`Environment file: ${tenant.database.envFilePath}`);

    console.log('\n📊 Limits:');
    console.log(`  Max Pages: ${tenant.limits.maxPages}`);
    console.log(`  Max Storage: ${tenant.limits.maxStorage}MB`);
    console.log(`  Max Users: ${tenant.limits.maxUsers}`);
    console.log(`  Max API Calls: ${tenant.limits.maxApiCalls}/month`);

    console.log(`\n🌐 Access URL: https://${subdomain}.yourapp.com`);
    console.log(`📧 Admin login: ${adminEmail}`);
    console.log(`📄 Environment file: config/tenants/${tenant.id}.env`);

  } catch (error) {
    console.error('❌ Failed to create tenant:', error);
    process.exit(1);
  }
}

async function listTenants() {
  try {
    const tenants = await TenantService.listTenants();
    
    console.log(`\n📋 Found ${tenants.length} tenants:\n`);
    
    for (const tenant of tenants) {
      console.log(`🏢 ${tenant.name} (${tenant.id})`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      console.log(`   Database: ${tenant.database.strategy}`);
      console.log(`   Users: ${tenant.features.maxUsers}`);
      console.log(`   Pages: ${tenant.limits.maxPages}`);
      console.log(`   Storage: ${tenant.limits.maxStorage}MB`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to list tenants:', error);
    process.exit(1);
  }
}

async function deleteTenant(tenantId: string) {
  try {
    console.log(`🗑️  Deleting tenant: ${tenantId}`);
    
    // Confirm deletion
    const config = await TenantService.getTenantConfig(tenantId);
    if (!config) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }
    
    console.log(`⚠️  This will permanently delete:`);
    console.log(`   - Tenant: ${config.name}`);
    console.log(`   - Database strategy: ${config.database.strategy}`);
    
    if (config.database.strategy === 'dedicated') {
      console.log(`   - Dedicated database: ${config.database.connectionString}`);
    }
    
    // In a real implementation, you'd want user confirmation here
    console.log('\n🔄 Proceeding with deletion...');
    
    const success = await TenantService.deleteTenant(tenantId);
    
    if (success) {
      console.log('✅ Tenant deleted successfully!');
    } else {
      console.log('❌ Failed to delete tenant');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Failed to delete tenant:', error);
    process.exit(1);
  }
}

async function showTenantStats(tenantId: string) {
  try {
    const stats = await TenantService.getTenantStats(tenantId);
    
    if (!stats) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }
    
    console.log(`\n📊 Statistics for ${stats.name} (${stats.id}):\n`);
    console.log(`👥 Users: ${stats.userCount}`);
    console.log(`📄 Pages: ${stats.pageCount}`);
    console.log(`💾 Storage: ${stats.storageUsed}MB`);
    console.log(`🔗 API calls (this month): ${stats.apiCallsThisMonth}`);
    console.log(`⏰ Last activity: ${stats.lastActivity.toISOString()}`);
    console.log(`✅ Status: ${stats.isActive ? 'Active' : 'Inactive'}`);
    
    // Check usage limits
    const limits = await TenantService.checkUsageLimits(tenantId);
    
    if (limits.withinLimits) {
      console.log('\n✅ All usage within limits');
    } else {
      console.log('\n⚠️  Usage limit violations:');
      limits.violations.forEach(violation => {
        console.log(`   - ${violation}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to get tenant stats:', error);
    process.exit(1);
  }
}

async function migrateDatabase(tenantId: string) {
  try {
    console.log(`🔄 Running database migrations for tenant: ${tenantId}`);

    const config = await TenantService.getTenantConfig(tenantId);
    if (!config) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }

    const success = await DatabaseService.runMigrations(
      tenantId,
      config.database.connectionString
    );

    if (success) {
      console.log('✅ Database migrations completed successfully!');
    } else {
      console.log('❌ Database migrations failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    process.exit(1);
  }
}

async function showTenantEnv(tenantId: string) {
  try {
    console.log(`📄 Environment configuration for tenant: ${tenantId}`);

    const config = await TenantService.getTenantConfig(tenantId);
    if (!config) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }

    console.log(`Environment file: ${config.database.envFilePath}`);

    // Load and display environment variables (masked for security)
    await DatabaseService.loadTenantEnv(tenantId);

    const envVars = Object.keys(process.env)
      .filter(key => key.startsWith(`TENANT_${tenantId.toUpperCase()}`))
      .sort();

    console.log('\n🔐 Environment Variables:');
    envVars.forEach(key => {
      const value = process.env[key];
      const maskedValue = key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY')
        ? '***MASKED***'
        : value;
      console.log(`  ${key}=${maskedValue}`);
    });

  } catch (error) {
    console.error('❌ Failed to show tenant environment:', error);
    process.exit(1);
  }
}

async function updateTenantEnv(tenantId: string, envKey: string, envValue: string) {
  try {
    console.log(`🔄 Updating environment variable for tenant: ${tenantId}`);
    console.log(`Variable: ${envKey}`);

    await DatabaseService.updateTenantEnvFile(tenantId, { [envKey]: envValue });

    console.log('✅ Environment variable updated successfully!');

  } catch (error) {
    console.error('❌ Failed to update environment variable:', error);
    process.exit(1);
  }
}

async function healthCheck(tenantId?: string) {
  try {
    if (tenantId) {
      console.log(`🏥 Health check for tenant: ${tenantId}`);
      
      const config = await TenantService.getTenantConfig(tenantId);
      if (!config) {
        throw new Error(`Tenant '${tenantId}' not found`);
      }
      
      const isHealthy = await DatabaseService.healthCheck(config);
      
      if (isHealthy) {
        console.log('✅ Tenant database is healthy');
      } else {
        console.log('❌ Tenant database health check failed');
        process.exit(1);
      }
    } else {
      console.log('🏥 Health check for all tenants');
      
      const tenants = await TenantService.listTenants();
      
      for (const tenant of tenants) {
        const isHealthy = await DatabaseService.healthCheck(tenant);
        console.log(`${isHealthy ? '✅' : '❌'} ${tenant.name} (${tenant.id})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      if (args.length < 4) {
        console.error('Usage: tsx scripts/tenant-setup.ts create <subdomain> <name> <admin-email> [tier]');
        console.error('Tiers: starter, professional, enterprise');
        process.exit(1);
      }
      await createTenant(args[1], args[2], args[3], args[4] as 'starter' | 'professional' | 'enterprise');
      break;

    case 'list':
      await listTenants();
      break;

    case 'delete':
      if (args.length < 2) {
        console.error('Usage: tsx scripts/tenant-setup.ts delete <tenant-id>');
        process.exit(1);
      }
      await deleteTenant(args[1]);
      break;

    case 'stats':
      if (args.length < 2) {
        console.error('Usage: tsx scripts/tenant-setup.ts stats <tenant-id>');
        process.exit(1);
      }
      await showTenantStats(args[1]);
      break;

    case 'migrate':
      if (args.length < 2) {
        console.error('Usage: tsx scripts/tenant-setup.ts migrate <tenant-id>');
        process.exit(1);
      }
      await migrateDatabase(args[1]);
      break;

    case 'health':
      await healthCheck(args[1]);
      break;

    case 'env':
      if (args[1] === 'show') {
        if (args.length < 3) {
          console.error('Usage: tsx scripts/tenant-setup.ts env show <tenant-id>');
          process.exit(1);
        }
        await showTenantEnv(args[2]);
      } else if (args[1] === 'set') {
        if (args.length < 5) {
          console.error('Usage: tsx scripts/tenant-setup.ts env set <tenant-id> <key> <value>');
          process.exit(1);
        }
        await updateTenantEnv(args[2], args[3], args[4]);
      } else {
        console.error('Usage: tsx scripts/tenant-setup.ts env <show|set> ...');
        process.exit(1);
      }
      break;

    default:
      console.log('🏢 Multi-Tenant CMS Management Tool');
      console.log('');
      console.log('Available commands:');
      console.log('  create <subdomain> <name> <admin-email> [tier]    - Create new tenant');
      console.log('  list                                               - List all tenants');
      console.log('  delete <tenant-id>                                 - Delete tenant');
      console.log('  stats <tenant-id>                                  - Show tenant statistics');
      console.log('  migrate <tenant-id>                                - Run database migrations');
      console.log('  health [tenant-id]                                 - Health check');
      console.log('  env show <tenant-id>                               - Show tenant environment');
      console.log('  env set <tenant-id> <key> <value>                  - Set environment variable');
      console.log('');
      console.log('Tenant Tiers:');
      console.log('  starter      - 5 users, 100 pages, 1GB storage');
      console.log('  professional - 25 users, 1000 pages, 5GB storage');
      console.log('  enterprise   - 100 users, 10000 pages, 20GB storage');
      console.log('');
      console.log('Examples:');
      console.log('  tsx scripts/tenant-setup.ts create acme "Acme Corp" admin@acme.com enterprise');
      console.log('  tsx scripts/tenant-setup.ts create demo "Demo Company" demo@example.com starter');
      console.log('  tsx scripts/tenant-setup.ts list');
      console.log('  tsx scripts/tenant-setup.ts stats acme');
      console.log('  tsx scripts/tenant-setup.ts env show demo');
      console.log('  tsx scripts/tenant-setup.ts env set demo CUSTOM_FEATURE enabled');
      process.exit(1);
  }

  await DatabaseService.closeAllConnections();
}

if (require.main === module) {
  main().catch(console.error);
}

export { createTenant, listTenants, deleteTenant, showTenantStats, migrateDatabase, healthCheck };
