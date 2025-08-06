'use client'

import { useState } from 'react'
import { usePageStore } from '@/lib/stores/page-store'
import { useRouter } from 'next/navigation'
import { HTMLToPuckConverter } from '@/lib/html-to-puck-converter'
import { 
  Upload, 
  FileText, 
  Eye, 
  Code, 
  Palette, 
  Settings,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Zap,
  Layers,
  RefreshCw
} from 'lucide-react'

export default function HTMLImport() {
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [js, setJs] = useState('')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [detectedSections, setDetectedSections] = useState<any[]>([])

  const { createPage, setCurrentPage } = usePageStore()
  const router = useRouter()

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  const analyzeHTML = () => {
    if (!html.trim()) {
      setError('Please enter HTML content to analyze')
      return
    }

    try {
      const sections = HTMLToPuckConverter.detectSections(html)
      setDetectedSections(sections)
      setError('')
    } catch (err) {
      setError('Failed to analyze HTML structure')
      console.error(err)
    }
  }

  const handlePreview = () => {
    if (!html.trim()) {
      setError('Please enter HTML content to preview')
      return
    }

    const previewContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview - ${title || 'Imported Page'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `
    
    const previewWindow = window.open('', '_blank', 'width=1200,height=800')
    if (previewWindow) {
      previewWindow.document.write(previewContent)
      previewWindow.document.close()
    }
  }

  const handleCreatePage = async () => {
    if (!title.trim()) {
      setError('Please enter a page title')
      return
    }
    
    if (!slug.trim()) {
      setError('Please enter a URL slug')
      return
    }
    
    if (!html.trim()) {
      setError('Please enter HTML content')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const newPage = createPage(title.trim(), slug.trim(), 'puck')
      
      // Convert HTML to Puck data and save
      const puckData = HTMLToPuckConverter.convertToPuckData(html, css)
      newPage.data = puckData
      
      setCurrentPage(newPage)
      setSuccess(`Page "${title}" created successfully!`)
      
      // Clear form after successful creation
      setTimeout(() => {
        setSuccess('')
        setTitle('')
        setSlug('')
        setHtml('')
        setCss('')
        setJs('')
        setDetectedSections([])
      }, 2000)

    } catch (error) {
      console.error('Failed to create page:', error)
      setError('Failed to create page. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleConvertAndEdit = async () => {
    if (!title.trim() || !html.trim()) {
      setError('Please create the page first by filling in the title and HTML content')
      return
    }
    
    setIsConverting(true)
    try {
      await handleCreatePage()
      // Navigate to Puck builder after a brief delay
      setTimeout(() => {
        router.push('/admin/builder')
      }, 1000)
    } finally {
      setIsConverting(false)
    }
  }

  const sampleHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Website</title>
</head>
<body>
    <header class="header">
        <nav class="navbar">
            <div class="logo">
                <h1>Your Website</h1>
            </div>
            <ul class="nav-menu">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/services">Services</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <section class="slider hero-slider">
        <div class="slide active">
            <img src="https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=Welcome+to+Our+Website" alt="Hero Image">
            <div class="slide-content">
                <h2>Welcome to Our Amazing Website</h2>
                <p>Discover excellence in everything we do</p>
                <a href="#" class="btn">Get Started</a>
            </div>
        </div>
    </section>

    <section class="news">
        <h2>Latest News & Notices</h2>
        <div class="news-grid">
            <article class="news-item">
                <h3>Important Announcement</h3>
                <p class="date">January 15, 2024</p>
                <p>This is a sample news article about our latest updates and announcements.</p>
                <a href="#">Read More</a>
            </article>
            <article class="news-item">
                <h3>Upcoming Event</h3>
                <p class="date">January 20, 2024</p>
                <p>Join us for our annual conference featuring industry experts and networking.</p>
                <a href="#">Read More</a>
            </article>
        </div>
    </section>

    <section class="gallery">
        <h2>Photo Gallery</h2>
        <div class="image-grid">
            <img src="https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Photo+1" alt="Gallery Image 1">
            <img src="https://via.placeholder.com/400x300/10B981/FFFFFF?text=Photo+2" alt="Gallery Image 2">
            <img src="https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Photo+3" alt="Gallery Image 3">
        </div>
    </section>

    <section class="events">
        <h2>Upcoming Events</h2>
        <div class="event">
            <h3>Annual Conference 2024</h3>
            <p class="date">March 15, 2024</p>
            <p class="location">Main Auditorium</p>
            <p>Join us for our annual conference featuring industry experts.</p>
        </div>
    </section>

    <footer class="footer">
        <div class="footer-section">
            <h4>Quick Links</h4>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        </div>
        <div class="footer-section">
            <h4>Contact Info</h4>
            <p>Email: info@yourwebsite.com</p>
            <p>Phone: (555) 123-4567</p>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2024 Your Website. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`

  const sampleCSS = `/* Header Styles */
.header {
    background: #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 1rem 2rem;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
}

.logo h1 {
    color: #3b82f6;
    margin: 0;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
    margin: 0;
    padding: 0;
}

.nav-menu a {
    text-decoration: none;
    color: #374151;
    font-weight: 500;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: #3b82f6;
}

/* Slider Styles */
.slider {
    position: relative;
    height: 500px;
    overflow: hidden;
}

.slide {
    position: relative;
    width: 100%;
    height: 100%;
}

.slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.slide-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: white;
}

.slide-content h2 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.slide-content p {
    font-size: 1.25rem;
    margin-bottom: 2rem;
}

.btn {
    display: inline-block;
    background: #3b82f6;
    color: white;
    padding: 0.75rem 2rem;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: background 0.3s;
}

.btn:hover {
    background: #2563eb;
}

/* News Section */
.news {
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.news h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
    color: #1f2937;
}

.news-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.news-item {
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.news-item:hover {
    transform: translateY(-5px);
}

.news-item h3 {
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.news-item .date {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}

/* Gallery Styles */
.gallery {
    padding: 4rem 2rem;
    background: #f9fafb;
}

.gallery h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
    color: #1f2937;
}

.image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    max-width: 1200px;
    margin: 0 auto;
}

.image-grid img {
    width: 100%;
    height: 250px;
    object-fit: cover;
    border-radius: 0.5rem;
    transition: transform 0.3s;
}

.image-grid img:hover {
    transform: scale(1.05);
}

/* Events Section */
.events {
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.events h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
    color: #1f2937;
}

.event {
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
}

.event h3 {
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.event .date, .event .location {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

/* Footer Styles */
.footer {
    background: #1f2937;
    color: white;
    padding: 3rem 2rem 1rem;
}

.footer-section {
    margin-bottom: 2rem;
}

.footer-section h4 {
    margin-bottom: 1rem;
    color: #f9fafb;
}

.footer-section ul {
    list-style: none;
    padding: 0;
}

.footer-section ul li {
    margin-bottom: 0.5rem;
}

.footer-section a {
    color: #d1d5db;
    text-decoration: none;
    transition: color 0.3s;
}

.footer-section a:hover {
    color: #f9fafb;
}

.footer-bottom {
    border-top: 1px solid #374151;
    padding-top: 1rem;
    text-align: center;
    color: #9ca3af;
}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import HTML/CSS to Dynamic Sections</h1>
          <p className="text-gray-600 mt-1">Import your code and convert it to editable dynamic sections</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">🚀 Smart HTML to Dynamic Sections Converter</h3>
        <div className="text-blue-800 space-y-2">
          <p>✨ <strong>Automatically detects:</strong> Headers, Sliders, News, Gallery, Events, Activities, Footer, Popups</p>
          <p>🎯 <strong>Converts to:</strong> Editable dynamic sections that work across all client websites</p>
          <p>🎨 <strong>Customizable:</strong> Change colors, images, text, and CSS for each client</p>
          <p>⚡ <strong>Puck.js Ready:</strong> Edit visually with drag & drop after import</p>
        </div>
      </div>

      {/* Page Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter page title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="page-url-slug"
            />
            <p className="text-xs text-gray-500 mt-1">URL: /{slug || 'page-url-slug'}</p>
          </div>
        </div>
      </div>

      {/* Code Input Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HTML Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">HTML Content</h3>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setHtml(sampleHTML)}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded"
              >
                Load Sample
              </button>
              <button
                onClick={analyzeHTML}
                disabled={!html.trim()}
                className={`text-sm px-3 py-1 rounded transition-colors ${
                  html.trim() 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                Analyze
              </button>
            </div>
          </div>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Paste your HTML code here..."
          />
        </div>

        {/* CSS Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Palette className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">CSS Styles</h3>
            </div>
            <button
              onClick={() => setCss(sampleCSS)}
              className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded"
            >
              Load Sample
            </button>
          </div>
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Paste your CSS code here..."
          />
        </div>
      </div>

      {/* Detected Sections */}
      {detectedSections.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Detected Sections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {detectedSections.map((section, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    section.type === 'header' ? 'bg-blue-500' :
                    section.type === 'slider' ? 'bg-green-500' :
                    section.type === 'news' ? 'bg-yellow-500' :
                    section.type === 'gallery' ? 'bg-purple-500' :
                    section.type === 'events' ? 'bg-red-500' :
                    section.type === 'activities' ? 'bg-indigo-500' :
                    section.type === 'footer' ? 'bg-gray-500' :
                    section.type === 'popup' ? 'bg-pink-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium capitalize">{section.type}</span>
                </div>
                {section.metadata && (
                  <div className="text-xs text-gray-600">
                    {section.type === 'slider' && `${section.metadata.slideCount} slides`}
                    {section.type === 'news' && `${section.metadata.itemCount} items`}
                    {section.type === 'gallery' && `${section.metadata.imageCount} images`}
                    {section.type === 'events' && `${section.metadata.eventCount} events`}
                    {section.type === 'activities' && `${section.metadata.activityCount} activities`}
                    {section.type === 'header' && (section.metadata.hasLogo ? 'With logo' : 'Text only')}
                    {section.type === 'footer' && `${section.metadata.linkCount} links`}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Your HTML will be converted to {detectedSections.length} dynamic section(s) that you can customize for each client!
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handlePreview}
            disabled={!html.trim()}
            className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
              html.trim()
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Original
          </button>

          <button
            onClick={handleCreatePage}
            disabled={!title.trim() || !html.trim() || isCreating}
            className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
              title.trim() && html.trim() && !isCreating
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Create Dynamic Page
              </>
            )}
          </button>

          <button
            onClick={handleConvertAndEdit}
            disabled={!title.trim() || !html.trim() || isConverting}
            className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
              title.trim() && html.trim() && !isConverting
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isConverting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Convert & Edit in Puck.js
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
