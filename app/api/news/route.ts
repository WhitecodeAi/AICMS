import { NextRequest, NextResponse } from 'next/server'

// Sample data for when database is not available
const sampleNewsData = [
  {
    id: '1',
    title: "Platform Launch Announcement",
    content: "We're excited to announce the official launch of our new multi-tenant CMS platform with enhanced security features and improved performance. This milestone represents months of development and testing to bring you the best content management experience.",
    excerpt: "Official launch of our new multi-tenant CMS platform with enhanced features...",
    date: "2024-01-15",
    category: "Announcements",
    priority: "high",
    image: "https://via.placeholder.com/600x300/3B82F6/FFFFFF?text=Platform+Launch",
    link: "/news/platform-launch",
    author: "Product Team",
    status: "published",
    featured: true,
    tags: ["launch", "platform", "cms"],
    publishDate: "2024-01-15"
  },
  {
    id: '2',
    title: "Security Updates Released",
    content: "Latest security patches and updates have been deployed to enhance system protection and user data safety. These updates include improved encryption, enhanced authentication, and better protection against common vulnerabilities.",
    excerpt: "Latest security patches deployed for enhanced protection...",
    date: "2024-01-12",
    category: "Security",
    priority: "high",
    image: "https://via.placeholder.com/600x300/EF4444/FFFFFF?text=Security+Update",
    link: "/news/security-updates",
    author: "Security Team",
    status: "published",
    featured: false,
    tags: ["security", "updates", "patches"],
    publishDate: "2024-01-12"
  },
  {
    id: '3',
    title: "New Dashboard Features",
    content: "Introducing new dashboard widgets and analytics tools to help you better understand your content performance. The new features include real-time analytics, custom reporting, and improved data visualization.",
    excerpt: "New dashboard widgets and analytics tools for better insights...",
    date: "2024-01-10",
    category: "Features",
    priority: "medium",
    image: "https://via.placeholder.com/600x300/10B981/FFFFFF?text=Dashboard+Features",
    link: "/news/dashboard-features",
    author: "Development Team",
    status: "published",
    featured: true,
    tags: ["features", "dashboard", "analytics"],
    publishDate: "2024-01-10"
  },
  {
    id: '4',
    title: "Scheduled Maintenance Notice",
    content: "Routine maintenance will be performed on January 20th from 2:00 AM to 4:00 AM EST to improve system performance. During this time, some services may be temporarily unavailable.",
    excerpt: "Routine maintenance scheduled for January 20th, 2:00-4:00 AM EST...",
    date: "2024-01-08",
    category: "Maintenance",
    priority: "medium",
    image: "https://via.placeholder.com/600x300/F59E0B/FFFFFF?text=Maintenance",
    link: "/news/maintenance-notice",
    author: "IT Operations",
    status: "published",
    featured: false,
    tags: ["maintenance", "downtime", "performance"],
    publishDate: "2024-01-08",
    expiryDate: "2024-01-21"
  },
  {
    id: '5',
    title: "Community Forum Launch",
    content: "Join our new community forum to connect with other users, share tips, and get support from our team and community. The forum includes dedicated sections for different topics and skill levels.",
    excerpt: "New community forum for user connection and support...",
    date: "2024-01-05",
    category: "Community",
    priority: "low",
    image: "https://via.placeholder.com/600x300/8B5CF6/FFFFFF?text=Community+Forum",
    link: "/news/community-forum",
    author: "Community Team",
    status: "published",
    featured: false,
    tags: ["community", "forum", "support"],
    publishDate: "2024-01-05"
  },
  {
    id: '6',
    title: "API Documentation Update",
    content: "Comprehensive API documentation has been updated with new endpoints, examples, and best practices for developers. The documentation now includes interactive examples and better code samples.",
    excerpt: "Updated API documentation with new endpoints and examples...",
    date: "2024-01-03",
    category: "Documentation",
    priority: "low",
    image: "https://via.placeholder.com/600x300/06B6D4/FFFFFF?text=API+Docs",
    link: "/news/api-documentation",
    author: "Developer Relations",
    status: "published",
    featured: false,
    tags: ["api", "documentation", "developers"],
    publishDate: "2024-01-03"
  }
]

// GET /api/news - Fetch news with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // For now, use sample data until database is set up
    let filteredNews = [...sampleNewsData]

    // Apply filters
    if (search) {
      const searchTerm = search.toLowerCase()
      filteredNews = filteredNews.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.content.toLowerCase().includes(searchTerm) ||
        item.excerpt?.toLowerCase().includes(searchTerm) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    if (category) {
      filteredNews = filteredNews.filter(item =>
        item.category.toLowerCase().includes(category.toLowerCase())
      )
    }

    if (status) {
      filteredNews = filteredNews.filter(item => item.status === status)
    }

    if (featured !== null && featured !== undefined) {
      filteredNews = filteredNews.filter(item => item.featured === (featured === 'true'))
    }

    // Sort by date (newest first)
    filteredNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Apply pagination
    const start = offset
    const end = start + limit
    const paginatedNews = filteredNews.slice(start, end)

    // Get unique categories
    const categories = Array.from(new Set(sampleNewsData.map(item => item.category))).filter(Boolean)

    return NextResponse.json({
      news: paginatedNews,
      totalCount: filteredNews.length,
      categories
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

// POST /api/news - Create new news item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      title,
      content,
      excerpt,
      category,
      priority,
      image,
      link,
      author,
      status,
      featured,
      tags,
      publishDate,
      expiryDate
    } = body

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    const newsItem = {
      id: Date.now().toString(),
      title,
      content,
      excerpt: excerpt || null,
      date: publishDate || new Date().toISOString().split('T')[0],
      category,
      priority: priority || 'medium',
      image: image || null,
      link: link || null,
      author: author || null,
      status: status || 'draft',
      featured: featured || false,
      tags: tags || [],
      publishDate: publishDate || null,
      expiryDate: expiryDate || null
    }

    // In a real app, this would be saved to database
    sampleNewsData.unshift(newsItem)

    return NextResponse.json({
      success: true,
      news: newsItem
    })
  } catch (error) {
    console.error('Error creating news:', error)
    return NextResponse.json(
      { error: 'Failed to create news item' },
      { status: 500 }
    )
  }
}
