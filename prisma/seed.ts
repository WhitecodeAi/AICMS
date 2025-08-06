import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default tenant
  const mainTenant = await prisma.tenant.upsert({
    where: { subdomain: 'main' },
    update: {},
    create: {
      id: 'main-tenant-id',
      name: 'Main College',
      subdomain: 'main',
      domain: 'maincollege.edu',
      logo: '/images/logo.png',
      favicon: '/images/favicon.ico',
      primaryColor: '#6B46C1',
      settings: {
        institutionName: 'Main College',
        institutionType: 'Government College',
        established: '1995',
        address: '123 Education Street, Knowledge City, State 12345',
        phone: '+1 (555) 123-4567',
        email: 'info@maincollege.edu',
        website: 'https://maincollege.edu',
        naacGrade: 'A+',
        principalName: 'Dr. Jane Smith',
        studentStrength: 2500,
        facultyStrength: 150,
        socialMedia: {
          facebook: 'https://facebook.com/maincollege',
          twitter: 'https://twitter.com/maincollege',
          linkedin: 'https://linkedin.com/school/maincollege',
          youtube: 'https://youtube.com/maincollege'
        },
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
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@maincollege.edu' },
    update: {},
    create: {
      email: 'admin@maincollege.edu',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      tenantId: mainTenant.id,
      isActive: true
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create additional users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'editor@maincollege.edu' },
      update: {},
      create: {
        email: 'editor@maincollege.edu',
        password: await bcrypt.hash('editor123', 10),
        firstName: 'John',
        lastName: 'Editor',
        role: 'EDITOR',
        tenantId: mainTenant.id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'faculty@maincollege.edu' },
      update: {},
      create: {
        email: 'faculty@maincollege.edu',
        password: await bcrypt.hash('faculty123', 10),
        firstName: 'Dr. Sarah',
        lastName: 'Professor',
        role: 'FACULTY',
        tenantId: mainTenant.id,
        isActive: true
      }
    })
  ])

  console.log('✅ Created additional users')

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Computer Science',
        code: 'CS',
        description: 'Department of Computer Science and Engineering offering undergraduate and postgraduate programs.',
        head: 'Dr. Michael Johnson',
        email: 'cs@maincollege.edu',
        phone: '+1 (555) 123-4567',
        location: 'Block A, 2nd Floor',
        established: '2000',
        website: 'https://maincollege.edu/cs',
        tenantId: mainTenant.id,
        order: 1
      }
    }),
    prisma.department.create({
      data: {
        name: 'Mathematics',
        code: 'MATH',
        description: 'Department of Mathematics offering courses in pure and applied mathematics.',
        head: 'Dr. Emily Davis',
        email: 'math@maincollege.edu',
        phone: '+1 (555) 123-4568',
        location: 'Block B, 1st Floor',
        established: '1995',
        tenantId: mainTenant.id,
        order: 2
      }
    }),
    prisma.department.create({
      data: {
        name: 'Physics',
        code: 'PHY',
        description: 'Department of Physics with state-of-the-art laboratories and research facilities.',
        head: 'Dr. Robert Wilson',
        email: 'physics@maincollege.edu',
        phone: '+1 (555) 123-4569',
        location: 'Block C, Ground Floor',
        established: '1998',
        tenantId: mainTenant.id,
        order: 3
      }
    })
  ])

  console.log('✅ Created departments')

  // Create sample pages
  const pages = await Promise.all([
    prisma.page.create({
      data: {
        title: 'Home',
        slug: 'home',
        content: {
          content: [
            {
              type: 'DynamicHeader',
              props: {
                id: 'header-1',
                logoText: 'Main College',
                backgroundColor: '#6B46C1',
                textColor: '#ffffff',
                menuLocation: 'header'
              }
            },
            {
              type: 'DynamicSlider',
              props: {
                id: 'slider-1',
                location: 'homepage',
                autoPlay: true,
                slides: [
                  {
                    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
                    title: 'Welcome to Main College',
                    subtitle: 'Excellence in Education Since 1995',
                    buttonText: 'Learn More',
                    buttonUrl: '/about'
                  }
                ]
              }
            }
          ],
          root: { props: { title: 'Main College - Home' } }
        },
        metaTitle: 'Main College - Excellence in Education',
        metaDescription: 'Welcome to Main College, a leading educational institution offering quality education since 1995.',
        isPublished: true,
        publishedAt: new Date(),
        tenantId: mainTenant.id,
        createdById: adminUser.id
      }
    }),
    prisma.page.create({
      data: {
        title: 'About Us',
        slug: 'about',
        content: {
          content: [
            {
              type: 'DynamicHeader',
              props: {
                id: 'header-1',
                logoText: 'Main College',
                backgroundColor: '#6B46C1',
                textColor: '#ffffff',
                menuLocation: 'header'
              }
            }
          ],
          root: { props: { title: 'About Main College' } }
        },
        html: `
          <div class="container mx-auto px-4 py-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-6">About Main College</h1>
            <div class="prose max-w-none">
              <p class="text-lg text-gray-700 mb-4">
                Main College has been a beacon of excellence in education since 1995. Located in the heart of Knowledge City,
                we have consistently maintained our reputation as one of the premier educational institutions in the region.
              </p>
              <h2 class="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Mission</h2>
              <p class="text-gray-700 mb-4">
                To provide quality education that nurtures intellectual growth, critical thinking, and character development
                in our students, preparing them to be responsible citizens and leaders of tomorrow.
              </p>
              <h2 class="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Vision</h2>
              <p class="text-gray-700 mb-4">
                To be recognized as a center of excellence in higher education, fostering innovation, research, and
                community engagement while maintaining the highest standards of academic integrity.
              </p>
            </div>
          </div>
        `,
        css: `
          .prose h2 {
            color: #6B46C1;
          }
        `,
        metaTitle: 'About Us - Main College',
        metaDescription: 'Learn about Main College, our mission, vision, and commitment to excellence in education since 1995.',
        isPublished: true,
        publishedAt: new Date(),
        tenantId: mainTenant.id,
        createdById: adminUser.id
      }
    })
  ])

  console.log('✅ Created sample pages')

  // Create news items
  const newsItems = await Promise.all([
    prisma.newsItem.create({
      data: {
        title: 'New Academic Session 2024-25 Begins',
        content: 'The new academic session for 2024-25 has commenced with great enthusiasm. Students from various backgrounds have joined our college family.',
        excerpt: 'New academic session begins with fresh energy and new students joining our college community.',
        category: 'academic',
        priority: 'HIGH',
        status: 'PUBLISHED',
        featured: true,
        tags: ['academic', 'new-session', 'students'],
        publishDate: new Date(),
        tenantId: mainTenant.id,
        authorId: adminUser.id
      }
    }),
    prisma.newsItem.create({
      data: {
        title: 'Annual Sports Meet 2024 - Registration Open',
        content: 'Registration for the Annual Sports Meet 2024 is now open. Students can participate in various indoor and outdoor sports competitions.',
        excerpt: 'Join the Annual Sports Meet 2024 and showcase your athletic talents.',
        category: 'sports',
        priority: 'MEDIUM',
        status: 'PUBLISHED',
        featured: true,
        tags: ['sports', 'registration', 'competition'],
        publishDate: new Date(Date.now() - 86400000), // Yesterday
        tenantId: mainTenant.id,
        authorId: users[0].id
      }
    }),
    prisma.newsItem.create({
      data: {
        title: 'Research Paper Published in International Journal',
        content: 'Dr. Sarah Professor from Mathematics Department has published a research paper in the International Journal of Advanced Mathematics.',
        excerpt: 'Faculty achievement in international research publication.',
        category: 'research',
        priority: 'HIGH',
        status: 'PUBLISHED',
        featured: false,
        tags: ['research', 'publication', 'mathematics'],
        publishDate: new Date(Date.now() - 172800000), // 2 days ago
        tenantId: mainTenant.id,
        authorId: users[1].id
      }
    })
  ])

  console.log('✅ Created news items')

  // Create events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Science Exhibition 2024',
        description: 'Annual Science Exhibition showcasing innovative projects by students from various departments. Open to public.',
        startDate: new Date(Date.now() + 604800000), // 1 week from now
        endDate: new Date(Date.now() + 691200000), // 8 days from now
        location: 'Main Auditorium',
        venue: 'College Campus',
        category: 'exhibition',
        department: 'All Departments',
        organizer: 'Science Club',
        status: 'PUBLISHED',
        featured: true,
        tags: ['science', 'exhibition', 'students'],
        tenantId: mainTenant.id,
        createdById: adminUser.id
      }
    }),
    prisma.event.create({
      data: {
        title: 'Guest Lecture on AI and Machine Learning',
        description: 'Special guest lecture by industry expert on the latest trends in Artificial Intelligence and Machine Learning.',
        startDate: new Date(Date.now() + 1209600000), // 2 weeks from now
        endDate: new Date(Date.now() + 1213200000), // 2 weeks + 1 hour
        location: 'Computer Science Department',
        venue: 'Seminar Hall',
        category: 'lecture',
        department: 'Computer Science',
        organizer: 'CS Department',
        status: 'PUBLISHED',
        registrationRequired: true,
        maxAttendees: 100,
        registrationDeadline: new Date(Date.now() + 1036800000), // 10 days from now
        featured: true,
        tags: ['AI', 'machine-learning', 'guest-lecture'],
        tenantId: mainTenant.id,
        createdById: adminUser.id
      }
    })
  ])

  console.log('✅ Created events')

  // Create galleries
  const galleries = await Promise.all([
    prisma.gallery.create({
      data: {
        title: 'Campus Life 2024',
        description: 'Beautiful moments from campus life - students, faculty, and campus activities.',
        shortcode: 'campus-life-2024',
        images: [
          {
            id: '1',
            url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
            alt: 'Students in library',
            caption: 'Students studying in our modern library',
            order: 1
          },
          {
            id: '2',
            url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
            alt: 'Campus building',
            caption: 'Main campus building',
            order: 2
          },
          {
            id: '3',
            url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
            alt: 'Graduation ceremony',
            caption: 'Annual graduation ceremony',
            order: 3
          }
        ],
        category: 'campus',
        academicYear: '2024-25',
        tenantId: mainTenant.id,
        createdById: adminUser.id
      }
    }),
    prisma.gallery.create({
      data: {
        title: 'Annual Function 2024',
        description: 'Highlights from our annual cultural function featuring performances by students.',
        shortcode: 'annual-function-2024',
        images: [
          {
            id: '1',
            url: 'https://images.unsplash.com/photo-1516131206008-dd041a9764fd?w=800',
            alt: 'Cultural performance',
            caption: 'Student cultural performance',
            order: 1
          },
          {
            id: '2',
            url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
            alt: 'Award ceremony',
            caption: 'Student awards ceremony',
            order: 2
          }
        ],
        category: 'events',
        academicYear: '2024-25',
        tenantId: mainTenant.id,
        createdById: users[0].id
      }
    })
  ])

  console.log('✅ Created galleries')

  // Create sliders
  const sliders = await Promise.all([
    prisma.slider.create({
      data: {
        title: 'Homepage Hero Slider',
        description: 'Main slider for homepage featuring college highlights',
        slides: [
          {
            id: '1',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
            title: 'Welcome to Main College',
            subtitle: 'Excellence in Education Since 1995',
            buttonText: 'Learn More',
            buttonUrl: '/about',
            order: 1
          },
          {
            id: '2',
            image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
            title: 'State-of-the-Art Facilities',
            subtitle: 'Modern infrastructure for quality education',
            buttonText: 'Explore Campus',
            buttonUrl: '/facilities',
            order: 2
          },
          {
            id: '3',
            image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200',
            title: 'Research Excellence',
            subtitle: 'Leading research in various fields',
            buttonText: 'View Research',
            buttonUrl: '/research',
            order: 3
          }
        ],
        location: 'homepage',
        autoPlay: true,
        duration: 5000,
        transition: 'slide',
        tenantId: mainTenant.id,
        createdById: adminUser.id
      }
    })
  ])

  console.log('✅ Created sliders')

  // Create menus
  const menus = await Promise.all([
    prisma.menu.create({
      data: {
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
            isVisible: true,
            children: [
              {
                id: 'about-history',
                label: 'Our History',
                url: '/about/history',
                type: 'page',
                target: '_self',
                order: 1,
                isVisible: true
              },
              {
                id: 'about-mission',
                label: 'Mission & Vision',
                url: '/about/mission',
                type: 'page',
                target: '_self',
                order: 2,
                isVisible: true
              }
            ]
          },
          {
            id: 'departments',
            label: 'Departments',
            url: '/departments',
            type: 'page',
            target: '_self',
            order: 3,
            isVisible: true,
            children: [
              {
                id: 'dept-cs',
                label: 'Computer Science',
                url: '/departments/computer-science',
                type: 'page',
                target: '_self',
                order: 1,
                isVisible: true
              },
              {
                id: 'dept-math',
                label: 'Mathematics',
                url: '/departments/mathematics',
                type: 'page',
                target: '_self',
                order: 2,
                isVisible: true
              },
              {
                id: 'dept-physics',
                label: 'Physics',
                url: '/departments/physics',
                type: 'page',
                target: '_self',
                order: 3,
                isVisible: true
              }
            ]
          },
          {
            id: 'admissions',
            label: 'Admissions',
            url: '/admissions',
            type: 'page',
            target: '_self',
            order: 4,
            isVisible: true
          },
          {
            id: 'contact',
            label: 'Contact',
            url: '/contact',
            type: 'page',
            target: '_self',
            order: 5,
            isVisible: true
          }
        ],
        tenantId: mainTenant.id
      }
    }),
    prisma.menu.create({
      data: {
        name: 'Footer Links',
        location: 'footer',
        items: [
          {
            id: 'footer-academics',
            label: 'Academics',
            url: '/academics',
            type: 'custom',
            target: '_self',
            order: 1,
            isVisible: true
          },
          {
            id: 'footer-research',
            label: 'Research',
            url: '/research',
            type: 'custom',
            target: '_self',
            order: 2,
            isVisible: true
          },
          {
            id: 'footer-facilities',
            label: 'Facilities',
            url: '/facilities',
            type: 'custom',
            target: '_self',
            order: 3,
            isVisible: true
          },
          {
            id: 'footer-alumni',
            label: 'Alumni',
            url: '/alumni',
            type: 'custom',
            target: '_self',
            order: 4,
            isVisible: true
          }
        ],
        tenantId: mainTenant.id
      }
    })
  ])

  console.log('✅ Created menus')

  // Create admissions
  const admissions = await Promise.all([
    prisma.admission.create({
      data: {
        title: 'B.Sc Computer Science - 2024-25',
        description: 'Bachelor of Science in Computer Science is a 3-year undergraduate program focusing on programming, algorithms, and software development.',
        course: 'B.Sc Computer Science',
        department: 'Computer Science',
        eligibility: 'Candidates must have passed 10+2 with Mathematics and Physics as mandatory subjects with minimum 60% marks.',
        fees: '₹50,000 per year',
        applicationStart: new Date('2024-05-01'),
        applicationEnd: new Date('2024-06-30'),
        examDate: new Date('2024-07-15'),
        resultDate: new Date('2024-07-25'),
        documents: [
          '10th Mark Sheet',
          '12th Mark Sheet',
          'Transfer Certificate',
          'Conduct Certificate',
          'Passport Size Photos',
          'Aadhar Card Copy'
        ],
        process: [
          'Fill Online Application Form',
          'Pay Application Fee',
          'Upload Required Documents',
          'Take Entrance Exam (if applicable)',
          'Merit List Publication',
          'Counseling and Seat Allocation',
          'Fee Payment and Admission Confirmation'
        ],
        status: 'PUBLISHED',
        tenantId: mainTenant.id
      }
    }),
    prisma.admission.create({
      data: {
        title: 'M.Sc Mathematics - 2024-25',
        description: 'Master of Science in Mathematics is a 2-year postgraduate program for advanced study in mathematical sciences.',
        course: 'M.Sc Mathematics',
        department: 'Mathematics',
        eligibility: 'Candidates must have completed B.Sc with Mathematics as a major subject with minimum 55% marks.',
        fees: '₹40,000 per year',
        applicationStart: new Date('2024-05-15'),
        applicationEnd: new Date('2024-07-15'),
        examDate: new Date('2024-08-01'),
        resultDate: new Date('2024-08-10'),
        status: 'PUBLISHED',
        tenantId: mainTenant.id
      }
    })
  ])

  console.log('✅ Created admissions')

  // Create research entries
  const research = await Promise.all([
    prisma.research.create({
      data: {
        title: 'Machine Learning Applications in Healthcare',
        description: 'Research on applying machine learning algorithms to improve healthcare diagnostics and patient care.',
        researcher: 'Dr. Michael Johnson',
        department: 'Computer Science',
        category: 'research',
        status: 'PUBLISHED',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        funding: '₹5,00,000 - UGC Grant',
        publications: [
          {
            title: 'ML in Medical Imaging',
            journal: 'International Journal of Medical Informatics',
            year: '2024'
          }
        ],
        tenantId: mainTenant.id
      }
    }),
    prisma.research.create({
      data: {
        title: 'Advanced Mathematical Modeling',
        description: 'Research on mathematical models for complex systems and their real-world applications.',
        researcher: 'Dr. Emily Davis',
        department: 'Mathematics',
        category: 'research',
        status: 'PUBLISHED',
        startDate: new Date('2023-06-01'),
        funding: '₹3,00,000 - State Government Grant',
        tenantId: mainTenant.id
      }
    })
  ])

  console.log('✅ Created research entries')

  // Create quick links
  const quickLinks = await Promise.all([
    prisma.quickLink.create({
      data: {
        title: 'Student Portal',
        url: 'https://portal.maincollege.edu',
        description: 'Access student information system',
        icon: '👨‍🎓',
        category: 'student',
        order: 1,
        openInNewTab: true,
        tenantId: mainTenant.id
      }
    }),
    prisma.quickLink.create({
      data: {
        title: 'Library',
        url: '/library',
        description: 'Digital library and resources',
        icon: '📚',
        category: 'academic',
        order: 2,
        tenantId: mainTenant.id
      }
    }),
    prisma.quickLink.create({
      data: {
        title: 'Results',
        url: '/results',
        description: 'Examination results',
        icon: '📊',
        category: 'academic',
        order: 3,
        tenantId: mainTenant.id
      }
    }),
    prisma.quickLink.create({
      data: {
        title: 'Fee Payment',
        url: '/fee-payment',
        description: 'Online fee payment portal',
        icon: '💳',
        category: 'financial',
        order: 4,
        tenantId: mainTenant.id
      }
    })
  ])

  console.log('✅ Created quick links')

  // Create NAAC data
  const naacData = await Promise.all([
    prisma.naacData.create({
      data: {
        criterion: '1.1',
        title: 'Curricular Planning and Implementation',
        description: 'The institution ensures effective curriculum delivery through a well-planned and documented process.',
        documents: [
          'Curriculum Committee Minutes',
          'Academic Calendar',
          'Course Completion Reports'
        ],
        evidence: [
          'Student Feedback on Curriculum',
          'Faculty Meeting Records',
          'Academic Audit Reports'
        ],
        score: 3.5,
        remarks: 'Good implementation of curriculum with regular monitoring and feedback mechanisms.',
        academicYear: '2023-24',
        tenantId: mainTenant.id
      }
    }),
    prisma.naacData.create({
      data: {
        criterion: '2.1',
        title: 'Student Enrollment and Profile',
        description: 'The institution maintains transparency in its admission process and student enrollment.',
        score: 3.8,
        academicYear: '2023-24',
        tenantId: mainTenant.id
      }
    })
  ])

  console.log('✅ Created NAAC data')

  // Create configuration settings
  const config = await Promise.all([
    prisma.config.create({
      data: {
        key: 'site_settings',
        value: {
          siteName: 'Main College',
          tagline: 'Excellence in Education',
          footerText: '© 2024 Main College. All rights reserved.',
          contactEmail: 'info@maincollege.edu',
          contactPhone: '+1 (555) 123-4567',
          address: '123 Education Street, Knowledge City, State 12345'
        },
        category: 'general',
        isPublic: true,
        tenantId: mainTenant.id
      }
    }),
    prisma.config.create({
      data: {
        key: 'email_settings',
        value: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          fromEmail: 'noreply@maincollege.edu',
          fromName: 'Main College'
        },
        category: 'email',
        isPublic: false,
        tenantId: mainTenant.id
      }
    }),
    prisma.config.create({
      data: {
        key: 'social_media',
        value: {
          facebook: 'https://facebook.com/maincollege',
          twitter: 'https://twitter.com/maincollege',
          linkedin: 'https://linkedin.com/school/maincollege',
          youtube: 'https://youtube.com/maincollege',
          instagram: 'https://instagram.com/maincollege'
        },
        category: 'social',
        isPublic: true,
        tenantId: mainTenant.id
      }
    })
  ])

  console.log('✅ Created configuration settings')

  // Create sample feedback
  const feedback = await Promise.all([
    prisma.feedback.create({
      data: {
        name: 'John Student',
        email: 'john.student@email.com',
        subject: 'Great Learning Experience',
        message: 'I am really enjoying my studies at Main College. The faculty is excellent and the facilities are top-notch.',
        category: 'general',
        rating: 5,
        status: 'UNREAD',
        isPublic: true,
        tenantId: mainTenant.id
      }
    }),
    prisma.feedback.create({
      data: {
        name: 'Parent of Student',
        email: 'parent@email.com',
        subject: 'Suggestion for Improvement',
        message: 'The college is doing great work. I suggest adding more sports facilities for students.',
        category: 'suggestion',
        rating: 4,
        status: 'READ',
        tenantId: mainTenant.id
      }
    })
  ])

  console.log('✅ Created sample feedback')

  // Create sample grievances
  const grievances = await Promise.all([
    prisma.grievance.create({
      data: {
        title: 'Library Hours Extension Request',
        description: 'Request to extend library hours during examination period for better study facilities.',
        category: 'facilities',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        submitter: 'Student Representative',
        email: 'student.rep@maincollege.edu',
        phone: '+1 (555) 987-6543',
        tenantId: mainTenant.id
      }
    })
  ])

  console.log('✅ Created sample grievances')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📋 Summary:')
  console.log(`✅ Tenant: ${mainTenant.name}`)
  console.log(`✅ Users: ${users.length + 1} (including admin)`)
  console.log(`✅ Departments: ${departments.length}`)
  console.log(`✅ Pages: ${pages.length}`)
  console.log(`✅ News Items: ${newsItems.length}`)
  console.log(`✅ Events: ${events.length}`)
  console.log(`✅ Galleries: ${galleries.length}`)
  console.log(`✅ Sliders: ${sliders.length}`)
  console.log(`✅ Menus: ${menus.length}`)
  console.log(`✅ Admissions: ${admissions.length}`)
  console.log(`✅ Research: ${research.length}`)
  console.log(`✅ Quick Links: ${quickLinks.length}`)
  console.log(`✅ NAAC Data: ${naacData.length}`)
  console.log(`✅ Config: ${config.length}`)
  console.log(`✅ Feedback: ${feedback.length}`)
  console.log(`✅ Grievances: ${grievances.length}`)
  
  console.log('\n🔐 Login Credentials:')
  console.log('Admin: admin@maincollege.edu / admin123')
  console.log('Editor: editor@maincollege.edu / editor123')
  console.log('Faculty: faculty@maincollege.edu / faculty123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
