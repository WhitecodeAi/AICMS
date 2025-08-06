'use client'

import { NavigationMenu } from '@/components/widgets/NavigationMenu'

export default function TestNavigationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* College-style Navigation */}
      <NavigationMenu
        title=""
        menuLocation="header"
        backgroundColor="#6B46C1"
        textColor="#FFFFFF"
        hoverColor="#8B5CF6"
        activeColor="#7C3AED"
        dropdownBackgroundColor="#FFFFFF"
        dropdownTextColor="#1F2937"
        borderColor="#E5E7EB"
        alignment="center"
        spacing="normal"
        fontSize="medium"
        fontWeight="medium"
        enableDropdowns={true}
        showMobileMenu={true}
        stickyOnScroll={false}
      />

      {/* Test Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">NavigationMenu Component Test</h1>
          <p className="text-xl text-gray-600">
            This page tests the NavigationMenu component with college-style layout
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Desktop Navigation</h3>
            <p className="text-gray-600">Horizontal menu with dropdown support</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Mobile Navigation</h3>
            <p className="text-gray-600">Responsive hamburger menu for mobile devices</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Dynamic Content</h3>
            <p className="text-gray-600">Menu items loaded from admin panel</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Use in Puck.js</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="text-gray-700">
                  Go to <strong>Puck Builder</strong> and drag the <strong>NavigationMenu</strong> component onto your page
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="text-gray-700">
                  Configure the menu location (header, footer, sidebar, mobile) in the component settings
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <p className="text-gray-700">
                  Customize the styling, colors, fonts, and behavior as needed
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <p className="text-gray-700">
                  The menu content will automatically load from your <strong>Menu Builder</strong> settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Links */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <a 
            href="/admin/menus"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Configure Menus
          </a>
          <a 
            href="/admin/builder"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Open Puck Builder
          </a>
          <a 
            href="/demo/menu"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Menu Demo
          </a>
        </div>
      </div>
    </div>
  )
}
