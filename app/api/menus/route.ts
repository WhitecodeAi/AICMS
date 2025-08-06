import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentTenant } from '@/lib/middleware/tenant'
import type { Menu, MenuItem } from '@/lib/stores/menu-store'

// Sample data for seeding if needed
const sampleMenuData: any[] = [
  {
    id: '1',
    name: 'Main Navigation',
    location: 'header',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: '1',
        label: 'Home',
        url: '/',
        type: 'page',
        target: '_self',
        order: 1,
        isVisible: true
      },
      {
        id: '2',
        label: 'About',
        url: '/about',
        type: 'page',
        target: '_self',
        order: 2,
        isVisible: true,
        children: [
          {
            id: '21',
            label: 'Our History',
            url: '/about/history',
            type: 'page',
            target: '_self',
            order: 1,
            isVisible: true
          },
          {
            id: '22',
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
        id: '3',
        label: 'Services',
        url: '/services',
        type: 'page',
        target: '_self',
        order: 3,
        isVisible: true
      },
      {
        id: '4',
        label: 'Contact',
        url: '/contact',
        type: 'page',
        target: '_self',
        order: 4,
        isVisible: true
      }
    ]
  }
]

// GET /api/menus - Fetch all menus
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
    const location = searchParams.get('location')

    // Build where clause
    const where: any = {
      tenantId: tenant.id
    }

    if (location) {
      where.location = location
      where.isActive = true
    }

    const menus = await prisma.menu.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      menus,
      totalCount: menus.length
    })
  } catch (error) {
    console.error('Error fetching menus:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menus' },
      { status: 500 }
    )
  }
}

// POST /api/menus - Create new menu
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
      location,
      items = []
    } = body

    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      )
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        location,
        items,
        isActive: true,
        tenantId: tenant.id
      }
    })

    return NextResponse.json({
      success: true,
      menu
    })
  } catch (error) {
    console.error('Error creating menu:', error)
    return NextResponse.json(
      { error: 'Failed to create menu' },
      { status: 500 }
    )
  }
}
