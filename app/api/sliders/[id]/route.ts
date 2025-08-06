import { NextRequest, NextResponse } from 'next/server'
import { slidersStore, updateSlider, deleteSlider } from '@/lib/stores/content-store'

// GET /api/sliders/[id] - Get single slider
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slider = slidersStore.find(slider => slider.id === params.id)

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
    const body = await request.json()
    
    const updatedSlider = updateSlider(params.id, body)

    if (!updatedSlider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }

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
    const deleted = deleteSlider(params.id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }

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
