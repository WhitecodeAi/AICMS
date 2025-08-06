import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenant } from '@/lib/middleware/tenant'
import DatabaseHelpers from '@/lib/services/api-database-helpers'

// GET /api/search - Global search across all content types
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
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    const results = await DatabaseHelpers.globalSearch(tenant.id, query.trim())

    return NextResponse.json({
      query,
      results,
      totalResults: results.total
    })
  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}
