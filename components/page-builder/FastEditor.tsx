'use client'

import { useState, useEffect, useRef } from 'react'
import { usePageStore } from '@/lib/stores/page-store'
import { 
  Save, 
  Eye, 
  Globe, 
  ArrowLeft, 
  FileText,
  Code,
  Palette,
  CheckCircle,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  PlusCircle,
  Copy,
  Search,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  Image,
  Video,
  ShoppingCart,
  MessageSquare,
  Users,
  Award,
  Target,
  Zap,
  Heart,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface FastEditorProps {
  pageId?: string
  onSave?: (html: string, css: string) => void
  onPublish?: () => void
}

export default function FastEditor({ pageId, onSave, onPublish }: FastEditorProps) {
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [js, setJs] = useState('')
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'preview'>('html')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [selectedCategory, setSelectedCategory] = useState('layout')
  const [searchTemplate, setSearchTemplate] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Store original content in ref to avoid re-render loops
  const originalContentRef = useRef({ html: '', css: '', js: '' })
  const lastPageIdRef = useRef<string | null>(null)
  const { currentPage, savePageHTML, publishPage } = usePageStore()

  // Get stable page ID value
  const currentPageId = currentPage?.id || null

  // Initialize content when currentPage changes
 useEffect(() => {
  if (!currentPage) {
    setIsInitialized(false)
    lastPageIdRef.current = null
    originalContentRef.current = { html: '', css: '', js: '' }
    return
  }

  // ✅ Only run when the page actually changes
  if (lastPageIdRef.current === currentPageId) return

  const pageHtml = currentPage.html || ''
  const pageCss = currentPage.css || ''
  const pageJs = currentPage.js || ''

  // ✅ Update state because page really changed
  setHtml(pageHtml)
  setCss(pageCss)
  setJs(pageJs)

  // ✅ Track the loaded content
  originalContentRef.current = { html: pageHtml, css: pageCss, js: pageJs }
  lastPageIdRef.current = currentPageId

  setHasUnsavedChanges(false)
  setIsInitialized(true)
}, [currentPageId])


  // Check for changes only after initialization (separate effect to avoid dependency loops)
  useEffect(() => {
    // Use the ref to check if we're initialized to avoid dependency on state
    if (!lastPageIdRef.current) return

    const hasChanges = html !== originalContentRef.current.html ||
                      css !== originalContentRef.current.css ||
                      js !== originalContentRef.current.js

    setHasUnsavedChanges(hasChanges)
  }, [html, css, js])

  const handleCodeChange = (code: string, type: 'html' | 'css' | 'js') => {
    if (type === 'html') setHtml(code)
    if (type === 'css') setCss(code)
    if (type === 'js') setJs(code)
  }

  const handleSave = async () => {
    if (!currentPage) {
      console.error('No current page to save')
      alert('No page selected. Please try again.')
      return
    }

    console.log('Starting save process...', {
      pageId: currentPage.id,
      hasUnsavedChanges,
      htmlLength: html.length,
      cssLength: css.length,
      jsLength: js.length
    })

    setIsSaving(true)
    try {
      // Call the store function to save
      savePageHTML(currentPage.id, html, css, js)

      // Update original content reference for comparison
      originalContentRef.current = { html, css, js }
      setHasUnsavedChanges(false)

      // Trigger callback if provided
      onSave?.(html, css)

      console.log('Page saved successfully!')

      // Show success feedback
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)

    } catch (error) {
      console.error('Failed to save page:', error)
      alert('Failed to save page. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!currentPage) return
    
    setIsPublishing(true)
    try {
      await handleSave()
      publishPage(currentPage.id)
      setShowPublishSuccess(true)
      onPublish?.()
      setTimeout(() => setShowPublishSuccess(false), 5000)
    } catch (error) {
      console.error('Failed to publish page:', error)
      alert('Failed to publish page. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePreview = () => {
    // Convert className to class for standard HTML
    const processedHtml = html.replace(/className=/g, 'class=')

    const previewContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview - ${currentPage?.title || 'Page'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>${css}</style>
        </head>
        <body>
          ${processedHtml}
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

  const insertTemplate = (template: string) => {
    setHtml(html + template)
  }

  const templateCategories = {
    layout: {
      name: 'Layout & Structure',
      icon: FileText,
      templates: [
        {
          name: 'Basic HTML Structure',
          icon: FileText,
          code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Website</title>
</head>
<body>
    <header>
        <h1>Your Website</h1>
    </header>
    
    <main>
        <section>
            <h2>Welcome</h2>
            <p>Your content goes here.</p>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Your Website. All rights reserved.</p>
    </footer>
</body>
</html>`
        },
        {
          name: 'Container Section',
          icon: Building,
          code: `
<section className="py-16 px-4">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl font-bold text-center mb-8">Section Title</h2>
    <p className="text-lg text-center text-gray-600">Add your content here</p>
  </div>
</section>`
        },
        {
          name: 'Two Column Layout',
          icon: Copy,
          code: `
<section className="py-16 px-4">
  <div className="max-w-6xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-2xl font-bold mb-4">Left Column</h3>
        <p className="text-gray-600">Content for the left column goes here.</p>
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-4">Right Column</h3>
        <p className="text-gray-600">Content for the right column goes here.</p>
      </div>
    </div>
  </div>
</section>`
        }
      ]
    },
    headers: {
      name: 'Headers & Navigation',
      icon: User,
      templates: [
        {
          name: 'Simple Header',
          icon: User,
          code: `
<header className="bg-white shadow-md">
  <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center">
      <h1 className="text-2xl font-bold text-blue-600">Your Logo</h1>
    </div>
    <nav className="hidden md:flex space-x-6">
      <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
      <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
      <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Services</a>
      <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
    </nav>
  </div>
</header>`
        },
        {
          name: 'Header with CTA',
          icon: Target,
          code: `
<header className="bg-blue-600 text-white">
  <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center">
      <h1 className="text-2xl font-bold">Your Company</h1>
    </div>
    <nav className="hidden md:flex items-center space-x-6">
      <a href="#" className="hover:text-blue-200 transition-colors">Home</a>
      <a href="#" className="hover:text-blue-200 transition-colors">About</a>
      <a href="#" className="hover:text-blue-200 transition-colors">Services</a>
      <a href="#" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Get Started</a>
    </nav>
  </div>
</header>`
        },
        {
          name: 'Header with Contact Info',
          icon: Phone,
          code: `
<header>
  <div className="bg-gray-800 text-white text-sm">
    <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="flex items-center"><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg> info@company.com</span>
        <span className="flex items-center"><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg> (555) 123-4567</span>
      </div>
      <div className="flex items-center space-x-3">
        <a href="#" className="hover:text-gray-300">Facebook</a>
        <a href="#" className="hover:text-gray-300">Twitter</a>
        <a href="#" className="hover:text-gray-300">LinkedIn</a>
      </div>
    </div>
  </div>
  <div className="bg-white shadow-md">
    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">Your Company</h1>
      <nav className="hidden md:flex space-x-6">
        <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
        <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
        <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Services</a>
        <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
      </nav>
    </div>
  </div>
</header>`
        }
      ]
    },
    heroes: {
      name: 'Hero Sections',
      icon: Star,
      templates: [
        {
          name: 'Hero with Background',
          icon: Image,
          code: `
<section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-24 px-4">
  <div className="max-w-4xl mx-auto text-center">
    <h1 className="text-5xl font-bold mb-6">Welcome to Our Website</h1>
    <p className="text-xl mb-8 opacity-90">Create amazing experiences with our services</p>
    <a href="#" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Get Started</a>
  </div>
</section>`
        },
        {
          name: 'Hero with Image',
          icon: Image,
          code: `
<section className="py-16 px-4">
  <div className="max-w-6xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Build Amazing Websites</h1>
        <p className="text-xl text-gray-600 mb-8">Transform your ideas into beautiful, functional websites with our powerful tools and expert guidance.</p>
        <div className="space-x-4">
          <a href="#" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Start Building</a>
          <a href="#" className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">Learn More</a>
        </div>
      </div>
      <div>
        <img src="https://via.placeholder.com/600x400/3B82F6/FFFFFF?text=Hero+Image" alt="Hero Image" className="w-full h-auto rounded-lg shadow-lg">
      </div>
    </div>
  </div>
</section>`
        },
        {
          name: 'Hero with Video',
          icon: Video,
          code: `
<section className="relative bg-black text-white py-24 px-4 overflow-hidden">
  <video autoplay muted loop className="absolute inset-0 w-full h-full object-cover opacity-50">
    <source src="your-video.mp4" type="video/mp4">
  </video>
  <div className="relative z-10 max-w-4xl mx-auto text-center">
    <h1 className="text-5xl font-bold mb-6">Experience Excellence</h1>
    <p className="text-xl mb-8 opacity-90">Watch our story unfold and discover what makes us different</p>
    <button className="inline-flex items-center bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M8 5v10l8-5-8-5z"></path></svg>
      Watch Video
    </button>
  </div>
</section>`
        }
      ]
    },
    about: {
      name: 'About Sections',
      icon: User,
      templates: [
        {
          name: 'About Us Simple',
          icon: User,
          code: `
<section className="py-16 px-4 bg-gray-50">
  <div className="max-w-4xl mx-auto text-center">
    <h2 className="text-3xl font-bold text-gray-900 mb-8">About Our Company</h2>
    <p className="text-lg text-gray-600 mb-6">We are passionate about creating exceptional experiences and delivering outstanding results for our clients. With years of expertise and a commitment to excellence, we help businesses thrive in today's competitive landscape.</p>
    <p className="text-lg text-gray-600 mb-8">Our team combines creativity, technical expertise, and strategic thinking to deliver solutions that make a real difference.</p>
    <a href="#" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Learn More About Us</a>
  </div>
</section>`
        },
        {
          name: 'About with Stats',
          icon: TrendingUp,
          code: `
<section className="py-16 px-4">
  <div className="max-w-6xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
        <p className="text-gray-600 mb-6">Founded in 2020, we've been dedicated to helping businesses succeed through innovative solutions and exceptional service. Our journey began with a simple mission: to make technology accessible and powerful for everyone.</p>
        <p className="text-gray-600 mb-8">Today, we're proud to serve clients worldwide, delivering results that exceed expectations and building lasting partnerships based on trust and excellence.</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
          <div className="text-gray-600">Happy Clients</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">1000+</div>
          <div className="text-gray-600">Projects Completed</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
          <div className="text-gray-600">Team Members</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-red-600 mb-2">5</div>
          <div className="text-gray-600">Years Experience</div>
        </div>
      </div>
    </div>
  </div>
</section>`
        },
        {
          name: 'Mission & Vision',
          icon: Target,
          code: `
<section className="py-16 px-4 bg-white">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission & Vision</h2>
      <p className="text-lg text-gray-600">Driving innovation and excellence in everything we do</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="text-center p-8 bg-blue-50 rounded-lg">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
        <p className="text-gray-600">To empower businesses with innovative solutions that drive growth, efficiency, and success in an ever-evolving digital world.</p>
      </div>
      <div className="text-center p-8 bg-green-50 rounded-lg">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path></svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
        <p className="text-gray-600">To be the leading partner for businesses seeking transformative technology solutions that create lasting value and competitive advantage.</p>
      </div>
    </div>
  </div>
</section>`
        }
      ]
    },
    services: {
      name: 'Services & Features',
      icon: Zap,
      templates: [
        {
          name: 'Services Grid',
          icon: Zap,
          code: `
<section className="py-16 px-4">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
      <p className="text-lg text-gray-600">Comprehensive solutions to help your business thrive</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path></svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Web Development</h3>
        <p className="text-gray-600">Custom websites and web applications built with modern technologies and best practices.</p>
      </div>
      <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">UI/UX Design</h3>
        <p className="text-gray-600">Beautiful, user-friendly designs that enhance user experience and drive engagement.</p>
      </div>
      <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Digital Marketing</h3>
        <p className="text-gray-600">Strategic marketing solutions to increase your online presence and reach your target audience.</p>
      </div>
    </div>
  </div>
</section>`
        },
        {
          name: 'Features List',
          icon: CheckCircle,
          code: `
<section className="py-16 px-4 bg-gray-50">
  <div className="max-w-4xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
      <p className="text-lg text-gray-600">Everything you need to succeed in one place</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Team</h3>
          <p className="text-gray-600">Our experienced professionals bring years of expertise to every project.</p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
          <p className="text-gray-600">Round-the-clock customer support to help you whenever you need it.</p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
          <p className="text-gray-600">Quick turnaround times without compromising on quality.</p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Value</h3>
          <p className="text-gray-600">Competitive pricing with exceptional value for your investment.</p>
        </div>
      </div>
    </div>
  </div>
</section>`
        }
      ]
    },
    testimonials: {
      name: 'Testimonials',
      icon: MessageSquare,
      templates: [
        {
          name: 'Customer Reviews',
          icon: MessageSquare,
          code: `
<section className="py-16 px-4 bg-gray-50">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
      <p className="text-lg text-gray-600">Don't just take our word for it</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <div className="flex text-yellow-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          </div>
        </div>
        <p className="text-gray-600 mb-4">"Exceptional service and outstanding results. They exceeded our expectations and delivered exactly what we needed."</p>
        <div className="flex items-center">
          <img className="w-10 h-10 rounded-full mr-3" src="https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=JD" alt="Client">
          <div>
            <div className="font-semibold text-gray-900">John Doe</div>
            <div className="text-sm text-gray-600">CEO, TechCorp</div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <div className="flex text-yellow-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          </div>
        </div>
        <p className="text-gray-600 mb-4">"Professional, reliable, and creative. They transformed our vision into reality and helped us achieve our goals."</p>
        <div className="flex items-center">
          <img className="w-10 h-10 rounded-full mr-3" src="https://via.placeholder.com/40x40/10B981/FFFFFF?text=JS" alt="Client">
          <div>
            <div className="font-semibold text-gray-900">Jane Smith</div>
            <div className="text-sm text-gray-600">Marketing Director</div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <div className="flex text-yellow-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          </div>
        </div>
        <p className="text-gray-600 mb-4">"Amazing experience from start to finish. The team was responsive, creative, and delivered beyond our expectations."</p>
        <div className="flex items-center">
          <img className="w-10 h-10 rounded-full mr-3" src="https://via.placeholder.com/40x40/8B5CF6/FFFFFF?text=MB" alt="Client">
          <div>
            <div className="font-semibold text-gray-900">Mike Brown</div>
            <div className="text-sm text-gray-600">Founder, StartupXYZ</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`
        }
      ]
    },
    contact: {
      name: 'Contact Sections',
      icon: Mail,
      templates: [
        {
          name: 'Contact Form',
          icon: Mail,
          code: `
<section className="py-16 px-4 bg-gray-50">
  <div className="max-w-4xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Get In Touch</h2>
      <p className="text-lg text-gray-600">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
    </div>
    <div className="bg-white rounded-lg shadow-md p-8">
      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your first name">
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your last name">
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com">
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Message subject">
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your message..."></textarea>
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Send Message</button>
        </div>
      </form>
    </div>
  </div>
</section>`
        },
        {
          name: 'Contact Info',
          icon: MapPin,
          code: `
<section className="py-16 px-4">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Information</h2>
      <p className="text-lg text-gray-600">Multiple ways to reach us</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Address</h3>
        <p className="text-gray-600">123 Business Street<br>Suite 100<br>City, State 12345</p>
      </div>
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone</h3>
        <p className="text-gray-600">+1 (555) 123-4567<br>+1 (555) 987-6543</p>
      </div>
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
        <p className="text-gray-600">info@company.com<br>support@company.com</p>
      </div>
    </div>
  </div>
</section>`
        }
      ]
    },
    footers: {
      name: 'Footer Sections',
      icon: Building,
      templates: [
        {
          name: 'Simple Footer',
          icon: Building,
          code: `
<footer className="bg-gray-800 text-white py-12 px-4">
  <div className="max-w-6xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="md:col-span-2">
        <h3 className="text-2xl font-bold mb-4">Your Company</h3>
        <p className="text-gray-300 mb-4">Building amazing digital experiences for businesses worldwide. Let us help you achieve your goals.</p>
        <div className="flex space-x-4">
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Facebook</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Twitter</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">LinkedIn</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Instagram</a>
        </div>
      </div>
      <div>
        <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
        <ul className="space-y-2">
          <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Home</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Services</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
        <ul className="space-y-2 text-gray-300">
          <li>123 Business Street</li>
          <li>City, State 12345</li>
          <li>+1 (555) 123-4567</li>
          <li>info@company.com</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-gray-700 mt-8 pt-8 text-center">
      <p className="text-gray-300">&copy; 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</footer>`
        },
        {
          name: 'Newsletter Footer',
          icon: Mail,
          code: `
<footer className="bg-blue-900 text-white py-12 px-4">
  <div className="max-w-6xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <div>
        <h3 className="text-2xl font-bold mb-4">Stay Connected</h3>
        <p className="text-blue-200 mb-4">Subscribe to our newsletter for the latest updates and exclusive offers.</p>
        <div className="flex">
          <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-2 rounded-l-lg text-gray-900 focus:outline-none">
          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-r-lg transition-colors">Subscribe</button>
        </div>
      </div>
      <div>
        <h4 className="text-lg font-semibold mb-4">Services</h4>
        <ul className="space-y-2">
          <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Web Development</a></li>
          <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Mobile Apps</a></li>
          <li><a href="#" className="text-blue-200 hover:text-white transition-colors">UI/UX Design</a></li>
          <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Digital Marketing</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-lg font-semibold mb-4">Company</h4>
        <ul className="space-y-2">
          <li><a href="#" className="text-blue-200 hover:text-white transition-colors">About Us</a></li>
          <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Our Team</a></li>
          <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Careers</a></li>
          <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-blue-800 pt-8 flex flex-col md:flex-row justify-between items-center">
      <p className="text-blue-200">&copy; 2024 Your Company. All rights reserved.</p>
      <div className="flex space-x-6 mt-4 md:mt-0">
        <a href="#" className="text-blue-200 hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="text-blue-200 hover:text-white transition-colors">Terms of Service</a>
      </div>
    </div>
  </div>
</footer>`
        }
      ]
    }
  }

  const filteredTemplates = Object.entries(templateCategories).reduce((acc, [key, category]) => {
    const filteredTemplateList = category.templates.filter(template =>
      template.name.toLowerCase().includes(searchTemplate.toLowerCase()) ||
      template.code.toLowerCase().includes(searchTemplate.toLowerCase())
    )
    
    if (filteredTemplateList.length > 0) {
      acc[key] = { ...category, templates: filteredTemplateList }
    }
    
    return acc
  }, {} as typeof templateCategories)

  const getViewportClass = () => {
    switch (viewport) {
      case 'mobile': return 'max-w-sm'
      case 'tablet': return 'max-w-2xl'
      default: return 'max-w-none'
    }
  }

  const renderPreview = () => {
    // Convert className to class for standard HTML
    const processedHtml = html.replace(/className=/g, 'class=')

    return (
      <div className={`mx-auto bg-white border border-gray-200 ${getViewportClass()}`}>
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <script src="https://cdn.tailwindcss.com"></script>
              <style>${css}</style>
              ${processedHtml}
              <script>${js}</script>
            `
          }}
        />
      </div>
    )
  }

  // Show fallback UI if no current page
  if (!currentPage) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Page...</h2>
          <p className="text-gray-600 mb-6">
            Setting up the page editor for you. If this takes too long, try selecting a different page.
          </p>
          <div className="flex space-x-4 justify-center">
            <Link
              href="/admin/pages"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Pages
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Success Messages */}
      {showPublishSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 z-10">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <p className="text-green-700">
              🎉 Page published successfully! View it live at{' '}
              <a
                href={`/pages/${currentPage?.slug}`}
                target="_blank"
                className="underline hover:text-green-800 font-medium"
              >
                /{currentPage?.slug}
              </a>
            </p>
          </div>
        </div>
      )}

      {showSaveSuccess && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 z-10">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
            <p className="text-blue-700">
              ✅ Page saved successfully!
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/pages"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pages
            </Link>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <h1 className="text-lg font-semibold text-gray-900">
                {currentPage?.title || 'Untitled Page'}
              </h1>
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 animate-pulse">• Unsaved changes</span>
              )}
              {currentPage?.isPublished && !hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  <Globe className="w-3 h-3 mr-1" />
                  Published
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Device Switcher for Preview */}
            {activeTab === 'preview' && (
              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewport('desktop')}
                  className={`p-2 rounded transition-colors ${viewport === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  className={`p-2 rounded transition-colors ${viewport === 'tablet' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  className={`p-2 rounded transition-colors ${viewport === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handlePreview}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            
            <button
              onClick={() => {
                console.log('Save button clicked!', { hasUnsavedChanges, isSaving })
                handleSave()
              }}
              disabled={!hasUnsavedChanges || isSaving}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </button>
            
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                isPublishing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-50 border-b border-gray-200 px-4">
        <div className="flex space-x-1">
          {[
            { id: 'html', label: 'HTML', icon: Code },
            { id: 'css', label: 'CSS', icon: Palette },
            { id: 'js', label: 'JavaScript', icon: Code },
            { id: 'preview', label: 'Preview', icon: Eye }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-t-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Templates Sidebar (only for HTML tab) */}
        {activeTab === 'html' && (
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Section Templates</h3>
              
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTemplate}
                  onChange={(e) => setSearchTemplate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-1 mb-3">
                {Object.entries(templateCategories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedCategory === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(filteredTemplates).map(([key, category]) => {
                if (selectedCategory !== 'all' && selectedCategory !== key) return null
                
                return (
                  <div key={key} className="mb-6">
                    <div className="flex items-center mb-3">
                      <category.icon className="w-4 h-4 text-gray-600 mr-2" />
                      <h4 className="text-sm font-semibold text-gray-900">{category.name}</h4>
                    </div>
                    <div className="space-y-2">
                      {category.templates.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => insertTemplate(template.code)}
                          className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                        >
                          <div className="flex items-center">
                            <template.icon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 mr-3" />
                            <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                              {template.name}
                            </span>
                            <PlusCircle className="w-4 h-4 text-gray-400 group-hover:text-blue-600 ml-auto" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4">
          {activeTab === 'html' && (
            <textarea
              value={html}
              onChange={(e) => handleCodeChange(e.target.value, 'html')}
              className="w-full h-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              placeholder="Enter your HTML code here... Use the templates on the left to get started!"
            />
          )}
          
          {activeTab === 'css' && (
            <textarea
              value={css}
              onChange={(e) => handleCodeChange(e.target.value, 'css')}
              className="w-full h-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              placeholder="Enter your CSS code here..."
            />
          )}
          
          {activeTab === 'js' && (
            <textarea
              value={js}
              onChange={(e) => handleCodeChange(e.target.value, 'js')}
              className="w-full h-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              placeholder="Enter your JavaScript code here..."
            />
          )}
          
          {activeTab === 'preview' && (
            <div className="h-full overflow-auto bg-gray-100 p-4">
              {renderPreview()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
