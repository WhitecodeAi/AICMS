import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentTenant } from '@/lib/middleware/tenant'

// GET /api/galleries/[id] - Get single gallery
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

    const gallery = await prisma.gallery.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      gallery
    })
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    )
  }
}

// PUT /api/galleries/[id] - Update gallery
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

    // Check if gallery exists for this tenant
    const existingGallery = await prisma.gallery.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingGallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // If shortcode is being updated, check for uniqueness
    if (body.shortcode && body.shortcode !== existingGallery.shortcode) {
      const duplicateShortcode = await prisma.gallery.findFirst({
        where: {
          tenantId: tenant.id,
          shortcode: body.shortcode,
          id: { not: params.id }
        }
      })

      if (duplicateShortcode) {
        return NextResponse.json(
          { error: 'Shortcode already exists' },
          { status: 400 }
        )
      }
    }

    const updatedGallery = await prisma.gallery.update({
      where: { id: params.id },
      data: {
        ...body,
        id: undefined // Don't allow ID to be updated
      }
    })

    return NextResponse.json({
      success: true,
      gallery: updatedGallery
    })
  } catch (error) {
    console.error('Error updating gallery:', error)
    return NextResponse.json(
      { error: 'Failed to update gallery' },
      { status: 500 }
    )
  }
}

// DELETE /api/galleries/[id] - Delete gallery
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

    // Check if gallery exists for this tenant
    const existingGallery = await prisma.gallery.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingGallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    await prisma.gallery.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Gallery deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting gallery:', error)
    return NextResponse.json(
      { error: 'Failed to delete gallery' },
      { status: 500 }
    )
  }
}
