'use client'

import { useState, useEffect } from 'react'
import { usePageStore, type Page } from '@/lib/stores/page-store'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Globe, 
  Copy, 
  FileText,
  Calendar,
  MoreHorizontal,
  ExternalLink,
  Settings,
  Hammer,
  Zap,
  Code,
  Rocket,
  Layers
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function PagesManager() {
  const { 
    pages, 
    setCurrentPage, 
    createPage, 
    deletePage, 
    duplicatePage, 
    publishPage, 
    unpublishPage 
  } = usePageStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null)

  // Initialize with sample pages if empty
  useEffect(() => {
    if (pages.length === 0) {
      createPage('Home', 'home')
      createPage('About Us', 'about')
      createPage('Contact', 'contact')
    }
  }, [])

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreatePage = (title: string, slug: string) => {
    const page = createPage(title, slug)
    setCurrentPage(page)
    setShowCreateModal(false)
  }

  const handleEditPage = (page: Page) => {
    setCurrentPage(page)
  }

  const handleDeletePage = (pageId: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      deletePage(pageId)
    }
  }

  const handleDuplicatePage = (pageId: string) => {
    duplicatePage(pageId)
  }

  const handleTogglePublish = (page: Page) => {
    if (page.isPublished) {
      unpublishPage(page.id)
    } else {
      publishPage(page.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dynamic Website Builder</h1>
          <p className="text-gray-600 mt-1">Create multi-tenant websites with dynamic sections</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Page
        </button>
      </div>

      {/* Dynamic Sections Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Available Dynamic Sections</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
          {[
            { name: 'Header', icon: '🔝', color: 'bg-blue-100 text-blue-800' },
            { name: 'Slider', icon: '🎠', color: 'bg-green-100 text-green-800' },
            { name: 'News', icon: '📰', color: 'bg-yellow-100 text-yellow-800' },
            { name: 'Gallery', icon: '🖼️', color: 'bg-purple-100 text-purple-800' },
            { name: 'Events', icon: '📅', color: 'bg-red-100 text-red-800' },
            { name: 'Activities', icon: '⚡', color: 'bg-indigo-100 text-indigo-800' },
            { name: 'Footer', icon: '🔽', color: 'bg-gray-100 text-gray-800' },
            { name: 'Popup', icon: '💬', color: 'bg-pink-100 text-pink-800' }
          ].map((section, index) => (
            <div key={index} className={`${section.color} px-3 py-2 rounded-lg text-center`}>
              <div className="text-lg">{section.icon}</div>
              <div className="text-xs font-medium">{section.name}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-gray-700 mb-3">
            ✨ <strong>Same base code, different styling:</strong> Each section maintains the same structure but can be customized with different CSS, images, and content for each client.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/html-import"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Code className="w-4 h-4 mr-2" />
              Import HTML/CSS
            </Link>
            <Link
              href="/admin/builder-fast"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Fast Code Editor
            </Link>
            <Link
              href="/admin/builder"
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Layers className="w-4 h-4 mr-2" />
              Puck.js Builder
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredPages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Builder Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quick Edit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {page.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            /{page.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        page.builderType === 'puck' ? 'bg-purple-100 text-purple-800' :
                        page.builderType === 'html' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {page.builderType === 'puck' ? 'Dynamic Sections' :
                         page.builderType === 'html' ? 'HTML/CSS' : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          page.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {page.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(page.updatedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        {/* Fast Editor */}
                        <Link
                          href={`/admin/builder-fast?page=${page.id}`}
                          onClick={() => handleEditPage(page)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Fast Code Editor"
                        >
                          <Rocket className="w-4 h-4" />
                        </Link>
                        
                        {/* Puck.js Builder */}
                        <Link
                          href={`/admin/builder?page=${page.id}`}
                          onClick={() => handleEditPage(page)}
                          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Puck.js Dynamic Builder"
                        >
                          <Layers className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {page.isPublished && (
                          <a
                            href={`/pages/${page.slug}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View Live Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        
                        <button
                          onClick={() => handleTogglePublish(page)}
                          className={`p-2 transition-colors ${
                            page.isPublished
                              ? 'text-gray-400 hover:text-yellow-600'
                              : 'text-gray-400 hover:text-green-600'
                          }`}
                          title={page.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDuplicatePage(page.id)}
                          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pages found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first dynamic page.'}
            </p>
            {!searchTerm && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Your First Page
                </button>
                <div className="text-sm text-gray-500">
                  Or{' '}
                  <Link href="/admin/html-import" className="text-blue-600 hover:text-blue-800">
                    import existing HTML/CSS
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <CreatePageModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePage}
        />
      )}
    </div>
  )
}

// Create Page Modal Component
function CreatePageModal({ onClose, onCreate }: { 
  onClose: () => void
  onCreate: (title: string, slug: string) => void 
}) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')

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
    setSlug(generateSlug(value))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && slug.trim()) {
      onCreate(title.trim(), slug.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Dynamic Page</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter page title"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="page-url-slug"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: /{slug || 'page-url-slug'}
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 This will create a page with dynamic sections that can be customized for different clients
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Dynamic Page
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
