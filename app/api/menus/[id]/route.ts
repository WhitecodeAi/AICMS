import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentTenant } from '@/lib/middleware/tenant'
import type { Menu } from '@/lib/stores/menu-store'

// Sample data kept for reference
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
          }
        ]
      }
    ]
  }
]

// GET /api/menus/[id] - Get single menu
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

    const menu = await prisma.menu.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

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
    const tenant = await getCurrentTenant(request)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Check if menu exists for this tenant
    const existingMenu = await prisma.menu.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingMenu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      )
    }

    const updatedMenu = await prisma.menu.update({
      where: { id: params.id },
      data: {
        ...body,
        id: undefined // Don't allow ID to be updated
      }
    })

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
    const tenant = await getCurrentTenant(request)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if menu exists for this tenant
    const existingMenu = await prisma.menu.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingMenu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      )
    }

    await prisma.menu.delete({
      where: { id: params.id }
    })

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
