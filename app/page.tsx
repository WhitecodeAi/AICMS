'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Palette, Globe } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to admin after 3 seconds for demo purposes
    const timer = setTimeout(() => {
      router.push('/admin')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Multi-Tenant CMS
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build beautiful websites for multiple clients with our powerful, drag-and-drop website builder and content management system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/admin')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Access Admin Dashboard
            </button>
            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors">
              View Documentation
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Tenant</h3>
            <p className="text-gray-600">Manage multiple client websites from a single platform with isolated data and customization.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Palette className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Drag & Drop Builder</h3>
            <p className="text-gray-600">Create stunning pages with our intuitive drag-and-drop page builder. No coding required.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Management</h3>
            <p className="text-gray-600">Full-featured CMS with pages, posts, media management, and dynamic content capabilities.</p>
          </div>
        </div>

        {/* Auto-redirect notice */}
        <div className="text-center">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-blue-700 text-sm">
              Redirecting to admin dashboard in a moment...
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
