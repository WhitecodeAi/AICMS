import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting production database seeding...')

  // Get environment variables for production setup
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yoursite.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const siteName = process.env.SITE_NAME || 'Your College'
  const siteDomain = process.env.SITE_DOMAIN || 'yourcollege.edu'
  const subdomain = process.env.SUBDOMAIN || 'main'

  // Create main tenant
  const mainTenant = await prisma.tenant.upsert({
    where: { subdomain },
    update: {},
    create: {
      name: siteName,
      subdomain,
      domain: siteDomain,
      primaryColor: '#6B46C1',
      settings: {
        institutionName: siteName,
        institutionType: 'Educational Institution',
        established: new Date().getFullYear().toString(),
        theme: {
          primaryColor: '#6B46C1',
          secondaryColor: '#EC4899',
          accentColor: '#10B981',
          backgroundColor: '#F9FAFB',
          textColor: '#1F2937'
        }
      },
      isActive: true
    }
  })

  console.log('✅ Created main tenant:', mainTenant.name)

  // Create admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      tenantId: mainTenant.id,
      isActive: true
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create default home page
  const homePage = await prisma.page.upsert({
    where: { 
      tenantId_slug: {
        tenantId: mainTenant.id,
        slug: 'home'
      }
    },
    update: {},
    create: {
      title: 'Home',
      slug: 'home',
      content: {
        content: [
          {
            type: 'DynamicHeader',
            props: {
              id: 'header-1',
              logoText: siteName,
              backgroundColor: '#6B46C1',
              textColor: '#ffffff',
              menuLocation: 'header'
            }
          }
        ],
        root: { props: { title: `${siteName} - Home` } }
      },
      metaTitle: `${siteName} - Home`,
      metaDescription: `Welcome to ${siteName}`,
      isPublished: true,
      publishedAt: new Date(),
      tenantId: mainTenant.id,
      createdById: adminUser.id
    }
  })

  console.log('✅ Created home page')

  // Create default menu
  const defaultMenu = await prisma.menu.upsert({
    where: {
      tenantId_location: {
        tenantId: mainTenant.id,
        location: 'header'
      }
    },
    update: {},
    create: {
      name: 'Main Navigation',
      location: 'header',
      items: [
        {
          id: 'home',
          label: 'Home',
          url: '/',
          type: 'page',
          target: '_self',
          order: 1,
          isVisible: true
        },
        {
          id: 'about',
          label: 'About',
          url: '/about',
          type: 'page',
          target: '_self',
          order: 2,
          isVisible: true
        },
        {
          id: 'contact',
          label: 'Contact',
          url: '/contact',
          type: 'page',
          target: '_self',
          order: 3,
          isVisible: true
        }
      ],
      tenantId: mainTenant.id
    }
  })

  console.log('✅ Created default menu')

  // Create essential configuration
  const configs = await Promise.all([
    prisma.config.upsert({
      where: {
        tenantId_key: {
          tenantId: mainTenant.id,
          key: 'site_settings'
        }
      },
      update: {},
      create: {
        key: 'site_settings',
        value: {
          siteName,
          tagline: 'Excellence in Education',
          footerText: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
          contactEmail: adminEmail,
          maintenanceMode: false
        },
        category: 'general',
        isPublic: true,
        tenantId: mainTenant.id
      }
    }),
    prisma.config.upsert({
      where: {
        tenantId_key: {
          tenantId: mainTenant.id,
          key: 'email_settings'
        }
      },
      update: {},
      create: {
        key: 'email_settings',
        value: {
          fromEmail: `noreply@${siteDomain}`,
          fromName: siteName,
          smtpConfigured: false
        },
        category: 'email',
        isPublic: false,
        tenantId: mainTenant.id
      }
    })
  ])

  console.log('✅ Created essential configuration')

  console.log('🎉 Production database seeding completed successfully!')
  console.log('\n���� Summary:')
  console.log(`✅ Tenant: ${mainTenant.name}`)
  console.log(`✅ Admin User: ${adminUser.email}`)
  console.log(`✅ Home Page: Created`)
  console.log(`✅ Default Menu: Created`)
  console.log(`✅ Essential Config: Created`)
  
  console.log('\n🔐 Login Credentials:')
  console.log(`Email: ${adminEmail}`)
  console.log(`Password: ${adminPassword}`)
  console.log('\n⚠️  Please change the admin password after first login!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during production seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
