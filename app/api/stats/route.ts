import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenant } from '@/lib/middleware/tenant'
import DatabaseHelpers from '@/lib/services/api-database-helpers'

// GET /api/stats - Get content statistics for the tenant
export async function GET(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant(request)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const stats = await DatabaseHelpers.getStats(tenant.id)

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name
      },
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
