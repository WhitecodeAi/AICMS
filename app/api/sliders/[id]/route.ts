import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentTenant } from '@/lib/middleware/tenant'

// GET /api/sliders/[id] - Get single slider
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

    const slider = await prisma.slider.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!slider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      slider
    })
  } catch (error) {
    console.error('Error fetching slider:', error)
    return NextResponse.json(
      { error: 'Failed to fetch slider' },
      { status: 500 }
    )
  }
}

// PUT /api/sliders/[id] - Update slider
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

    // Check if slider exists for this tenant
    const existingSlider = await prisma.slider.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingSlider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }

    const updatedSlider = await prisma.slider.update({
      where: { id: params.id },
      data: {
        ...body,
        id: undefined // Don't allow ID to be updated
      }
    })

    return NextResponse.json({
      success: true,
      slider: updatedSlider
    })
  } catch (error) {
    console.error('Error updating slider:', error)
    return NextResponse.json(
      { error: 'Failed to update slider' },
      { status: 500 }
    )
  }
}

// DELETE /api/sliders/[id] - Delete slider
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

    // Check if slider exists for this tenant
    const existingSlider = await prisma.slider.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingSlider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }

    await prisma.slider.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Slider deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting slider:', error)
    return NextResponse.json(
      { error: 'Failed to delete slider' },
      { status: 500 }
    )
  }
}
