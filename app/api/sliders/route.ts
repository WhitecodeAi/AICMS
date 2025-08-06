import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentTenant } from '@/lib/middleware/tenant'

// GET /api/sliders - Fetch sliders with filters
export async function GET(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const location = searchParams.get('location')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for filters
    const where: any = {
      tenantId: tenant.id
    }

    if (search) {
      const searchTerm = search.toLowerCase()
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Get sliders from database
    const [sliders, totalCount] = await Promise.all([
      prisma.slider.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit
      }),
      prisma.slider.count({ where })
    ])

    // Get unique locations for the tenant
    const locationsResult = await prisma.slider.findMany({
      where: { tenantId: tenant.id },
      select: { location: true },
      distinct: ['location']
    })

    const locations = locationsResult.map(s => s.location).filter(Boolean)

    return NextResponse.json({
      sliders,
      totalCount,
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
    const tenant = await getCurrentTenant(request)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

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

    const defaultSettings = {
      autoPlay: true,
      autoPlaySpeed: 5,
      showDots: true,
      showArrows: true,
      infinite: true,
      pauseOnHover: true,
      transition: 'slide',
      height: '400px'
    }

    // Create slider in database
    const slider = await prisma.slider.create({
      data: {
        name,
        description: description || null,
        location: location || 'custom',
        isActive: isActive ?? true,
        settings: settings || defaultSettings,
        slides: slides || [],
        tenantId: tenant.id
      }
    })

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
