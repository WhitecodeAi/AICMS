#!/usr/bin/env tsx

import { Command } from 'commander';
import { TenantConfigManager, CreateTenantRequest } from '../lib/tenant-config';
import { TenantUtils } from '../lib/utils/tenant-utils';

const program = new Command();
const configManager = TenantConfigManager.getInstance();

program
  .name('tenant-cli')
  .description('CLI for managing file-based tenant configurations')
  .version('1.0.0');

// List tenants command
program
  .command('list')
  .description('List all tenants')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    try {
      const tenants = await configManager.listTenants();
      
      if (options.verbose) {
        console.table(tenants.map(t => ({
          ID: t.id,
          Name: t.name,
          Subdomain: t.subdomain,
          Domain: t.domain || '-',
          Status: t.status,
          'DB Type': t.database.type,
          'Created': new Date(t.createdAt).toLocaleDateString()
        })));
      } else {
        console.table(tenants.map(t => ({
          ID: t.id,
          Name: t.name,
          Subdomain: t.subdomain,
          Status: t.status
        })));
      }
      
      console.log(`\nTotal tenants: ${tenants.length}`);
    } catch (error) {
      console.error('Error listing tenants:', error);
      process.exit(1);
    }
  });

// Create tenant command
program
  .command('create')
  .description('Create a new tenant')
  .requiredOption('-n, --name <name>', 'Tenant name')
  .requiredOption('-s, --subdomain <subdomain>', 'Subdomain')
  .requiredOption('-e, --admin-email <email>', 'Admin email')
  .requiredOption('-f, --admin-first-name <firstName>', 'Admin first name')
  .requiredOption('-l, --admin-last-name <lastName>', 'Admin last name')
  .option('-d, --domain <domain>', 'Custom domain')
  .action(async (options) => {
    try {
      const request: CreateTenantRequest = {
        name: options.name,
        subdomain: options.subdomain,
        adminEmail: options.adminEmail,
        adminFirstName: options.adminFirstName,
        adminLastName: options.adminLastName,
        domain: options.domain
      };

      const tenant = await configManager.createTenant(request);
      console.log(`✅ Tenant '${tenant.id}' created successfully`);
      console.log(`   Name: ${tenant.name}`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      console.log(`   Database: ${tenant.database.database}`);
    } catch (error) {
      console.error('Error creating tenant:', error);
      process.exit(1);
    }
  });

// Get tenant command
program
  .command('get <tenantId>')
  .description('Get tenant configuration')
  .option('-o, --output <format>', 'Output format (json|yaml)', 'json')
  .action(async (tenantId, options) => {
    try {
      const tenant = await configManager.getTenantConfig(tenantId);
      
      if (!tenant) {
        console.error(`Tenant '${tenantId}' not found`);
        process.exit(1);
      }

      if (options.output === 'json') {
        console.log(JSON.stringify(tenant, null, 2));
      } else {
        // Simple YAML-like output
        console.log(`ID: ${tenant.id}`);
        console.log(`Name: ${tenant.name}`);
        console.log(`Subdomain: ${tenant.subdomain}`);
        console.log(`Status: ${tenant.status}`);
        console.log(`Database: ${tenant.database.type}://${tenant.database.host}:${tenant.database.port}/${tenant.database.database}`);
      }
    } catch (error) {
      console.error('Error getting tenant:', error);
      process.exit(1);
    }
  });

// Delete tenant command
program
  .command('delete <tenantId>')
  .description('Delete a tenant')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(async (tenantId, options) => {
    try {
      const tenant = await configManager.getTenantConfig(tenantId);
      
      if (!tenant) {
        console.error(`Tenant '${tenantId}' not found`);
        process.exit(1);
      }

      if (!options.force) {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise<string>((resolve) => {
          readline.question(`Are you sure you want to delete tenant '${tenant.name}' (${tenantId})? [y/N]: `, resolve);
        });

        readline.close();

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          console.log('Operation cancelled');
          process.exit(0);
        }
      }

      const success = await configManager.deleteTenant(tenantId);
      
      if (success) {
        console.log(`✅ Tenant '${tenantId}' deleted successfully`);
      } else {
        console.error(`Failed to delete tenant '${tenantId}'`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      process.exit(1);
    }
  });

// Update tenant command
program
  .command('update <tenantId>')
  .description('Update tenant configuration')
  .option('-n, --name <name>', 'Update tenant name')
  .option('-s, --status <status>', 'Update status (active|suspended|pending|archived)')
  .option('-d, --domain <domain>', 'Update custom domain')
  .action(async (tenantId, options) => {
    try {
      const updates: any = {};
      
      if (options.name) updates.name = options.name;
      if (options.status) updates.status = options.status;
      if (options.domain) updates.domain = options.domain;

      if (Object.keys(updates).length === 0) {
        console.error('No updates specified');
        process.exit(1);
      }

      const tenant = await configManager.updateTenantConfig(tenantId, updates);
      console.log(`✅ Tenant '${tenantId}' updated successfully`);
    } catch (error) {
      console.error('Error updating tenant:', error);
      process.exit(1);
    }
  });

// Backup command
program
  .command('backup [directory]')
  .description('Backup all tenant configurations')
  .action(async (directory) => {
    try {
      const backupPath = await TenantUtils.backupTenantConfigs(directory);
      console.log(`✅ Backup completed: ${backupPath}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      process.exit(1);
    }
  });

// Restore command
program
  .command('restore <directory>')
  .description('Restore tenant configurations from backup')
  .action(async (directory) => {
    try {
      const count = await TenantUtils.restoreTenantConfigs(directory);
      console.log(`✅ Restored ${count} tenant configurations`);
    } catch (error) {
      console.error('Error restoring backup:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate all tenant configurations')
  .action(async () => {
    try {
      const result = await TenantUtils.validateAllTenantConfigs();
      
      console.log(`Valid configurations: ${result.valid}`);
      console.log(`Invalid configurations: ${result.invalid}`);
      
      if (result.errors.length > 0) {
        console.log('\nErrors found:');
        result.errors.forEach(error => {
          console.log(`  ${error.tenantId}:`);
          error.errors.forEach(err => console.log(`    - ${err}`));
        });
        process.exit(1);
      }
      
      console.log('✅ All tenant configurations are valid');
    } catch (error) {
      console.error('Error validating tenants:', error);
      process.exit(1);
    }
  });

// Report command
program
  .command('report')
  .description('Generate tenant usage report')
  .action(async () => {
    try {
      const report = await TenantUtils.generateTenantReport();
      
      console.log('📊 Tenant Report');
      console.log('================');
      console.log(`Total tenants: ${report.totalTenants}`);
      console.log(`Active tenants: ${report.activeTenants}`);
      console.log(`Suspended tenants: ${report.suspendedTenants}`);
      
      console.log('\nFeature usage:');
      Object.entries(report.tenantsByFeature).forEach(([feature, count]) => {
        console.log(`  ${feature}: ${count}`);
      });
      
      console.log('\nStorage types:');
      Object.entries(report.storageByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
      console.log('\nDatabase types:');
      Object.entries(report.databaseTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    } catch (error) {
      console.error('Error generating report:', error);
      process.exit(1);
    }
  });

// Create examples command
program
  .command('create-examples')
  .description('Create example tenant configurations for development')
  .action(async () => {
    try {
      await TenantUtils.createExampleTenants();
      console.log('✅ Example tenant configurations created');
    } catch (error) {
      console.error('Error creating examples:', error);
      process.exit(1);
    }
  });

program.parse();
