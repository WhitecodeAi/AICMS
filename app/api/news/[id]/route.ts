import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentTenant } from '@/lib/middleware/tenant'

// Sample data for reference
const sampleNewsData = [
  {
    id: '1',
    title: "Platform Launch Announcement",
    content: "We're excited to announce the official launch of our new multi-tenant CMS platform with enhanced security features and improved performance.",
    excerpt: "Official launch of our new multi-tenant CMS platform with enhanced features...",
    date: "2024-01-15",
    category: "Announcements",
    priority: "high",
    imageUrl: "https://via.placeholder.com/600x300/3B82F6/FFFFFF?text=Platform+Launch",
    linkUrl: "/news/platform-launch",
    author: "Product Team",
    status: "published",
    featured: true,
    tags: '["launch", "platform", "cms"]',
    publishDate: "2024-01-15"
  }
]

// GET /api/news/[id] - Get single news item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getCurrentTenant(request)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const newsItem = await prisma.newsItem.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!newsItem) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      news: {
        id: newsItem.id,
        title: newsItem.title,
        content: newsItem.content,
        excerpt: newsItem.excerpt,
        date: newsItem.date.toISOString().split('T')[0],
        category: newsItem.category,
        priority: newsItem.priority,
        image: newsItem.imageUrl,
        link: newsItem.linkUrl,
        author: newsItem.author,
        status: newsItem.status,
        featured: newsItem.featured,
        tags: newsItem.tags ? JSON.parse(newsItem.tags) : [],
        publishDate: newsItem.publishDate?.toISOString().split('T')[0],
        expiryDate: newsItem.expiryDate?.toISOString().split('T')[0]
      }
    })
  } catch (error) {
    console.error('Error fetching news item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news item' },
      { status: 500 }
    )
  }
}

// PUT /api/news/[id] - Update news item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getCurrentTenant(request)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

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

    // Check if news item exists for this tenant
    const existingNews = await prisma.newsItem.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingNews) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      )
    }

    const updatedNews = await prisma.newsItem.update({
      where: { id: params.id },
      data: {
        title,
        content,
        excerpt,
        category,
        priority,
        imageUrl: image,
        linkUrl: link,
        author,
        status,
        featured,
        tags: tags ? JSON.stringify(tags) : null,
        publishDate: publishDate ? new Date(publishDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        date: publishDate ? new Date(publishDate) : existingNews.date
      }
    })

    // Format response to match frontend expectations
    const formattedNews = {
      id: updatedNews.id,
      title: updatedNews.title,
      content: updatedNews.content,
      excerpt: updatedNews.excerpt,
      date: updatedNews.date.toISOString().split('T')[0],
      category: updatedNews.category,
      priority: updatedNews.priority,
      image: updatedNews.imageUrl,
      link: updatedNews.linkUrl,
      author: updatedNews.author,
      status: updatedNews.status,
      featured: updatedNews.featured,
      tags: updatedNews.tags ? JSON.parse(updatedNews.tags) : [],
      publishDate: updatedNews.publishDate?.toISOString().split('T')[0],
      expiryDate: updatedNews.expiryDate?.toISOString().split('T')[0]
    }

    return NextResponse.json({
      success: true,
      news: formattedNews
    })
  } catch (error) {
    console.error('Error updating news item:', error)
    return NextResponse.json(
      { error: 'Failed to update news item' },
      { status: 500 }
    )
  }
}

// DELETE /api/news/[id] - Delete news item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getCurrentTenant(request)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if news item exists for this tenant
    const existingNews = await prisma.newsItem.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingNews) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      )
    }

    await prisma.newsItem.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'News item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting news item:', error)
    return NextResponse.json(
      { error: 'Failed to delete news item' },
      { status: 500 }
    )
  }
}
