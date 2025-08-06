/**
 * Multi-tenant integration examples for your existing CMS
 */

import { headers } from 'next/headers';
import { getTenantFromHeaders, TenantContext } from '../lib/middleware/tenant';
import { DatabaseService } from '../lib/services/database-service';
import { usePageStore } from '../lib/stores/page-store';

// Example 1: Server Component with tenant context
export async function TenantAwareServerComponent() {
  const headersList = headers();
  const tenantContext = getTenantFromHeaders(headersList);
  
  if (!tenantContext) {
    return <div>Tenant not found</div>;
  }

  // Get tenant-specific data
  const client = await DatabaseService.getConnection(tenantContext.config);
  const pages = await client.page.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return (
    <div className="tenant-content">
      <h1 style={{ color: tenantContext.config.branding.primaryColor }}>
        Welcome to {tenantContext.config.name}
      </h1>
      
      {tenantContext.config.branding.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: tenantContext.config.branding.customCSS }} />
      )}
      
      <div className="pages-list">
        {pages.map(page => (
          <div key={page.id} className="page-item">
            <h3>{page.title}</h3>
            <p>Published: {page.publishedAt?.toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Example 2: Client Component with tenant context
'use client';

import { useTenantContext } from '../lib/middleware/tenant';
import { useEffect, useState } from 'react';

export function TenantAwareClientComponent() {
  const tenantContext = useTenantContext();
  const [tenantPages, setTenantPages] = useState([]);
  const { pages } = usePageStore();

  useEffect(() => {
    if (tenantContext) {
      // Filter pages by tenant (if using shared database)
      const filteredPages = pages.filter(page => 
        page.tenantId === tenantContext.tenantId
      );
      setTenantPages(filteredPages);
    }
  }, [tenantContext, pages]);

  if (!tenantContext) {
    return <div>Loading tenant context...</div>;
  }

  // Apply tenant branding
  const brandingStyle = {
    '--primary-color': tenantContext.config.branding.primaryColor,
    '--logo-url': `url(${tenantContext.config.branding.logo})`
  } as React.CSSProperties;

  return (
    <div className="tenant-dashboard" style={brandingStyle}>
      <header className="tenant-header">
        <img 
          src={tenantContext.config.branding.logo} 
          alt={`${tenantContext.config.name} logo`}
          className="tenant-logo"
        />
        <h1>{tenantContext.config.name} Dashboard</h1>
      </header>

      <div className="feature-flags">
        {tenantContext.config.features.advancedEditor && (
          <button className="advanced-editor-btn">Advanced Editor</button>
        )}
        {tenantContext.config.features.apiAccess && (
          <button className="api-access-btn">API Access</button>
        )}
      </div>

      <div className="tenant-stats">
        <div className="stat">
          <span>Pages: {tenantPages.length}</span>
          <span>Limit: {tenantContext.config.limits.maxPages}</span>
        </div>
        <div className="stat">
          <span>Users: {/* Get from tenant stats */}</span>
          <span>Limit: {tenantContext.config.features.maxUsers}</span>
        </div>
      </div>
    </div>
  );
}

// Example 3: API Route with tenant context
// app/api/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromHeaders } from '../../../lib/middleware/tenant';
import { DatabaseService } from '../../../lib/services/database-service';

export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromHeaders(request.headers);
    
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not specified' },
        { status: 400 }
      );
    }

    // Get tenant-specific database connection
    const client = await DatabaseService.getConnection(tenantContext.config);
    
    // Query pages for this tenant
    const pages = await client.page.findMany({
      where: {
        // tenantId is automatically added by the database service middleware
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        metaTitle: true,
        metaDescription: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    return NextResponse.json({
      pages,
      tenant: {
        id: tenantContext.tenantId,
        name: tenantContext.config.name
      }
    });

  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantContext = getTenantFromHeaders(request.headers);
    
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not specified' },
        { status: 400 }
      );
    }

    // Check tenant limits
    const client = await DatabaseService.getConnection(tenantContext.config);
    const pageCount = await client.page.count();
    
    if (pageCount >= tenantContext.config.limits.maxPages) {
      return NextResponse.json(
        { error: 'Page limit exceeded' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Create page with tenant context
    const page = await client.page.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        builderType: data.builderType || 'puck',
        // tenantId is automatically added by the database service
        authorId: data.authorId
      }
    });

    return NextResponse.json(page);

  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}

// Example 4: Tenant-aware page store update
// lib/stores/tenant-page-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Page } from '@prisma/client';

interface TenantPageStore {
  tenantId: string | null;
  pages: Page[];
  currentPage: Page | null;
  
  setTenant: (tenantId: string) => void;
  setPages: (pages: Page[]) => void;
  setCurrentPage: (page: Page | null) => void;
  addPage: (page: Page) => void;
  updatePage: (id: string, updates: Partial<Page>) => void;
  deletePage: (id: string) => void;
}

export const useTenantPageStore = create<TenantPageStore>()(
  persist(
    (set, get) => ({
      tenantId: null,
      pages: [],
      currentPage: null,

      setTenant: (tenantId) => {
        set({ tenantId, pages: [], currentPage: null });
      },

      setPages: (pages) => {
        const { tenantId } = get();
        // Only set pages that belong to current tenant
        const tenantPages = pages.filter(page => 
          !tenantId || page.tenantId === tenantId
        );
        set({ pages: tenantPages });
      },

      setCurrentPage: (page) => {
        const { tenantId } = get();
        // Validate page belongs to current tenant
        if (page && tenantId && page.tenantId !== tenantId) {
          console.warn('Attempted to set page from different tenant');
          return;
        }
        set({ currentPage: page });
      },

      addPage: (page) => {
        const { tenantId } = get();
        if (tenantId && page.tenantId !== tenantId) {
          console.warn('Attempted to add page from different tenant');
          return;
        }
        set(state => ({ pages: [...state.pages, page] }));
      },

      updatePage: (id, updates) => {
        set(state => ({
          pages: state.pages.map(page =>
            page.id === id ? { ...page, ...updates } : page
          ),
          currentPage: state.currentPage?.id === id 
            ? { ...state.currentPage, ...updates }
            : state.currentPage
        }));
      },

      deletePage: (id) => {
        set(state => ({
          pages: state.pages.filter(page => page.id !== id),
          currentPage: state.currentPage?.id === id ? null : state.currentPage
        }));
      }
    }),
    {
      name: 'tenant-page-store',
      partialize: (state) => ({ 
        tenantId: state.tenantId,
        pages: state.pages 
      })
    }
  )
);

// Example 5: Tenant selection page
// app/select-tenant/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setCurrentTenant } from '../lib/middleware/tenant';

interface TenantOption {
  id: string;
  name: string;
  subdomain: string;
  logo: string;
}

export default function TenantSelectionPage() {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch available tenants for the user
    fetchUserTenants();
  }, []);

  const fetchUserTenants = async () => {
    try {
      const response = await fetch('/api/user/tenants');
      const data = await response.json();
      setTenants(data.tenants);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = async (tenant: TenantOption) => {
    try {
      // Set tenant in localStorage
      setCurrentTenant({
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        config: null as any // Will be loaded by middleware
      });

      // Redirect to tenant subdomain or update URL
      if (tenant.subdomain) {
        window.location.href = `https://${tenant.subdomain}.yourapp.com`;
      } else {
        router.push(`/?tenant=${tenant.id}`);
      }
    } catch (error) {
      console.error('Failed to select tenant:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading your organizations...</div>;
  }

  return (
    <div className="tenant-selection">
      <h1>Select Organization</h1>
      <div className="tenant-grid">
        {tenants.map(tenant => (
          <div 
            key={tenant.id} 
            className="tenant-card"
            onClick={() => selectTenant(tenant)}
          >
            <img src={tenant.logo} alt={`${tenant.name} logo`} />
            <h3>{tenant.name}</h3>
            <p>{tenant.subdomain}.yourapp.com</p>
          </div>
        ))}
      </div>
    </div>
  );
}
