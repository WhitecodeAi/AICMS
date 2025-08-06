#!/bin/bash

# Database Setup Script for Multi-Tenant CMS
# This script helps set up the database for development and production environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env.local ]; then
        print_error ".env.local file not found!"
        print_status "Creating .env.local from template..."
        
        cat > .env.local << EOL
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/cms_db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"

# JWT Secret
JWT_SECRET="your-jwt-secret-key"

# Admin Credentials
ADMIN_EMAIL="admin@yoursite.com"
ADMIN_PASSWORD="admin123"
SITE_NAME="Your College"
SITE_DOMAIN="yourcollege.edu"
SUBDOMAIN="main"

# File Upload Configuration
UPLOAD_DIR="/tmp/uploads"
MAX_FILE_SIZE="10485760"

# Multi-tenant Configuration
DEFAULT_TENANT="main"
TENANT_MODE="subdomain"
EOL
        
        print_warning "Please update .env.local with your actual database credentials and settings!"
        read -p "Press Enter to continue after updating .env.local..."
    fi
}

# Load environment variables
load_env() {
    if [ -f .env.local ]; then
        export $(grep -v '^#' .env.local | xargs)
        print_status "Environment variables loaded"
    fi
}

# Check if required tools are installed
check_dependencies() {
    print_header "🔍 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check if Prisma CLI is available
    if ! npm list -g @prisma/cli &> /dev/null && ! npm list @prisma/cli &> /dev/null; then
        print_status "Installing Prisma CLI..."
        npm install -g @prisma/cli
    fi
    
    print_status "All dependencies are available"
}

# Install npm dependencies
install_dependencies() {
    print_header "📦 Installing dependencies..."
    npm install
    print_status "Dependencies installed successfully"
}

# Generate Prisma client
generate_client() {
    print_header "🔧 Generating Prisma client..."
    npx prisma generate
    print_status "Prisma client generated successfully"
}

# Setup database for development
setup_development() {
    print_header "🏗️  Setting up development database..."
    
    # Push schema to database
    print_status "Pushing schema to database..."
    npx prisma db push --accept-data-loss
    
    # Run development seeder
    print_status "Seeding database with sample data..."
    npx tsx prisma/seed.ts
    
    print_status "Development database setup complete!"
}

# Setup database for production
setup_production() {
    print_header "🚀 Setting up production database..."
    
    # Deploy migrations
    print_status "Deploying migrations..."
    npx prisma migrate deploy
    
    # Run production seeder
    print_status "Seeding database with essential data..."
    npx tsx prisma/seed-production.ts
    
    print_status "Production database setup complete!"
}

# Reset database
reset_database() {
    print_warning "This will delete all data in the database!"
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        npx prisma migrate reset --force
        print_status "Database reset complete!"
    else
        print_status "Database reset cancelled."
    fi
}

# Create migration
create_migration() {
    print_header "📝 Creating new migration..."
    read -p "Enter migration name: " migration_name
    
    if [ -z "$migration_name" ]; then
        print_error "Migration name cannot be empty!"
        exit 1
    fi
    
    npx prisma migrate dev --name "$migration_name"
    print_status "Migration created: $migration_name"
}

# Database status
check_database_status() {
    print_header "📊 Database Status"
    
    print_status "Checking database connection..."
    if npx prisma db pull --force > /dev/null 2>&1; then
        print_status "✅ Database connection successful"
    else
        print_error "❌ Database connection failed"
        print_warning "Please check your DATABASE_URL in .env.local"
        exit 1
    fi
    
    print_status "Migration status:"
    npx prisma migrate status
}

# Backup database
backup_database() {
    print_header "💾 Creating database backup..."
    
    # Extract database info from DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not found in environment variables"
        exit 1
    fi
    
    # Create backup directory
    mkdir -p backups
    
    # Generate backup filename with timestamp
    backup_file="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create backup (this is a basic example - adjust based on your database)
    print_status "Creating backup: $backup_file"
    
    # For PostgreSQL
    if [[ $DATABASE_URL == *"postgresql"* ]]; then
        pg_dump "$DATABASE_URL" > "$backup_file"
    # For MySQL
    elif [[ $DATABASE_URL == *"mysql"* ]]; then
        # Extract connection details and create mysqldump command
        mysqldump --single-transaction --routines --triggers $(echo $DATABASE_URL | sed 's|mysql://||' | sed 's|/| |g') > "$backup_file"
    else
        print_error "Unsupported database type"
        exit 1
    fi
    
    print_status "Backup created: $backup_file"
}

# Show usage
show_help() {
    echo "Database Setup Script for Multi-Tenant CMS"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev          Setup development database with sample data"
    echo "  prod         Setup production database with minimal data"
    echo "  reset        Reset database (removes all data)"
    echo "  migrate      Create a new migration"
    echo "  status       Check database connection and migration status"
    echo "  backup       Create database backup"
    echo "  generate     Generate Prisma client only"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev       # Setup development environment"
    echo "  $0 prod      # Setup production environment"
    echo "  $0 reset     # Reset database"
    echo "  $0 status    # Check database status"
}

# Main execution
main() {
    # Check environment file first
    check_env_file
    load_env
    
    case "${1:-help}" in
        "dev"|"development")
            check_dependencies
            install_dependencies
            generate_client
            setup_development
            ;;
        "prod"|"production")
            check_dependencies
            install_dependencies
            generate_client
            setup_production
            ;;
        "reset")
            check_dependencies
            reset_database
            ;;
        "migrate")
            check_dependencies
            create_migration
            ;;
        "status")
            check_dependencies
            load_env
            check_database_status
            ;;
        "backup")
            check_dependencies
            load_env
            backup_database
            ;;
        "generate")
            check_dependencies
            generate_client
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
