#!/usr/bin/env tsx

import { Command } from 'commander';
import TenantEnvGenerator, { TenantEnvTemplate } from '../lib/tenant-config/tenant-env-generator';
import DomainTenantService from '../lib/tenant-config/domain-tenant-service';
import TenantEnvLoader from '../lib/tenant-config/env-loader';
import TenantDatabaseManager from '../lib/tenant-config/tenant-database-manager';

const program = new Command();

program
  .name('tenant-manager')
  .description('CLI utility for managing multi-tenant environments')
  .version('1.0.0');

// Create tenant command
program
  .command('create')
  .description('Create a new tenant with environment files')
  .requiredOption('-t, --tenant-id <tenantId>', 'Tenant ID (e.g., "hiray")')
  .requiredOption('-d, --domain <domain>', 'Base domain (e.g., "whitecodetech.com")')
  .requiredOption('-n, --name <name>', 'Tenant display name')
  .option('--db-host <host>', 'Database host', 'localhost')
  .option('--db-port <port>', 'Database port', '3306')
  .option('--db-user <user>', 'Database user (auto-generated if not provided)')
  .option('--db-password <password>', 'Database password (auto-generated if not provided)')
  .option('--admin-only', 'Create only admin tenant (not website)')
  .option('--website-only', 'Create only website tenant (not admin)')
  .action(async (options) => {
    try {
      console.log('🚀 Creating tenant...');
      console.log(`Tenant ID: ${options.tenantId}`);
      console.log(`Domain: ${options.domain}`);
      console.log(`Name: ${options.name}`);

      const template: Omit<TenantEnvTemplate, 'tenantId'> = {
        databaseHost: options.dbHost,
        databasePort: parseInt(options.dbPort),
        databaseUser: options.dbUser,
        databasePassword: options.dbPassword,
        tenantName: options.name,
        additionalVars: {
          'NEXT_PUBLIC_SITE_NAME': options.name,
          'SUPPORT_EMAIL': `support@${options.tenantId}.${options.domain}`
        }
      };

      if (options.adminOnly) {
        // Create only admin tenant
        const adminDomain = `${options.tenantId}admin.${options.domain}`;
        const adminTemplate: TenantEnvTemplate = {
          ...template,
          tenantId: `${options.tenantId}_admin`,
          databaseName: `${options.tenantId}_admin_cms`,
          databaseUser: template.databaseUser || `${options.tenantId}_admin_user`
        };
        
        const result = await TenantEnvGenerator.generateTenantEnv(adminDomain, adminTemplate);
        console.log('✅ Admin tenant created:', result);
      } else if (options.websiteOnly) {
        // Create only website tenant
        const websiteDomain = `${options.tenantId}.${options.domain}`;
        const websiteTemplate: TenantEnvTemplate = {
          ...template,
          tenantId: options.tenantId,
          databaseName: `${options.tenantId}_cms`,
          databaseUser: template.databaseUser || `${options.tenantId}_user`
        };
        
        const result = await TenantEnvGenerator.generateTenantEnv(websiteDomain, websiteTemplate);
        console.log('✅ Website tenant created:', result);
      } else {
        // Create both admin and website tenants
        const results = await TenantEnvGenerator.generateTenantPair(options.domain, options.tenantId, template);
        console.log('✅ Tenant pair created:');
        console.log('  Admin:', results.admin);
        console.log('  Website:', results.website);
      }

    } catch (error) {
      console.error('❌ Failed to create tenant:', error);
      process.exit(1);
    }
  });

// List tenants command
program
  .command('list')
  .description('List all configured tenants')
  .option('--detailed', 'Show detailed information')
  .action(async (options) => {
    try {
      console.log('📋 Listing tenants...');
      
      const mappings = await DomainTenantService.listDomainMappings();
      const envFiles = await TenantEnvGenerator.listTenantEnvFiles();

      if (mappings.length === 0) {
        console.log('No tenants configured.');
        return;
      }

      console.log(`Found ${mappings.length} tenant mappings:`);
      console.log('');

      for (const mapping of mappings) {
        const envInfo = envFiles.find(f => f.domain === mapping.domain);
        
        console.log(`🏢 ${mapping.domain}`);
        console.log(`   Type: ${mapping.tenantType}`);
        console.log(`   Env File: ${mapping.envFile}`);
        console.log(`   Active: ${mapping.isActive ? '✅' : '❌'}`);
        console.log(`   File Exists: ${envInfo?.exists ? '✅' : '❌'}`);
        
        if (options.detailed && envInfo?.exists) {
          console.log(`   File Size: ${envInfo.size} bytes`);
          console.log(`   Modified: ${envInfo.modifiedAt?.toISOString()}`);
        }
        
        console.log('');
      }

    } catch (error) {
      console.error('❌ Failed to list tenants:', error);
      process.exit(1);
    }
  });

