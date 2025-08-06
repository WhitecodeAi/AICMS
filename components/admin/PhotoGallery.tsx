'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Eye, Camera } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface GalleryItem {
  id: string
  preview: string
  title: string
  shortcode: string
  department: string
  academicYear: string
  photosCount: number
  dateCreated: Date
}

const mockGalleries: GalleryItem[] = [
  {
    id: '1',
    preview: '/api/placeholder/150/100',
    title: 'Test',
    shortcode: '[photogallery id=1]',
    department: 'Computer Science',
    academicYear: '2023-24',
    photosCount: 1,
    dateCreated: new Date('2023-12-15')
  }
]

export default function PhotoGallery() {
  const [galleries, setGalleries] = useState<GalleryItem[]>(mockGalleries)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPerPage, setShowPerPage] = useState(10)

  const filteredGalleries = galleries.filter(gallery =>
    gallery.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gallery.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this gallery?')) {
      setGalleries(prev => prev.filter(gallery => gallery.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
          <nav className="flex items-center text-sm text-gray-600 mt-1">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>Photo Gallery</span>
          </nav>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Add Gallery
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <label className="text-sm text-gray-700 mr-2">Show:</label>
            <select
              value={showPerPage}
              onChange={(e) => setShowPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700 ml-2">entries</span>
          </div>
          
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search galleries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-2">PREVIEW</div>
            <div className="col-span-2">TITLE</div>
            <div className="col-span-2">PHOTOGALLERY SHORTCODE</div>
            <div className="col-span-2">DEPARTMENT NAME</div>
            <div className="col-span-2">ACADEMIC YEAR</div>
            <div className="col-span-1"># OF PHOTOS</div>
            <div className="col-span-1">ACTIONS</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredGalleries.length > 0 ? (
            filteredGalleries.map((gallery) => (
              <div
                key={gallery.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2">
                    <div className="w-20 h-14 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-900">{gallery.title}</span>
                  </div>
                  
                  <div className="col-span-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {gallery.shortcode}
                    </code>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">{gallery.department}</span>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">{gallery.academicYear}</span>
                  </div>
                  
                  <div className="col-span-1">
                    <span className="text-sm font-medium text-gray-900">{gallery.photosCount}</span>
                  </div>
                  
                  <div className="col-span-1">
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(gallery.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first photo gallery.</p>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                Create Gallery
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredGalleries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {Math.min(filteredGalleries.length, showPerPage)} of {filteredGalleries.length} entries
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
