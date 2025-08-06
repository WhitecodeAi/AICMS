'use client'

import { NewsNoticesWidget } from '@/components/widgets/NewsNoticesWidget'

export default function NewsAndNoticesDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">News & Notices Demo</h1>
          <p className="mt-2 text-gray-600">
            Showcasing different configurations of the NewsNoticesWidget component
          </p>
        </div>
      </header>

      {/* Basic Widget */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Basic Configuration</h2>
          <p className="text-gray-600 mb-8">Default widget with grid layout and standard styling.</p>
        </div>
        <NewsNoticesWidget
          title="Latest News & Updates"
          subtitle="Stay informed with our latest announcements and important notices"
          backgroundColor="#f8fafc"
          textColor="#1f2937"
          accentColor="#3b82f6"
          showDate={true}
          showCategory={true}
          showExcerpt={true}
          layout="grid-3"
          cardStyle="card"
          maxItems={6}
        />
      </section>

      {/* Modern Style */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Modern Style</h2>
          <p className="text-gray-600 mb-8">Modern card style with hover animations and dark theme.</p>
        </div>
        <NewsNoticesWidget
          title="Important Announcements"
          backgroundColor="#1f2937"
          textColor="#ffffff"
          titleColor="#ffffff"
          cardBackgroundColor="#ffffff"
          accentColor="#10b981"
          layout="grid-2"
          cardStyle="modern"
          showDate={true}
          showCategory={true}
          showExcerpt={true}
          maxItems={4}
        />
      </section>

      {/* List Layout */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">List Layout</h2>
          <p className="text-gray-600 mb-8">Horizontal list layout ideal for detailed news viewing.</p>
        </div>
        <NewsNoticesWidget
          title="Recent Updates"
          subtitle="Comprehensive updates in an easy-to-read list format"
          backgroundColor="#f0f9ff"
          accentColor="#0ea5e9"
          layout="list"
          cardStyle="minimal"
          showDate={true}
          showCategory={true}
          showExcerpt={true}
          showAuthor={true}
          maxItems={3}
        />
      </section>

      {/* Interactive Features */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Interactive Features</h2>
          <p className="text-gray-600 mb-8">Widget with search, filters, and interactive controls.</p>
        </div>
        <NewsNoticesWidget
          title="Interactive News Center"
          subtitle="Search, filter, and browse news with advanced controls"
          showSearch={true}
          showFilters={true}
          showViewToggle={true}
          showTags={true}
          showReadTime={true}
          backgroundColor="#ffffff"
          accentColor="#8b5cf6"
          layout="grid-3"
          cardStyle="gradient"
          enableShare={true}
          maxItems={6}
        />
      </section>

      {/* Masonry Layout */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Masonry Layout</h2>
          <p className="text-gray-600 mb-8">Pinterest-style masonry layout for dynamic content heights.</p>
        </div>
        <NewsNoticesWidget
          title="Featured Stories"
          backgroundColor="#fef3c7"
          accentColor="#f59e0b"
          layout="masonry"
          cardStyle="bordered"
          showDate={true}
          showCategory={true}
          showExcerpt={true}
          maxItems={8}
        />
      </section>

      {/* Compact Widget */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Compact Widget</h2>
          <p className="text-gray-600 mb-8">Minimal configuration for sidebar or footer placement.</p>
        </div>
        <NewsNoticesWidget
          title="Quick Updates"
          layout="grid-4"
          cardStyle="minimal"
          showDate={false}
          showCategory={true}
          showExcerpt={false}
          maxItems={4}
          backgroundColor="#f9fafb"
          accentColor="#6366f1"
        />
      </section>

      {/* Auto-refresh Demo */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Auto-Refresh & Load More</h2>
          <p className="text-gray-600 mb-8">Widget with auto-refresh and infinite scroll capabilities.</p>
        </div>
        <NewsNoticesWidget
          title="Live News Feed"
          subtitle="Automatically updated news with load more functionality"
          autoRefresh={true}
          refreshInterval={60}
          enableInfiniteScroll={true}
          showSearch={true}
          backgroundColor="#ecfdf5"
          accentColor="#059669"
          layout="grid-3"
          cardStyle="card"
          maxItems={3}
        />
      </section>

      {/* Configuration Guide */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Configuration Options</h2>
          <p className="text-gray-600 mb-8">
            This demo showcases the NewsNoticesWidget component with various configuration options available in the Puck editor.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Layout Options</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Grid (2, 3, 4 columns)</li>
                <li>• List view</li>
                <li>• Masonry layout</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Card Styles</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Default card</li>
                <li>• Modern with animations</li>
                <li>• Minimal border</li>
                <li>• Gradient background</li>
                <li>• Left bordered</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Interactive Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Search functionality</li>
                <li>• Category filtering</li>
                <li>• View toggle</li>
                <li>• Auto-refresh</li>
                <li>• Load more/infinite scroll</li>
                <li>• Share buttons</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>News & Notices Widget Demo - Built with Next.js and Tailwind CSS</p>
        </div>
      </footer>
    </div>
  )
}
