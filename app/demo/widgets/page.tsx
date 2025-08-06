'use client'

import { SliderWidget } from '@/components/widgets/SliderWidget'
import { GalleryWidget } from '@/components/widgets/GalleryWidget'

export default function WidgetsDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Slider & Gallery Widgets Demo</h1>
          <p className="mt-2 text-gray-600">
            Testing the SliderWidget and GalleryWidget components with managed content
          </p>
        </div>
      </header>

      {/* Slider Widgets */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Slider Widget Tests</h2>
          <p className="text-gray-600 mb-8">Testing sliders by ID and by location.</p>
        </div>

        {/* Test by ID */}
        <div className="mb-12">
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <h3 className="text-xl font-semibold">Slider by ID (sliderId="1")</h3>
            <p className="text-gray-600">Homepage Hero Slider</p>
          </div>
          <SliderWidget
            sliderId="1"
            height="500px"
            autoPlay={true}
            autoPlaySpeed={5}
            showDots={true}
            showArrows={true}
          />
        </div>

        {/* Test by Location */}
        <div className="mb-12">
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <h3 className="text-xl font-semibold">Slider by Location (location="header")</h3>
            <p className="text-gray-600">Announcements Slider</p>
          </div>
          <SliderWidget
            location="header"
            height="120px"
            autoPlay={true}
            autoPlaySpeed={8}
            showDots={false}
            showArrows={false}
          />
        </div>

        {/* Test another ID */}
        <div className="mb-12">
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <h3 className="text-xl font-semibold">Slider by ID (sliderId="3")</h3>
            <p className="text-gray-600">Product Showcase Slider</p>
          </div>
          <SliderWidget
            sliderId="3"
            height="400px"
            autoPlay={false}
            showDots={true}
            showArrows={true}
          />
        </div>
      </section>

      {/* Gallery Widgets */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Gallery Widget Tests</h2>
          <p className="text-gray-600 mb-8">Testing galleries by ID and by shortcode.</p>
        </div>

        {/* Test by ID */}
        <div className="mb-12">
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <h3 className="text-xl font-semibold">Gallery by ID (galleryId="1")</h3>
            <p className="text-gray-600">Campus Events 2024 - Grid Layout</p>
          </div>
          <GalleryWidget
            galleryId="1"
            title="Campus Events Gallery"
            layout="grid"
            columns={3}
            showCaptions={true}
            lightbox={true}
            maxImages={12}
          />
        </div>

        {/* Test by Shortcode */}
        <div className="mb-12">
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <h3 className="text-xl font-semibold">Gallery by Shortcode (galleryId="science-lab")</h3>
            <p className="text-gray-600">Science Laboratory - Masonry Layout</p>
          </div>
          <GalleryWidget
            galleryId="science-lab"
            title="Science Laboratory Gallery"
            layout="masonry"
            columns={4}
            showCaptions={true}
            lightbox={true}
            maxImages={10}
          />
        </div>

        {/* Test Carousel Layout */}
        <div className="mb-12">
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <h3 className="text-xl font-semibold">Gallery by ID (galleryId="3") - Carousel</h3>
            <p className="text-gray-600">Student Achievements - Carousel Layout</p>
          </div>
          <GalleryWidget
            galleryId="3"
            title="Student Achievements Gallery"
            layout="carousel"
            autoPlay={true}
            autoPlaySpeed={6}
            showCaptions={true}
            lightbox={false}
          />
        </div>
      </section>

      {/* Error Handling Tests */}
      <section className="py-8 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Error Handling Tests</h2>
          <p className="text-gray-600 mb-8">Testing how widgets handle non-existent content.</p>
        </div>

        {/* Test Non-existent Slider */}
        <div className="mb-12">
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <h3 className="text-xl font-semibold">Non-existent Slider (sliderId="999")</h3>
            <p className="text-gray-600">Should show fallback message</p>
          </div>
          <SliderWidget
            sliderId="999"
            height="300px"
          />
        </div>

        {/* Test Non-existent Gallery */}
        <div className="mb-12">
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <h3 className="text-xl font-semibold">Non-existent Gallery (galleryId="non-existent")</h3>
            <p className="text-gray-600">Should show fallback message</p>
          </div>
          <GalleryWidget
            galleryId="non-existent"
            title="Non-existent Gallery"
            layout="grid"
            columns={3}
          />
        </div>
      </section>

      {/* Instructions */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Testing Instructions</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              This demo page tests the SliderWidget and GalleryWidget components with content managed through the admin panel.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 text-blue-900">To test Slider creation:</h3>
                <ol className="text-sm text-blue-800 space-y-2">
                  <li>1. Go to <code>/admin/slider</code></li>
                  <li>2. Create a new slider with images and content</li>
                  <li>3. Note the slider ID from the admin panel</li>
                  <li>4. Use that ID in the SliderWidget component</li>
                  <li>5. Check if it renders properly above</li>
                </ol>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 text-green-900">To test Gallery creation:</h3>
                <ol className="text-sm text-green-800 space-y-2">
                  <li>1. Go to <code>/admin/gallery</code></li>
                  <li>2. Create a new gallery with images</li>
                  <li>3. Note the gallery ID or shortcode</li>
                  <li>4. Use that ID/shortcode in the GalleryWidget</li>
                  <li>5. Check if it renders properly above</li>
                </ol>
              </div>
            </div>

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold mb-3 text-yellow-900">Expected Behavior:</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Widgets should load content from the admin-managed stores</li>
                <li>• Updates in admin should reflect in the widgets</li>
                <li>• Non-existent IDs should show helpful error messages</li>
                <li>• All widget features (lightbox, autoplay, etc.) should work</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>Widgets Demo - Testing SliderWidget and GalleryWidget Integration</p>
        </div>
      </footer>
    </div>
  )
}
