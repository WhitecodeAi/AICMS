import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentTenant } from '@/lib/middleware/tenant'

// GET /api/galleries - Fetch galleries with filters
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
    const category = searchParams.get('category')
    const department = searchParams.get('department')
    const academicYear = searchParams.get('academicYear')
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
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { shortcode: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }

    if (department) {
      where.department = { contains: department, mode: 'insensitive' }
    }

    if (academicYear) {
      where.academicYear = academicYear
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Get galleries from database
    const [galleries, totalCount] = await Promise.all([
      prisma.gallery.findMany({
        where,
        orderBy: { title: 'asc' },
        skip: offset,
        take: limit
      }),
      prisma.gallery.count({ where })
    ])

    // Get unique categories and departments for the tenant
    const [categoriesResult, departmentsResult] = await Promise.all([
      prisma.gallery.findMany({
        where: { tenantId: tenant.id },
        select: { category: true },
        distinct: ['category']
      }),
      prisma.gallery.findMany({
        where: { tenantId: tenant.id },
        select: { department: true },
        distinct: ['department']
      })
    ])

    const categories = categoriesResult.map(g => g.category).filter(Boolean)
    const departments = departmentsResult.map(g => g.department).filter(Boolean)

    return NextResponse.json({
      galleries,
      totalCount,
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

    // Check if shortcode already exists for this tenant
    const existingGallery = await prisma.gallery.findFirst({
      where: {
        tenantId: tenant.id,
        shortcode
      }
    })

    if (existingGallery) {
      return NextResponse.json(
        { error: 'Shortcode already exists' },
        { status: 400 }
      )
    }

    // Create gallery in database
    const gallery = await prisma.gallery.create({
      data: {
        title,
        description: description || null,
        shortcode,
        category: category || null,
        department: department || null,
        academicYear: academicYear || null,
        images: images || [],
        isActive: isActive ?? true,
        tenantId: tenant.id
      }
    })

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
