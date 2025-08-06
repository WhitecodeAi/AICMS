import { headers } from 'next/headers';

export default function HomePage() {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantName = headersList.get('x-tenant-name');
  const tenantSubdomain = headersList.get('x-tenant-subdomain');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Multi-Tenant CMS
        </h1>
        
        {tenantId ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                ✅ Tenant Detected
              </h2>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>ID:</strong> {tenantId}</p>
                <p><strong>Name:</strong> {tenantName}</p>
                <p><strong>Subdomain:</strong> {tenantSubdomain}</p>
              </div>
            </div>
            
            <div className="text-center">
              <a 
                href="/admin" 
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Admin Panel
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                ⚠️ No Tenant Detected
              </h2>
              <p className="text-sm text-yellow-700">
                Access this site using a tenant subdomain or domain.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">Try these examples:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>demo.localhost:3000</code></li>
                <li>• <code>enterprise.localhost:3000</code></li>
                <li>• <code>?tenant=demo</code> (query parameter)</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">Available APIs:</h3>
          <div className="space-y-2 text-sm">
            <a 
              href="/api/tenants" 
              className="block text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              GET /api/tenants - List all tenants
            </a>
            <a 
              href="/api/health" 
              className="block text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              GET /api/health - Health check
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
