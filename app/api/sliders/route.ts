import { NextRequest, NextResponse } from 'next/server'
import { slidersStore, addSlider } from '@/lib/stores/content-store'

// GET /api/sliders - Fetch sliders with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const location = searchParams.get('location')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use shared store
    let filteredSliders = [...slidersStore]

    // Apply filters
    if (search) {
      const searchTerm = search.toLowerCase()
      filteredSliders = filteredSliders.filter(slider =>
        slider.name.toLowerCase().includes(searchTerm) ||
        slider.description?.toLowerCase().includes(searchTerm)
      )
    }

    if (location) {
      filteredSliders = filteredSliders.filter(slider => 
        slider.location?.toLowerCase().includes(location.toLowerCase())
      )
    }

    if (isActive !== null && isActive !== undefined) {
      filteredSliders = filteredSliders.filter(slider => slider.isActive === (isActive === 'true'))
    }

    // Sort by name
    filteredSliders.sort((a, b) => a.name.localeCompare(b.name))

    // Apply pagination
    const start = offset
    const end = start + limit
    const paginatedSliders = filteredSliders.slice(start, end)

    // Get unique locations
    const locations = Array.from(new Set(slidersStore.map(slider => slider.location))).filter(Boolean)

    return NextResponse.json({
      sliders: paginatedSliders,
      totalCount: filteredSliders.length,
      locations
    })
  } catch (error) {
    console.error('Error fetching sliders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sliders' },
      { status: 500 }
    )
  }
}

// POST /api/sliders - Create new slider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      description,
      location,
      settings,
      slides,
      isActive
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const slider = {
      id: Date.now().toString(),
      name,
      description: description || null,
      location: location || 'custom',
      isActive: isActive ?? true,
      settings: settings || {
        autoPlay: true,
        autoPlaySpeed: 5,
        showDots: true,
        showArrows: true,
        infinite: true,
        pauseOnHover: true,
        transition: 'slide',
        height: '400px'
      },
      slides: slides || []
    }

    // Add to shared store
    addSlider(slider)

    return NextResponse.json({
      success: true,
      slider
    })
  } catch (error) {
    console.error('Error creating slider:', error)
    return NextResponse.json(
      { error: 'Failed to create slider' },
      { status: 500 }
    )
  }
}
