# Complete Deployment Guide - Multi-Tenant CMS System

## Table of Contents
1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Configuration](#database-configuration)
5. [Application Configuration](#application-configuration)
6. [Building the Application](#building-the-application)
7. [Deployment Options](#deployment-options)
8. [Domain & SSL Setup](#domain--ssl-setup)
9. [Post-Deployment Configuration](#post-deployment-configuration)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## System Overview

This is a **Multi-Tenant CMS System** built with:
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: React with Tailwind CSS
- **Page Builder**: Puck.js for visual page building
- **State Management**: Zustand
- **File Storage**: Local filesystem (configurable for S3/CloudFlare)
- **Authentication**: NextAuth.js

### Key Features
- ✅ Multi-tenant architecture
- ✅ Visual page builder (Puck.js)
- ✅ Dynamic menu management
- ✅ Content management (News, Events, Galleries)
- ✅ HTML/CSS import functionality
- ✅ File management system
- ✅ Responsive admin dashboard

---

## Prerequisites

### Required Software
```bash
# Node.js (v18 or higher)
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 8.0.0

# Git
git --version

# Database (Choose one)
# - PostgreSQL 14+ (Recommended)
# - MySQL 8+ (Alternative)
```

### Development Tools (Optional)
```bash
# Yarn (Alternative package manager)
npm install -g yarn

# PM2 (Process manager for production)
npm install -g pm2

# Docker (For containerized deployment)
docker --version
docker-compose --version
```

---

## Environment Setup

### 1. Clone the Repository
```bash
# Clone your repository
git clone https://gitlab.com/your-username/cms.git
cd cms

# Switch to the main branch
git checkout main  # or aura-home if that's your main branch
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Or using yarn
yarn install
```

### 3. Environment Variables
Create environment files:

```bash
# Create environment file
cp .env.example .env.local
```

**`.env.local`** (Development):
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/cms_db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"

# JWT Secret
JWT_SECRET="your-jwt-secret-key"

# File Upload Configuration
UPLOAD_DIR="/tmp/uploads"
MAX_FILE_SIZE="10485760"  # 10MB

# Admin Credentials
ADMIN_EMAIL="admin@yoursite.com"
ADMIN_PASSWORD="secure-admin-password"

# Multi-tenant Configuration
DEFAULT_TENANT="main"
TENANT_MODE="subdomain"  # or "domain" or "path"

# Optional: External Services
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET=""

# Email Configuration (Optional)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
```

**`.env.production`** (Production):
```env
# Database Configuration
DATABASE_URL="postgresql://prod_user:prod_password@db-host:5432/cms_prod"

# NextAuth Configuration
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-super-secret-key"

# JWT Secret
JWT_SECRET="production-jwt-secret"

# File Upload Configuration
UPLOAD_DIR="/app/uploads"
MAX_FILE_SIZE="52428800"  # 50MB

# Admin Credentials
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="production-secure-password"

# Multi-tenant Configuration
DEFAULT_TENANT="main"
TENANT_MODE="subdomain"

# Production optimizations
NODE_ENV="production"
```

---

## Database Configuration

### Option 1: PostgreSQL (Recommended)

#### Local PostgreSQL Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- In PostgreSQL console
CREATE DATABASE cms_db;
CREATE USER cms_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cms_db TO cms_user;
\q
```

#### Cloud PostgreSQL Options
- **Supabase** (Recommended for small-medium projects)
- **AWS RDS PostgreSQL**
- **Google Cloud SQL**
- **DigitalOcean Managed Databases**
- **Heroku Postgres**

### Option 2: MySQL Setup
```bash
# Install MySQL (Ubuntu/Debian)
sudo apt install mysql-server

# Create database
sudo mysql -u root -p
```

```sql
-- In MySQL console
CREATE DATABASE cms_db;
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cms_db.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Database Schema Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Seed database with sample data
npx prisma db seed
```

---

## Application Configuration

### 1. Update Configuration Files

**`next.config.js`**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'yourdomain.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Enable static file serving
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/files/:path*',
      },
    ]
  },
}

module.exports = nextConfig
```

**`tailwind.config.js`**:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sidebar-bg': '#1f2937',
        'primary': {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
```

### 2. Create Upload Directories
```bash
# Create necessary directories
mkdir -p public/uploads/images
mkdir -p public/uploads/documents
mkdir -p public/uploads/galleries
mkdir -p temp/uploads

# Set permissions (Linux/macOS)
chmod 755 public/uploads
chmod 755 public/uploads/*
```

---

## Building the Application

### Development Build
```bash
# Start development server
npm run dev

# The application will be available at:
# http://localhost:3000
```

### Production Build
```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Check build output
ls -la .next/
```

### Build Optimization
```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer
npm run analyze

# Optimize images
npm install sharp
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Set production environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
# ... add all production environment variables

# Deploy to production
vercel --prod
```

#### 3. Configure Custom Domain
```bash
# Add custom domain
vercel domains add yourdomain.com
vercel domains add www.yourdomain.com

# Configure DNS (add to your domain provider):
# CNAME: www -> cname.vercel-dns.com
# A: @ -> 76.76.19.61
```

### Option 2: DigitalOcean App Platform

#### 1. Create App Spec File
**`.do/app.yaml`**:
```yaml
name: cms-system
services:
- name: web
  source_dir: /
  github:
    repo: your-username/cms
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    type: SECRET
  - key: NEXTAUTH_SECRET
    type: SECRET
  - key: NEXTAUTH_URL
    value: https://your-app-name.ondigitalocean.app

databases:
- name: cms-db
  engine: PG
  version: "14"
  num_nodes: 1
  size: db-s-1vcpu-1gb
```

#### 2. Deploy via CLI
```bash
# Install doctl
# https://docs.digitalocean.com/reference/doctl/how-to/install/

# Deploy
doctl apps create --spec .do/app.yaml
```

### Option 3: Railway

#### 1. Connect Repository
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

#### 2. Configure Environment
```bash
# Add environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="..."
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
```

### Option 4: Self-Hosted VPS (Ubuntu/Debian)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
```

#### 2. Deploy Application
```bash
# Clone repository
git clone https://gitlab.com/your-username/cms.git /var/www/cms
cd /var/www/cms

# Install dependencies
npm install

# Build application
npm run build

# Create PM2 ecosystem file
```

**`ecosystem.config.js`**:
```javascript
module.exports = {
  apps: [
    {
      name: 'cms-system',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/cms',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/cms/err.log',
      out_file: '/var/log/cms/out.log',
      log_file: '/var/log/cms/combined.log',
    },
  ],
}
```

```bash
# Create log directory
sudo mkdir -p /var/log/cms
sudo chown -R $USER:$USER /var/log/cms

# Start application with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

#### 3. Configure Nginx
**`/etc/nginx/sites-available/cms`**:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads/ {
        alias /var/www/cms/public/uploads/;
        expires 1M;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 5: Docker Deployment

#### 1. Create Dockerfile
**`Dockerfile`**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Create uploads directory
RUN mkdir -p public/uploads

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["npm", "start"]
```

#### 2. Create Docker Compose
**`docker-compose.yml`**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://cms_user:cms_password@db:5432/cms_db
      - NEXTAUTH_URL=https://yourdomain.com
      - NEXTAUTH_SECRET=your-secret-here
    depends_on:
      - db
    volumes:
      - uploads:/app/public/uploads
    restart: unless-stopped

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=cms_db
      - POSTGRES_USER=cms_user
      - POSTGRES_PASSWORD=cms_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - uploads:/var/www/uploads
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  uploads:
```

#### 3. Deploy with Docker
```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f app

# Update application
git pull
docker-compose build app
docker-compose up -d
```

---

## Domain & SSL Setup

### Option 1: Cloudflare (Recommended)
```bash
# 1. Add domain to Cloudflare
# 2. Update nameservers at your domain provider
# 3. Enable SSL/TLS (Full mode)
# 4. Create DNS records:
#    A record: @ -> your-server-ip
#    CNAME record: www -> yourdomain.com
```

### Option 2: Let's Encrypt (Self-hosted)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 3: Custom SSL Certificate
```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate signing request
openssl req -new -key private.key -out certificate.csr

# Install certificate in Nginx
# Update nginx configuration with ssl_certificate and ssl_certificate_key
```

---

## Post-Deployment Configuration

### 1. Initial Admin Setup
```bash
# Access your deployed application
https://yourdomain.com/admin

# Default admin credentials (change immediately):
# Email: admin@yoursite.com
# Password: (from your .env file)
```

### 2. Configure Multi-tenancy
```javascript
// Update lib/middleware/tenant.ts if needed
// Configure tenant detection method:
// - Subdomain: tenant.yourdomain.com
// - Domain: tenant-domain.com
// - Path: yourdomain.com/tenant
```

### 3. Upload Sample Content
1. **Create sample pages** using Puck.js builder
2. **Upload images** to gallery
3. **Create news articles**
4. **Setup navigation menus**
5. **Configure sliders**

### 4. Configure File Storage
```bash
# For AWS S3 (optional)
npm install aws-sdk

# Update file upload configuration in:
# - lib/services/file-service.ts
# - API routes in app/api/files/
```

### 5. Email Configuration
```bash
# Configure SMTP settings in .env
# Test email functionality
# Update email templates in components/emails/
```

---

## Monitoring & Maintenance

### 1. Application Monitoring
```bash
# PM2 monitoring (if using PM2)
pm2 monit
pm2 logs cms-system

# View application metrics
pm2 show cms-system
```

### 2. Database Monitoring
```bash
# PostgreSQL monitoring
sudo -u postgres psql cms_db
\dt  # List tables
\du  # List users
SELECT pg_size_pretty(pg_database_size('cms_db'));  # Database size
```

### 3. Log Management
```bash
# Application logs location:
# - PM2: /var/log/cms/
# - Docker: docker-compose logs
# - Vercel: vercel logs
# - Railway: railway logs

# Nginx logs:
# - Access: /var/log/nginx/access.log
# - Error: /var/log/nginx/error.log
```

### 4. Backup Strategy
```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/backups/cms"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U cms_user cms_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/www/cms/public/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 5. Performance Optimization
```bash
# Enable caching headers in Nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Configure PM2 clustering (if needed)
pm2 start ecosystem.config.js --instances max
```

### 6. Security Checklist
- ✅ Change default admin credentials
- ✅ Enable HTTPS/SSL
- ✅ Configure firewall (UFW/iptables)
- ✅ Regular security updates
- ✅ Backup strategy implemented
- ✅ Environment variables secured
- ✅ Database access restricted
- ✅ File upload validation
- ✅ Rate limiting configured
- ✅ CORS properly configured

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Database Connection Issues
```bash
# Check database status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U cms_user -d cms_db

# Common fixes:
# - Verify DATABASE_URL format
# - Check firewall settings
# - Ensure database user has correct permissions
```

#### 2. Build Failures
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Clear node_modules
rm -rf node_modules package-lock.json
npm install
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

#### 3. File Upload Issues
```bash
# Check directory permissions
ls -la public/uploads/
chmod 755 public/uploads/

# Check disk space
df -h

# Verify MAX_FILE_SIZE setting
```

#### 4. Performance Issues
```bash
# Monitor memory usage
htop
free -h

# Check PM2 processes
pm2 list
pm2 monit

# Analyze Next.js bundle
npm run analyze
```

#### 5. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

### Getting Help
- **Documentation**: Check the `/docs` folder in your repository
- **Logs**: Always check application and server logs first
- **Community**: Next.js, Prisma, and Puck.js documentation
- **Support**: Create issues in your GitLab repository

---

## Quick Reference Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open database GUI
```

### Production
```bash
pm2 start ecosystem.config.js    # Start with PM2
pm2 stop cms-system              # Stop application
pm2 restart cms-system           # Restart application
pm2 logs cms-system              # View logs
```

### Database
```bash
npx prisma generate              # Generate Prisma client
npx prisma db push              # Push schema changes
npx prisma db seed              # Seed database
npx prisma migrate deploy       # Deploy migrations
```

### Docker
```bash
docker-compose up -d            # Start containers
docker-compose logs -f app      # View application logs
docker-compose exec app sh      # Access container shell
docker-compose down             # Stop containers
```

---

## Conclusion

This guide covers the complete deployment process for your multi-tenant CMS system. Choose the deployment option that best fits your needs:

- **Vercel**: Best for simple deployments and automatic scaling
- **DigitalOcean**: Good balance of features and cost
- **Railway**: Simple and developer-friendly
- **Self-hosted VPS**: Maximum control and customization
- **Docker**: Containerized deployment for any environment

Remember to:
1. Always test in a staging environment first
2. Keep backups of your database and files
3. Monitor application performance and logs
4. Keep dependencies updated for security
5. Follow security best practices

Your CMS system is now ready for production use! 🚀
