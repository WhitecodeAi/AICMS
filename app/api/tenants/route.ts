import { NextRequest, NextResponse } from 'next/server';
import { TenantConfigManager, CreateTenantRequest } from '../../../lib/tenant-config';

const configManager = TenantConfigManager.getInstance();

// GET /api/tenants - List all tenants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      const tenants = await configManager.listTenantsWithSummary();
      return NextResponse.json({ tenants });
    } else {
      const tenants = await configManager.listTenants();
      return NextResponse.json({ tenants });
    }
  } catch (error) {
    console.error('Error listing tenants:', error);
    return NextResponse.json(
      { error: 'Failed to list tenants' },
      { status: 500 }
    );
  }
}

// POST /api/tenants - Create new tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateTenantRequest;
    
    // Validate required fields
    if (!body.name || !body.subdomain || !body.adminEmail || !body.adminFirstName || !body.adminLastName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subdomain, adminEmail, adminFirstName, adminLastName' },
        { status: 400 }
      );
    }

    const tenant = await configManager.createTenant(body);
    
    return NextResponse.json(
      { 
        message: 'Tenant created successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          status: tenant.status
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
