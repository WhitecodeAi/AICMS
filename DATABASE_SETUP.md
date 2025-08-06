# Database Setup Guide

This guide provides comprehensive instructions for setting up and managing the database for your Multi-Tenant CMS system.

## Quick Start

### 1. Development Setup (Recommended for first-time setup)
```bash
# Install dependencies and setup development database with sample data
npm run db:setup:dev
```

### 2. Production Setup
```bash
# Setup production database with minimal essential data
npm run db:setup:prod
```

## Prerequisites

### Required Software
- **Node.js** 18+ 
- **npm** 8+
- **Database**: PostgreSQL 14+ (recommended) or MySQL 8+

### Environment Configuration
Create `.env.local` file in your project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/cms_db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"
JWT_SECRET="your-jwt-secret-key"

# Admin Credentials
ADMIN_EMAIL="admin@yoursite.com"
ADMIN_PASSWORD="admin123"
SITE_NAME="Your College"
SITE_DOMAIN="yourcollege.edu"
SUBDOMAIN="main"

# File Upload
UPLOAD_DIR="/tmp/uploads"
MAX_FILE_SIZE="10485760"

# Multi-tenant
DEFAULT_TENANT="main"
TENANT_MODE="subdomain"
```

## Available Commands

### Database Setup Scripts
```bash
# Development setup (with sample data)
npm run db:setup:dev

# Production setup (minimal data)
npm run db:setup:prod

# Check database status
npm run db:status

# Reset database (removes all data)
npm run db:reset

# Create new migration
npm run db:migrate

# Backup database
npm run db:backup
```

### Direct Prisma Commands
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with development data
npm run db:seed

# Seed database with production data
npm run db:seed:prod

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Deploy migrations (production)
npm run prisma:deploy
```

## Database Schema

### Core Tables

#### Tenants
- Multi-tenant architecture support
- Subdomain and domain management
- Tenant-specific settings and branding

#### Users
- Role-based access control
- Multi-tenant user isolation
- Authentication and profile management

#### Content Management
- **Pages**: Puck.js visual builder content + HTML/CSS/JS
- **Posts**: Blog posts and articles
- **News Items**: Announcements and notices
- **Events**: Calendar events and activities

#### Media & Files
- **Files**: File upload and management
- **Galleries**: Photo galleries with shortcodes
- **Sliders**: Homepage and section sliders

#### Navigation
- **Menus**: Dynamic menu management
- **Quick Links**: Shortcut links for easy access

#### Institutional Features
- **Departments**: Academic departments
- **Admissions**: Admission information
- **Research**: Research projects and publications
- **Grievances**: Complaint management system
- **Feedback**: User feedback and ratings
- **NAAC Data**: Accreditation data management

#### System
- **Config**: System configuration settings
- **Analytics**: Page views and visitor tracking

## Sample Data (Development Seeder)

When you run `npm run db:setup:dev`, the following sample data is created:

### 🏢 **Main Tenant**
- **Name**: Main College
- **Subdomain**: main
- **Domain**: maincollege.edu

### 👥 **Users**
- **Admin**: admin@maincollege.edu / admin123 (SUPER_ADMIN)
- **Editor**: editor@maincollege.edu / editor123 (EDITOR)
- **Faculty**: faculty@maincollege.edu / faculty123 (FACULTY)

### 🎓 **Departments**
- Computer Science (CS)
- Mathematics (MATH)
- Physics (PHY)

### 📄 **Pages**
- Home page with header and slider
- About page with college information

### 📰 **News Items**
- Academic session announcements
- Sports meet registration
- Research publications

### 📅 **Events**
- Science Exhibition 2024
- Guest Lecture on AI/ML

### 🖼️ **Galleries**
- Campus Life 2024
- Annual Function 2024

### 🎠 **Sliders**
- Homepage hero slider with 3 slides

### 🧭 **Navigation**
- Main header navigation
- Footer links

### 🎓 **Admissions**
- B.Sc Computer Science
- M.Sc Mathematics

### 🔬 **Research**
- ML Applications in Healthcare
- Advanced Mathematical Modeling

### 🔗 **Quick Links**
- Student Portal
- Library
- Results
- Fee Payment

## Migration Management

### Creating a New Migration
```bash
# Create migration for schema changes
npm run db:migrate
# Enter migration name when prompted
```

