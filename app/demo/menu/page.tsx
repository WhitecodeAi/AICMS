'use client'

import DynamicNavigation from '@/components/navigation/DynamicNavigation'
import { DynamicHeader } from '@/lib/puck-config'

export default function MenuDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header with Dynamic Menu */}
      <DynamicHeader
        logoText="Demo Website"
        backgroundColor="#ffffff"
        textColor="#1f2937"
        menuLocation="header"
        contactInfo={{
          phone: "+1 (555) 123-4567",
          email: "info@demo.com"
        }}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dynamic Menu System Demo</h1>
          <p className="text-xl text-gray-600">
            This page demonstrates the dynamic menu system integration with your CMS
          </p>
        </div>

        {/* Navigation Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Horizontal Navigation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Horizontal Navigation</h2>
            <p className="text-gray-600 mb-6">Header-style navigation with dropdown support</p>
            
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <DynamicNavigation 
                location="header"
                orientation="horizontal"
                showIcons={true}
                className="justify-center"
              />
            </div>
          </div>

          {/* Vertical Navigation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vertical Navigation</h2>
            <p className="text-gray-600 mb-6">Sidebar-style navigation with nested items</p>
            
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <DynamicNavigation 
                location="header"
                orientation="vertical"
                showIcons={true}
                maxDepth={3}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">How to Use the Dynamic Menu System</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Create Pages</h3>
                <p className="text-gray-600">
                  Go to <code className="bg-gray-100 px-2 py-1 rounded">/admin/pages</code> to create and manage your website pages.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Build Menu Structure</h3>
                <p className="text-gray-600">
                  Navigate to <code className="bg-gray-100 px-2 py-1 rounded">/admin/menus</code> to build your menu structure using the drag & drop interface.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Add to Puck Templates</h3>
                <p className="text-gray-600">
                  Use the DynamicHeader component in your Puck templates, set the <code className="bg-gray-100 px-2 py-1 rounded">menuLocation</code> field to "header".
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Live Updates</h3>
                <p className="text-gray-600">
                  Changes made in the admin menu builder will automatically appear in your live website navigation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Drag & Drop Builder</h3>
            <p className="text-gray-600 text-sm">
              Easily reorder menu items and create submenus with intuitive drag & drop interface
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-time Updates</h3>
            <p className="text-gray-600 text-sm">
              Menu changes are instantly reflected across all website templates and components
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Multi-location Support</h3>
            <p className="text-gray-600 text-sm">
              Create different menus for header, footer, sidebar, and mobile locations
            </p>
          </div>
        </div>

        {/* Admin Links */}
        <div className="mt-12 bg-gray-900 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Quick Admin Access</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/admin/menus"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Menu Builder
            </a>
            <a 
              href="/admin/pages"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Pages Manager
            </a>
            <a 
              href="/admin/builder"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Puck Builder
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
