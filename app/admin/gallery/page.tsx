'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Plus, 
  Search, 
  Filter,
  Edit2, 
  Trash2, 
  Eye,
  Image as ImageIcon,
  Grid,
  Columns,
  Play,
  X,
  Save,
  AlertCircle,
  ExternalLink,
  Upload
} from 'lucide-react'
import { useGalleryData, Gallery, GalleryImage } from '@/lib/hooks/useGalleryData'

interface GalleryFormData {
  title: string
  description: string
  shortcode: string
  category: string
  department: string
  academicYear: string
  layout: 'grid' | 'masonry' | 'carousel'
  columns: number
  showCaptions: boolean
  lightbox: boolean
  isActive: boolean
  images: GalleryImage[]
}

const initialFormData: GalleryFormData = {
  title: '',
  description: '',
  shortcode: '',
  category: '',
  department: '',
  academicYear: '',
  layout: 'grid',
  columns: 3,
  showCaptions: true,
  lightbox: true,
  isActive: true,
  images: []
}

export default function GalleryPage() {
  const { galleries, loading, error, categories, departments, totalCount, fetchGalleries, addGallery, updateGallery, deleteGallery } = useGalleryData()
  const [showForm, setShowForm] = useState(false)
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null)
  const [formData, setFormData] = useState<GalleryFormData>(initialFormData)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Load gallery data
  useEffect(() => {
    fetchGalleries({
      search: searchTerm || undefined,
      category: filterCategory || undefined,
      department: filterDepartment || undefined,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage
    })
  }, [searchTerm, filterCategory, filterDepartment, currentPage, fetchGalleries])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const galleryData = {
        ...formData,
        shortcode: formData.shortcode || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }

      if (editingGallery) {
        await updateGallery(editingGallery.id!, galleryData)
      } else {
        await addGallery(galleryData)
      }
      
      setShowForm(false)
      setEditingGallery(null)
      setFormData(initialFormData)
      fetchGalleries()
    } catch (err) {
      console.error('Error saving gallery:', err)
    }
  }

  const handleEdit = (gallery: Gallery) => {
    setEditingGallery(gallery)
    setFormData({
      title: gallery.title,
      description: gallery.description || '',
      shortcode: gallery.shortcode,
      category: gallery.category || '',
      department: gallery.department || '',
      academicYear: gallery.academicYear || '',
      layout: gallery.layout || 'grid',
      columns: gallery.columns || 3,
      showCaptions: gallery.showCaptions ?? true,
      lightbox: gallery.lightbox ?? true,
      isActive: gallery.isActive ?? true,
      images: gallery.images || []
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this gallery?')) {
      await deleteGallery(id)
      fetchGalleries()
    }
  }

  const handleAddImage = () => {
    const newImage: GalleryImage = {
      id: Date.now().toString(),
      src: '',
      alt: '',
      caption: '',
      category: '',
      featured: false,
      order: formData.images.length + 1
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, newImage]
    }))
  }

  const handleUpdateImage = (index: number, updates: Partial<GalleryImage>) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? { ...img, ...updates } : img)
    }))
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Photo Galleries</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage photo galleries that will be displayed on your website
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              onClick={() => {
                setEditingGallery(null)
                setFormData(initialFormData)
                setShowForm(true)
              }}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Gallery
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search galleries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>

            <div className="text-sm text-gray-500 flex items-center">
              <Grid className="w-4 h-4 mr-1" />
              {totalCount} total galleries
            </div>
          </div>
        </div>

        {/* Galleries Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading galleries...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleries.map((gallery) => (
                <div key={gallery.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Gallery Preview */}
                  <div className="aspect-video bg-gray-100 relative">
                    {gallery.images && gallery.images.length > 0 ? (
                      <>
                        <img 
                          src={gallery.images[0].src} 
                          alt={gallery.images[0].alt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          {gallery.images.length} photos
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Layout Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {gallery.layout === 'grid' && <Grid className="w-3 h-3 mr-1" />}
                        {gallery.layout === 'masonry' && <Columns className="w-3 h-3 mr-1" />}
                        {gallery.layout === 'carousel' && <Play className="w-3 h-3 mr-1" />}
                        {gallery.layout}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        gallery.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {gallery.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Gallery Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{gallery.title}</h3>
                    {gallery.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{gallery.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Code: {gallery.shortcode}</span>
                      {gallery.category && (
                        <span className="px-2 py-1 bg-gray-100 rounded">{gallery.category}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {gallery.department && <span>{gallery.department}</span>}
                        {gallery.academicYear && <span>• {gallery.academicYear}</span>}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(gallery)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit gallery"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(gallery.id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete gallery"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm border rounded-md ${
                    page === currentPage 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {editingGallery ? 'Edit Gallery' : 'Add Gallery'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Shortcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shortcode
                  </label>
                  <input
                    type="text"
                    value={formData.shortcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortcode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Auto-generated from title"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Events, Facilities, Awards"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Student Affairs, Science Department"
                  />
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2024"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Gallery description..."
                />
              </div>

              {/* Layout Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Layout
                  </label>
                  <select
                    value={formData.layout}
                    onChange={(e) => setFormData(prev => ({ ...prev, layout: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="grid">Grid</option>
                    <option value="masonry">Masonry</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Columns
                  </label>
                  <select
                    value={formData.columns}
                    onChange={(e) => setFormData(prev => ({ ...prev, columns: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 Column</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showCaptions}
                      onChange={(e) => setFormData(prev => ({ ...prev, showCaptions: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Captions</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.lightbox}
                      onChange={(e) => setFormData(prev => ({ ...prev, lightbox: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Lightbox</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Gallery</span>
                  </label>
                </div>
              </div>

              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Images
                  </label>
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Image
                  </button>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {formData.images.map((image, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Image URL *
                          </label>
                          <input
                            type="url"
                            required
                            value={image.src}
                            onChange={(e) => handleUpdateImage(index, { src: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Alt Text *
                          </label>
                          <input
                            type="text"
                            required
                            value={image.alt}
                            onChange={(e) => handleUpdateImage(index, { alt: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Image description"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Caption
                          </label>
                          <input
                            type="text"
                            value={image.caption || ''}
                            onChange={(e) => handleUpdateImage(index, { caption: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Image caption"
                          />
                        </div>
                        <div className="flex items-end justify-between">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={image.featured || false}
                              onChange={(e) => handleUpdateImage(index, { featured: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-xs text-gray-700">Featured</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingGallery ? 'Update Gallery' : 'Create Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
