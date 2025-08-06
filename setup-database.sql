-- Create the main database for the CMS
CREATE DATABASE IF NOT EXISTS multitenant_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges to the cms_admin user
GRANT ALL PRIVILEGES ON multitenant_cms.* TO 'cms_admin'@'%';

-- Create additional databases for different tenants (optional)
CREATE DATABASE IF NOT EXISTS tenant_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS tenant_enterprise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges for tenant databases
GRANT ALL PRIVILEGES ON tenant_demo.* TO 'cms_admin'@'%';
GRANT ALL PRIVILEGES ON tenant_enterprise.* TO 'cms_admin'@'%';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Show all databases to verify creation
SHOW DATABASES;
