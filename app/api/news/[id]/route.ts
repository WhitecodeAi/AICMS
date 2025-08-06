import { NextRequest, NextResponse } from 'next/server'

// Sample data for development
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
    const newsItem = sampleNewsData.find(item => item.id === params.id)

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
        date: newsItem.date,
        category: newsItem.category,
        priority: newsItem.priority,
        image: newsItem.imageUrl,
        link: newsItem.linkUrl,
        author: newsItem.author,
        status: newsItem.status,
        featured: newsItem.featured,
        tags: newsItem.tags ? JSON.parse(newsItem.tags) : [],
        publishDate: newsItem.publishDate
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

    const newsIndex = sampleNewsData.findIndex(item => item.id === params.id)

    if (newsIndex < 0) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      )
    }

    const existingNews = sampleNewsData[newsIndex]
    const updatedNews = {
      ...existingNews,
      ...body,
      id: params.id // Ensure ID doesn't change
    }

    sampleNewsData[newsIndex] = updatedNews

    return NextResponse.json({
      success: true,
      news: updatedNews
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
    const newsIndex = sampleNewsData.findIndex(item => item.id === params.id)

    if (newsIndex < 0) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      )
    }

    sampleNewsData.splice(newsIndex, 1)

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
