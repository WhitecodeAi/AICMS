import { NextRequest, NextResponse } from 'next/server'
import type { Menu } from '@/lib/stores/menu-store'

// Simple in-memory store for development (in production, use a database)
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
          }
        ]
      }
    ]
  }
]

const getMenusStore = () => menusStore
const setMenusStore = (menus: Menu[]) => { menusStore = menus }

// GET /api/menus/[id] - Get single menu
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menus = getMenusStore()
    const menu = menus.find((menu: Menu) => menu.id === params.id)

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ menu })
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}

// PUT /api/menus/[id] - Update menu
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const menus = getMenusStore()
    
    const menuIndex = menus.findIndex((menu: Menu) => menu.id === params.id)

    if (menuIndex < 0) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      )
    }

    const updatedMenu = {
      ...menus[menuIndex],
      ...body,
      id: params.id, // Ensure ID doesn't change
      updatedAt: new Date()
    }

    menus[menuIndex] = updatedMenu
    setMenusStore(menus)

    return NextResponse.json({
      success: true,
      menu: updatedMenu
    })
  } catch (error) {
    console.error('Error updating menu:', error)
    return NextResponse.json(
      { error: 'Failed to update menu' },
      { status: 500 }
    )
  }
}

// DELETE /api/menus/[id] - Delete menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menus = getMenusStore()
    const menuIndex = menus.findIndex((menu: Menu) => menu.id === params.id)

    if (menuIndex < 0) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      )
    }

    menus.splice(menuIndex, 1)
    setMenusStore(menus)

    return NextResponse.json({
      success: true,
      message: 'Menu deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting menu:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu' },
      { status: 500 }
    )
  }
}
