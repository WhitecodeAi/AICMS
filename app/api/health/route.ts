import { NextRequest, NextResponse } from 'next/server'
import DatabaseHelpers from '@/lib/services/api-database-helpers'

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const dbHealthy = await DatabaseHelpers.healthCheck()
    
    const status = dbHealthy ? 'healthy' : 'unhealthy'
    const statusCode = dbHealthy ? 200 : 503

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
      version: process.env.npm_package_version || '1.0.0'
    }, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}
