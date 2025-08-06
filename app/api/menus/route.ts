import { NextRequest, NextResponse } from 'next/server'
import type { Menu, MenuItem } from '@/lib/stores/menu-store'

// Shared menu store for development (in production, use a database)
let menusStore: Menu[] = [
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
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')

    let filteredMenus = [...menusStore]

    // Filter by location if provided
    if (location) {
      filteredMenus = filteredMenus.filter(menu => 
        menu.location === location && menu.isActive
      )
    }

    return NextResponse.json({
      menus: filteredMenus,
      totalCount: filteredMenus.length
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

    const menu: Menu = {
      id: Date.now().toString(),
      name,
      location,
      items,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    menusStore.unshift(menu)

    // Also save to API for persistence
    try {
      // In a real app, this would save to database
      console.log('Menu created:', menu)
    } catch (error) {
      console.error('Failed to persist menu:', error)
    }

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
