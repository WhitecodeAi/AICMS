-- MySQL initialization script for multi-tenant CMS
-- This script runs when the MySQL container starts for the first time

-- Create database for system configuration (optional - can store tenant configs in MySQL)
CREATE DATABASE IF NOT EXISTS cms_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create admin user for tenant management
CREATE USER IF NOT EXISTS 'cms_admin'@'%' IDENTIFIED BY 'cms_admin_password';
GRANT ALL PRIVILEGES ON *.* TO 'cms_admin'@'%' WITH GRANT OPTION;

-- Create a user specifically for creating tenant databases
CREATE USER IF NOT EXISTS 'tenant_creator'@'%' IDENTIFIED BY 'tenant_creator_password';
GRANT CREATE, DROP, ALTER, SELECT, INSERT, UPDATE, DELETE ON *.* TO 'tenant_creator'@'%';

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Create example tenant databases (optional for development)
-- CREATE DATABASE IF NOT EXISTS tenant_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE USER IF NOT EXISTS 'tenant_demo'@'%' IDENTIFIED BY 'demo_password';
-- GRANT ALL PRIVILEGES ON tenant_demo.* TO 'tenant_demo'@'%';

-- CREATE DATABASE IF NOT EXISTS tenant_acme CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE USER IF NOT EXISTS 'tenant_acme'@'%' IDENTIFIED BY 'acme_password';
-- GRANT ALL PRIVILEGES ON tenant_acme.* TO 'tenant_acme'@'%';

FLUSH PRIVILEGES;

-- Show databases and users
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User LIKE 'cms_%' OR User LIKE 'tenant_%';
