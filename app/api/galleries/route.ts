import { NextRequest, NextResponse } from 'next/server'
import { galleriesStore, addGallery } from '@/lib/stores/content-store'

// GET /api/galleries - Fetch galleries with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const department = searchParams.get('department')
    const academicYear = searchParams.get('academicYear')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use shared store
    let filteredGalleries = [...galleriesStore]

    // Apply filters
    if (search) {
      const searchTerm = search.toLowerCase()
      filteredGalleries = filteredGalleries.filter(gallery =>
        gallery.title.toLowerCase().includes(searchTerm) ||
        gallery.description?.toLowerCase().includes(searchTerm) ||
        gallery.shortcode.toLowerCase().includes(searchTerm)
      )
    }

    if (category) {
      filteredGalleries = filteredGalleries.filter(gallery => 
        gallery.category?.toLowerCase().includes(category.toLowerCase())
      )
    }

    if (department) {
      filteredGalleries = filteredGalleries.filter(gallery => 
        gallery.department?.toLowerCase().includes(department.toLowerCase())
      )
    }

    if (academicYear) {
      filteredGalleries = filteredGalleries.filter(gallery => gallery.academicYear === academicYear)
    }

    if (isActive !== null && isActive !== undefined) {
      filteredGalleries = filteredGalleries.filter(gallery => gallery.isActive === (isActive === 'true'))
    }

    // Sort by title
    filteredGalleries.sort((a, b) => a.title.localeCompare(b.title))

    // Apply pagination
    const start = offset
    const end = start + limit
    const paginatedGalleries = filteredGalleries.slice(start, end)

    // Get unique categories and departments
    const categories = Array.from(new Set(galleriesStore.map(gallery => gallery.category))).filter(Boolean)
    const departments = Array.from(new Set(galleriesStore.map(gallery => gallery.department))).filter(Boolean)

    return NextResponse.json({
      galleries: paginatedGalleries,
      totalCount: filteredGalleries.length,
      categories,
      departments
    })
  } catch (error) {
    console.error('Error fetching galleries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch galleries' },
      { status: 500 }
    )
  }
}

// POST /api/galleries - Create new gallery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      title,
      description,
      shortcode,
      category,
      department,
      academicYear,
      layout,
      columns,
      showCaptions,
      lightbox,
      isActive,
      images
    } = body

    if (!title || !shortcode) {
      return NextResponse.json(
        { error: 'Title and shortcode are required' },
        { status: 400 }
      )
    }

    const gallery = {
      id: Date.now().toString(),
      title,
      description: description || null,
      shortcode,
      category: category || null,
      department: department || null,
      academicYear: academicYear || null,
      layout: layout || 'grid',
      columns: columns || 3,
      showCaptions: showCaptions || true,
      lightbox: lightbox || true,
      isActive: isActive ?? true,
      images: images || []
    }

    // Add to shared store
    addGallery(gallery)

    return NextResponse.json({
      success: true,
      gallery
    })
  } catch (error) {
    console.error('Error creating gallery:', error)
    return NextResponse.json(
      { error: 'Failed to create gallery' },
      { status: 500 }
    )
  }
}
