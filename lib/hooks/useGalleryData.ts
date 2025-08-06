'use client'

import { useState, useEffect, useCallback } from 'react'
import { galleriesStore } from '@/lib/stores/content-store'

export interface GalleryImage {
  id?: string
  src: string
  alt: string
  caption?: string
  category?: string
  featured?: boolean
  order?: number
}

export interface Gallery {
  id?: string
  title: string
  description?: string
  shortcode: string
  images: GalleryImage[]
  department?: string
  academicYear?: string
  isActive?: boolean
  category?: string
  layout?: 'grid' | 'masonry' | 'carousel'
  columns?: number
  showCaptions?: boolean
  lightbox?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface GalleryFilters {
  category?: string
  department?: string
  academicYear?: string
  search?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface UseGalleryDataReturn {
  galleries: Gallery[]
  loading: boolean
  error: string | null
  categories: string[]
  departments: string[]
  totalCount: number
  
  // Actions
  fetchGalleries: (filters?: GalleryFilters) => Promise<void>
  addGallery: (gallery: Omit<Gallery, 'id'>) => Promise<void>
  updateGallery: (id: string, updates: Partial<Gallery>) => Promise<void>
  deleteGallery: (id: string) => Promise<void>
  refreshGalleries: () => Promise<void>
}

// Sample data for development/demo purposes
const sampleGalleries: Gallery[] = [
  {
    id: '1',
    title: "Campus Events 2024",
    description: "Highlights from various campus events and activities throughout the year",
    shortcode: "campus-events-2024",
    category: "Events",
    department: "Student Affairs",
    academicYear: "2024",
    layout: "grid",
    columns: 3,
    showCaptions: true,
    lightbox: true,
    isActive: true,
    images: [
      {
        id: '1',
        src: "https://via.placeholder.com/600x400/3B82F6/FFFFFF?text=Campus+Event+1",
        alt: "Annual Sports Day",
        caption: "Students participating in the annual sports day celebration",
        category: "Sports",
        featured: true,
        order: 1
      },
      {
        id: '2',
        src: "https://via.placeholder.com/600x400/10B981/FFFFFF?text=Campus+Event+2",
        alt: "Cultural Festival",
        caption: "Cultural performances during the spring festival",
        category: "Culture",
        featured: false,
        order: 2
      },
      {
        id: '3',
        src: "https://via.placeholder.com/600x400/F59E0B/FFFFFF?text=Campus+Event+3",
        alt: "Graduation Ceremony",
        caption: "Class of 2024 graduation ceremony highlights",
        category: "Academic",
        featured: true,
        order: 3
      }
    ]
  },
  {
    id: '2',
    title: "Science Laboratory",
    description: "State-of-the-art facilities and research equipment",
    shortcode: "science-lab",
    category: "Facilities",
    department: "Science Department",
    academicYear: "2024",
    layout: "masonry",
    columns: 4,
    showCaptions: true,
    lightbox: true,
    isActive: true,
    images: [
      {
        id: '4',
        src: "https://via.placeholder.com/600x800/8B5CF6/FFFFFF?text=Lab+Equipment+1",
        alt: "Microscopy Lab",
        caption: "Advanced microscopy equipment for research",
        category: "Equipment",
        featured: true,
        order: 1
      },
      {
        id: '5',
        src: "https://via.placeholder.com/600x400/EF4444/FFFFFF?text=Lab+Equipment+2",
        alt: "Chemistry Lab",
        caption: "Modern chemistry laboratory setup",
        category: "Equipment",
        featured: false,
        order: 2
      }
    ]
  },
  {
    id: '3',
    title: "Student Achievements",
    description: "Recognition of outstanding student accomplishments",
    shortcode: "student-achievements",
    category: "Awards",
    department: "Academic Affairs",
    academicYear: "2024",
    layout: "carousel",
    columns: 1,
    showCaptions: true,
    lightbox: false,
    isActive: true,
    images: [
      {
        id: '6',
        src: "https://via.placeholder.com/800x400/06B6D4/FFFFFF?text=Achievement+1",
        alt: "National Competition Winner",
        caption: "First place in national science competition",
        category: "Awards",
        featured: true,
        order: 1
      }
    ]
  }
]

export function useGalleryData(): UseGalleryDataReturn {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Get unique categories and departments from gallery data
  const categories = Array.from(new Set(galleries.map(gallery => gallery.category))).filter(Boolean) as string[]
  const departments = Array.from(new Set(galleries.map(gallery => gallery.department))).filter(Boolean) as string[]

  // API call with filters
  const fetchGalleries = useCallback(async (filters: GalleryFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.department) params.append('department', filters.department)
      if (filters.academicYear) params.append('academicYear', filters.academicYear)
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/galleries?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch galleries')
      }

      const data = await response.json()

      setGalleries(data.galleries || [])
      setTotalCount(data.totalCount || 0)
      
    } catch (err) {
      console.warn('useGalleryData: API failed, falling back to sample data:', err)

      // Always fallback to shared store data when API fails
      let filteredGalleries = [...galleriesStore]

      // Apply sample data filters as fallback
      if (filters.category) {
        filteredGalleries = filteredGalleries.filter(gallery =>
          gallery.category?.toLowerCase().includes(filters.category!.toLowerCase())
        )
      }

      if (filters.department) {
        filteredGalleries = filteredGalleries.filter(gallery =>
          gallery.department?.toLowerCase().includes(filters.department!.toLowerCase())
        )
      }

      if (filters.academicYear) {
        filteredGalleries = filteredGalleries.filter(gallery => gallery.academicYear === filters.academicYear)
      }

      if (filters.isActive !== undefined) {
        filteredGalleries = filteredGalleries.filter(gallery => gallery.isActive === filters.isActive)
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredGalleries = filteredGalleries.filter(gallery =>
          gallery.title.toLowerCase().includes(searchTerm) ||
          gallery.description?.toLowerCase().includes(searchTerm) ||
          gallery.shortcode.toLowerCase().includes(searchTerm)
        )
      }

      // Apply pagination
      const start = filters.offset || 0
      const end = start + (filters.limit || filteredGalleries.length)
      const paginatedGalleries = filteredGalleries.slice(start, end)

      setTotalCount(filteredGalleries.length)
      setGalleries(paginatedGalleries)
      setError(null) // Clear error when using fallback data
    } finally {
      setLoading(false)
    }
  }, [])

  const addGallery = useCallback(async (gallery: Omit<Gallery, 'id'>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/galleries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gallery)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create gallery')
      }
      
      const data = await response.json()
      
      if (data.success && data.gallery) {
        setGalleries(prev => [data.gallery, ...prev])
        setTotalCount(prev => prev + 1)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add gallery')
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const newGallery: Gallery = {
          ...gallery,
          id: Date.now().toString(),
          isActive: gallery.isActive ?? true
        }

        galleriesStore.unshift(newGallery)
        setGalleries(prev => [newGallery, ...prev])
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateGallery = useCallback(async (id: string, updates: Partial<Gallery>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/galleries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update gallery')
      }
      
      const data = await response.json()
      
      if (data.success && data.gallery) {
        setGalleries(prev => prev.map(gallery => 
          gallery.id === id ? data.gallery : gallery
        ))
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gallery')
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const galleryIndex = galleriesStore.findIndex(gallery => gallery.id === id)
        if (galleryIndex >= 0) {
          galleriesStore[galleryIndex] = { ...galleriesStore[galleryIndex], ...updates }
        }

        setGalleries(prev => prev.map(gallery =>
          gallery.id === id ? { ...gallery, ...updates } : gallery
        ))
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteGallery = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/galleries/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete gallery')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setGalleries(prev => prev.filter(gallery => gallery.id !== id))
        setTotalCount(prev => prev - 1)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gallery')
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const galleryIndex = galleriesStore.findIndex(gallery => gallery.id === id)
        if (galleryIndex >= 0) {
          galleriesStore.splice(galleryIndex, 1)
        }

        setGalleries(prev => prev.filter(gallery => gallery.id !== id))
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshGalleries = useCallback(async () => {
    await fetchGalleries()
  }, [fetchGalleries])

  // Initial load
  useEffect(() => {
    fetchGalleries()
  }, [fetchGalleries])

  return {
    galleries,
    loading,
    error,
    categories,
    departments,
    totalCount,
    fetchGalleries,
    addGallery,
    updateGallery,
    deleteGallery,
    refreshGalleries
  }
}

export default useGalleryData
