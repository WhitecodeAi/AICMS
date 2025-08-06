import { NextRequest, NextResponse } from 'next/server'
import { galleriesStore, updateGallery, deleteGallery } from '@/lib/stores/content-store'

// GET /api/galleries/[id] - Get single gallery
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gallery = galleriesStore.find(gallery => gallery.id === params.id)

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
    const body = await request.json()
    
    const updatedGallery = updateGallery(params.id, body)

    if (!updatedGallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

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
    const deleted = deleteGallery(params.id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

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
