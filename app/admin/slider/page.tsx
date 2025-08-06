'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye,
  Play,
  Pause,
  Image as ImageIcon,
  Settings,
  X,
  Save,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useSliderData, Slider, Slide } from '@/lib/hooks/useSliderData'

interface SliderFormData {
  name: string
  description: string
  location: 'homepage' | 'header' | 'custom'
  isActive: boolean
  settings: {
    autoPlay: boolean
    autoPlaySpeed: number
    showDots: boolean
    showArrows: boolean
    infinite: boolean
    pauseOnHover: boolean
    transition: 'slide' | 'fade'
    height: string
  }
  slides: Slide[]
}

const initialFormData: SliderFormData = {
  name: '',
  description: '',
  location: 'homepage',
  isActive: true,
  settings: {
    autoPlay: true,
    autoPlaySpeed: 5,
    showDots: true,
    showArrows: true,
    infinite: true,
    pauseOnHover: true,
    transition: 'slide',
    height: '500px'
  },
  slides: []
}

export default function SliderPage() {
  const { sliders, loading, error, totalCount, fetchSliders, addSlider, updateSlider, deleteSlider } = useSliderData()
  const [showForm, setShowForm] = useState(false)
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null)
  const [formData, setFormData] = useState<SliderFormData>(initialFormData)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Load slider data
  useEffect(() => {
    fetchSliders({
      search: searchTerm || undefined,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage
    })
  }, [searchTerm, currentPage, fetchSliders])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingSlider) {
        await updateSlider(editingSlider.id!, formData)
      } else {
        await addSlider(formData)
      }
      
      setShowForm(false)
      setEditingSlider(null)
      setFormData(initialFormData)
      fetchSliders()
    } catch (err) {
      console.error('Error saving slider:', err)
    }
  }

  const handleEdit = (slider: Slider) => {
    setEditingSlider(slider)
    setFormData({
      name: slider.name,
      description: slider.description || '',
      location: slider.location as any || 'homepage',
      isActive: slider.isActive ?? true,
      settings: slider.settings || initialFormData.settings,
      slides: slider.slides || []
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this slider?')) {
      await deleteSlider(id)
      fetchSliders()
    }
  }

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      image: '',
      title: '',
      subtitle: '',
      description: '',
      buttonText: '',
      buttonUrl: '',
      order: formData.slides.length + 1,
      isActive: true,
      textPosition: 'center',
      textColor: '#ffffff',
      overlayOpacity: 0.5
    }
    setFormData(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }))
  }

  const handleUpdateSlide = (index: number, updates: Partial<Slide>) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) => i === index ? { ...slide, ...updates } : slide)
    }))
  }

  const handleRemoveSlide = (index: number) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }))
  }

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...formData.slides]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newSlides.length) {
      [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]]
      setFormData(prev => ({ ...prev, slides: newSlides }))
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Sliders</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage image sliders that will be displayed on your website
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              onClick={() => {
                setEditingSlider(null)
                setFormData(initialFormData)
                setShowForm(true)
              }}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Slider
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sliders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="text-sm text-gray-500 flex items-center">
              <Play className="w-4 h-4 mr-1" />
              {totalCount} total sliders
            </div>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading sliders...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sliders.map((slider) => (
                <div key={slider.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Slider Preview */}
                  <div className="aspect-video bg-gray-100 relative">
                    {slider.slides && slider.slides.length > 0 ? (
                      <>
                        <img 
                          src={slider.slides[0].image} 
                          alt={slider.slides[0].title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="text-white text-center">
                            <h3 className="text-lg font-semibold">{slider.slides[0].title}</h3>
                            {slider.slides[0].subtitle && (
                              <p className="text-sm opacity-90">{slider.slides[0].subtitle}</p>
                            )}
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          {slider.slides.length} slides
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Location Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {slider.location}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        slider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {slider.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Auto-play Indicator */}
                    {slider.settings?.autoPlay && (
                      <div className="absolute bottom-2 left-2">
                        <div className="flex items-center text-white bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
                          <Play className="w-3 h-3 mr-1" />
                          Auto-play
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slider Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{slider.name}</h3>
                    {slider.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{slider.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Height: {slider.settings?.height || '500px'}</span>
                      <span>Transition: {slider.settings?.transition || 'slide'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        {slider.settings?.showDots && <span>• Dots</span>}
                        {slider.settings?.showArrows && <span>• Arrows</span>}
                        {slider.settings?.infinite && <span>• Loop</span>}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(slider)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit slider"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(slider.id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete slider"
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
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {editingSlider ? 'Edit Slider' : 'Add Slider'}
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
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slider Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="homepage">Homepage</option>
                    <option value="header">Header</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Slider description..."
                />
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Slider Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height
                    </label>
                    <input
                      type="text"
                      value={formData.settings.height}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, height: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="500px"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-play Speed (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.settings.autoPlaySpeed}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, autoPlaySpeed: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transition
                    </label>
                    <select
                      value={formData.settings.transition}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, transition: e.target.value as any }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="slide">Slide</option>
                      <option value="fade">Fade</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.autoPlay}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, autoPlay: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto-play</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.showDots}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, showDots: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Dots</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.showArrows}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, showArrows: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show Arrows</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.infinite}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, infinite: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Infinite Loop</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.pauseOnHover}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, pauseOnHover: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pause on Hover</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Slider</span>
                  </label>
                </div>
              </div>

              {/* Slides */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Slides</h3>
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Slide
                  </button>
                </div>

                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {formData.slides.map((slide, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Slide {index + 1}</h4>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleMoveSlide(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSlide(index, 'down')}
                            disabled={index === formData.slides.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlide(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Image URL *
                          </label>
                          <input
                            type="url"
                            required
                            value={slide.image}
                            onChange={(e) => handleUpdateSlide(index, { image: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={slide.title}
                            onChange={(e) => handleUpdateSlide(index, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={slide.subtitle || ''}
                            onChange={(e) => handleUpdateSlide(index, { subtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={slide.description || ''}
                            onChange={(e) => handleUpdateSlide(index, { description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Button Text
                          </label>
                          <input
                            type="text"
                            value={slide.buttonText || ''}
                            onChange={(e) => handleUpdateSlide(index, { buttonText: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Button URL
                          </label>
                          <input
                            type="url"
                            value={slide.buttonUrl || ''}
                            onChange={(e) => handleUpdateSlide(index, { buttonUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Text Position
                          </label>
                          <select
                            value={slide.textPosition || 'center'}
                            onChange={(e) => handleUpdateSlide(index, { textPosition: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Text Color
                          </label>
                          <input
                            type="color"
                            value={slide.textColor || '#ffffff'}
                            onChange={(e) => handleUpdateSlide(index, { textColor: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Overlay Opacity (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={slide.overlayOpacity || 0.5}
                            onChange={(e) => handleUpdateSlide(index, { overlayOpacity: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={slide.isActive !== false}
                              onChange={(e) => handleUpdateSlide(index, { isActive: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-xs text-gray-700">Active Slide</span>
                          </label>
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
                  {editingSlider ? 'Update Slider' : 'Create Slider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