### Applying Migrations
```bash
# Development (with interactive prompts)
npx prisma migrate dev

# Production (automated)
npx prisma migrate deploy
```

### Migration Files Structure
```
prisma/
├── migrations/
│   ├── 001_initial_migration/
│   │   └── migration.sql
│   ├── 002_add_events_table/
│   │   └── migration.sql
│   └── migration_lock.toml
├── schema.prisma
├── schema-enhanced.prisma
├── seed.ts
└── seed-production.ts
```

## Database Backup & Recovery

### Creating Backups
```bash
# Create backup using the setup script
npm run db:backup

# Manual backup (PostgreSQL)
pg_dump $DATABASE_URL > backup.sql

# Manual backup (MySQL)
mysqldump --single-transaction database_name > backup.sql
```

### Restoring from Backup
```bash
# PostgreSQL
psql $DATABASE_URL < backup.sql

# MySQL
mysql database_name < backup.sql
```

## Environment-Specific Setup

### Development Environment
```bash
# Full setup with sample data
npm run db:setup:dev

# Access admin panel
# http://localhost:3000/admin
# Login: admin@maincollege.edu / admin123
```

### Staging Environment
```bash
# Use production seeder for staging
npm run db:setup:prod

# Test with minimal data
```

### Production Environment
```bash
# Minimal essential data only
npm run db:setup:prod

# Change admin credentials immediately after setup
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database status
npm run db:status

# Verify DATABASE_URL in .env.local
# Ensure database server is running
```

#### 2. Migration Conflicts
```bash
# Reset database and reapply migrations
npm run db:reset

# Or resolve conflicts manually
npx prisma migrate resolve --applied "migration_name"
```

#### 3. Prisma Client Out of Sync
```bash
# Regenerate Prisma client
npm run db:generate

# Push schema without migration
npm run db:push
```

#### 4. Seeding Errors
```bash
# Check if tables exist
npm run db:status

# Manually run seeder
npx tsx prisma/seed.ts
```

### Performance Optimization

#### Database Indexes
The schema includes optimized indexes for:
- Multi-tenant queries (`tenantId`)
- Content filtering (`status`, `category`, `isPublished`)
- Date-based queries (`createdAt`, `date`)
- Search functionality (`title`, `content`)

#### Query Optimization
```javascript
// Use proper includes for relations
const pages = await prisma.page.findMany({
  where: { tenantId },
  include: {
    createdBy: true,
    updatedBy: true
  }
})

// Use select for specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true
  }
})
```

## Security Considerations

### Database Access
- Use environment variables for credentials
- Limit database user permissions
- Enable SSL connections in production
- Regular security updates

### Multi-tenant Isolation
- All queries include `tenantId` filter
- Row-level security enforced in application
- Tenant data isolation verified

### Data Validation
- Prisma schema validation
- Application-level validation
- Input sanitization
- File upload restrictions

## Monitoring & Maintenance

### Regular Tasks
```bash
# Weekly database backup
npm run db:backup

# Check migration status
npm run db:status

# Analyze database performance
npm run prisma:studio
```

### Log Monitoring
- Monitor slow queries
- Track migration history
- Watch for connection issues
- Monitor disk space usage

## Production Deployment

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] Database server ready
- [ ] SSL certificates installed
- [ ] Backup strategy implemented
- [ ] Migration plan tested

### Deployment Steps
```bash
# 1. Deploy application code
git pull origin main

# 2. Install dependencies
npm ci --production

# 3. Run migrations
npm run prisma:deploy

# 4. Seed essential data (first deployment only)
npm run db:seed:prod

# 5. Generate Prisma client
npm run db:generate

# 6. Start application
npm run build && npm start
```

## Support

### Getting Help
- Check the troubleshooting section
- Review Prisma documentation
- Check application logs
- Create backup before major changes

### Documentation References
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

## Quick Reference

### Essential Commands
```bash
# First time setup
npm run db:setup:dev

# Daily development
npm run db:push          # Push schema changes
npm run prisma:studio    # Open database GUI
npm run db:status        # Check status

# Production deployment
npm run prisma:deploy    # Deploy migrations
npm run db:seed:prod     # Seed essential data

# Maintenance
npm run db:backup        # Create backup
npm run db:reset         # Reset database
```

This comprehensive database setup ensures your Multi-Tenant CMS has a robust, scalable foundation! 🚀
