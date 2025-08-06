import { NextRequest, NextResponse } from 'next/server';
import { TenantConfigManager } from '../../../../lib/tenant-config';

const configManager = TenantConfigManager.getInstance();

// GET /api/tenants/[id] - Get tenant by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = params.id;
    const tenant = await configManager.getTenantConfig(tenantId);
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const safeTenant = {
      ...tenant,
      security: {
        ...tenant.security,
        jwtSecret: '[REDACTED]',
        encryptionKey: '[REDACTED]',
        sessionSecret: '[REDACTED]',
        apiKey: tenant.security.apiKey ? '[REDACTED]' : undefined
      },
      database: {
        ...tenant.database,
        password: '[REDACTED]',
        url: tenant.database.url ? '[REDACTED]' : undefined
      }
    };

    return NextResponse.json({ tenant: safeTenant });
  } catch (error) {
    console.error('Error getting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to get tenant' },
      { status: 500 }
    );
  }
}

// PATCH /api/tenants/[id] - Update tenant
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = params.id;
    const updates = await request.json();

    // Don't allow updating sensitive fields via API
    delete updates.security;
    delete updates.database?.password;
    delete updates.database?.url;

    const tenant = await configManager.updateTenantConfig(tenantId, updates);
    
    return NextResponse.json({
      message: 'Tenant updated successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status
      }
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

// DELETE /api/tenants/[id] - Delete tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = params.id;
    const success = await configManager.deleteTenant(tenantId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Tenant not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