// Validate tenant command
program
  .command('validate <domain>')
  .description('Validate tenant configuration')
  .action(async (domain) => {
    try {
      console.log(`🔍 Validating tenant: ${domain}`);
      
      const validation = await TenantEnvGenerator.validateTenantEnvFile(domain);
      
      console.log(`File exists: ${validation.exists ? '✅' : '❌'}`);
      console.log(`Configuration valid: ${validation.isValid ? '✅' : '❌'}`);
      
      if (validation.errors.length > 0) {
        console.log('\n❌ Errors:');
        validation.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (validation.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        validation.warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      // Test database connection
      if (validation.isValid) {
        console.log('\n🔌 Testing database connection...');
        const connectionTest = await TenantDatabaseManager.getConnectionForDomain(domain);
        console.log(`Database connection: ${connectionTest ? '✅' : '❌'}`);
      }

    } catch (error) {
      console.error('❌ Failed to validate tenant:', error);
      process.exit(1);
    }
  });

// Update tenant command
program
  .command('update <domain>')
  .description('Update tenant configuration')
  .option('--db-host <host>', 'Update database host')
  .option('--db-port <port>', 'Update database port')
  .option('--db-name <name>', 'Update database name')
  .option('--db-user <user>', 'Update database user')
  .option('--db-password <password>', 'Update database password')
  .option('--tenant-name <name>', 'Update tenant name')
  .action(async (domain, options) => {
    try {
      console.log(`🔄 Updating tenant: ${domain}`);
      
      const updates: Partial<TenantEnvTemplate> = {};
      
      if (options.dbHost) updates.databaseHost = options.dbHost;
      if (options.dbPort) updates.databasePort = parseInt(options.dbPort);
      if (options.dbName) updates.databaseName = options.dbName;
      if (options.dbUser) updates.databaseUser = options.dbUser;
      if (options.dbPassword) updates.databasePassword = options.dbPassword;
      if (options.tenantName) updates.tenantName = options.tenantName;

      await TenantEnvGenerator.updateTenantEnv(domain, updates);
      console.log('✅ Tenant updated successfully');

    } catch (error) {
      console.error('❌ Failed to update tenant:', error);
      process.exit(1);
    }
  });

// Delete tenant command
program
  .command('delete <domain>')
  .description('Delete tenant configuration')
  .option('--force', 'Skip confirmation prompt')
  .action(async (domain, options) => {
    try {
      if (!options.force) {
        // In a real implementation, you'd use a prompt library
        console.log(`⚠️ This will delete the tenant configuration for: ${domain}`);
        console.log('Use --force to confirm deletion');
        return;
      }

      console.log(`🗑️ Deleting tenant: ${domain}`);
      
      await TenantEnvGenerator.deleteTenantEnv(domain);
      console.log('✅ Tenant deleted successfully');

    } catch (error) {
      console.error('❌ Failed to delete tenant:', error);
      process.exit(1);
    }
  });

// Test tenant command
program
  .command('test <domain>')
  .description('Test tenant environment and database connection')
  .action(async (domain) => {
    try {
      console.log(`🧪 Testing tenant: ${domain}`);
      
      // Test environment loading
      console.log('1. Testing environment loading...');
      const loadedEnv = await TenantEnvLoader.loadEnvironmentForDomain(domain);
      console.log(`   Environment loaded: ${loadedEnv ? '✅' : '❌'}`);
      
      if (loadedEnv) {
        console.log(`   Tenant ID: ${loadedEnv.tenantId}`);
        console.log(`   Source: ${loadedEnv.source}`);
        console.log(`   Loaded at: ${loadedEnv.loadedAt.toISOString()}`);
      }

      // Test database connection
      console.log('2. Testing database connection...');
      const dbConnection = await TenantDatabaseManager.getConnectionForDomain(domain);
      console.log(`   Database connection: ${dbConnection ? '✅' : '❌'}`);

      if (dbConnection) {
        // Test basic query
        console.log('3. Testing database query...');
        try {
          await dbConnection.$queryRaw`SELECT 1 as test`;
          console.log('   Database query: ✅');
        } catch (error) {
          console.log('   Database query: ❌');
          console.log(`   Error: ${error}`);
        }
      }

      // Get connection stats
      console.log('4. Connection statistics...');
      const stats = TenantDatabaseManager.getConnectionStats();
      console.log(`   Total connections: ${stats.totalConnections}`);
      console.log(`   Active connections: ${stats.activeConnections}`);

    } catch (error) {
      console.error('❌ Failed to test tenant:', error);
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Check health of all tenant connections')
  .action(async () => {
    try {
      console.log('🏥 Running health check...');
      
      const health = await TenantDatabaseManager.healthCheck();
      
      console.log(`Healthy connections: ${health.healthy}`);
      console.log(`Unhealthy connections: ${health.unhealthy}`);
      console.log('');

      if (health.details.length > 0) {
        console.log('Connection details:');
        health.details.forEach(detail => {
          const status = detail.healthy ? '✅' : '❌';
          console.log(`  ${status} ${detail.tenantId} (${detail.domain})`);
          if (!detail.healthy && detail.error) {
            console.log(`     Error: ${detail.error}`);
          }
        });
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    }
  });

// Create example command
program
  .command('create-example')
  .description('Create example tenant configuration')
  .action(async () => {
    try {
      console.log('📝 Creating example tenant...');
      
      const examples = await TenantEnvGenerator.createExampleTenant();
      
      console.log('✅ Example tenants created:');
      examples.forEach(example => {
        console.log(`  - ${example.domain} (${example.tenantId})`);
        console.log(`    Env file: ${example.envFile}`);
      });

    } catch (error) {
      console.error('❌ Failed to create example tenant:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
