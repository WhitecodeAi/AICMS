'use client'

import { useState, useEffect, useCallback } from 'react'
import { slidersStore } from '@/lib/stores/content-store'

export interface Slide {
  id?: string
  image: string
  title: string
  subtitle?: string
  description?: string
  buttonText?: string
  buttonUrl?: string
  order?: number
  isActive?: boolean
  textPosition?: 'left' | 'center' | 'right'
  textColor?: string
  overlayOpacity?: number
}

export interface Slider {
  id?: string
  name: string
  description?: string
  slides: Slide[]
  settings: {
    autoPlay?: boolean
    autoPlaySpeed?: number // in seconds
    showDots?: boolean
    showArrows?: boolean
    infinite?: boolean
    pauseOnHover?: boolean
    transition?: 'slide' | 'fade'
    height?: string
  }
  isActive?: boolean
  location?: 'homepage' | 'header' | 'custom'
  createdAt?: string
  updatedAt?: string
}

export interface SliderFilters {
  location?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface UseSliderDataReturn {
  sliders: Slider[]
  loading: boolean
  error: string | null
  totalCount: number
  
  // Actions
  fetchSliders: (filters?: SliderFilters) => Promise<void>
  addSlider: (slider: Omit<Slider, 'id'>) => Promise<void>
  updateSlider: (id: string, updates: Partial<Slider>) => Promise<void>
  deleteSlider: (id: string) => Promise<void>
  refreshSliders: () => Promise<void>
}

// Sample data for development/demo purposes
const sampleSliders: Slider[] = [
  {
    id: '1',
    name: "Homepage Hero Slider",
    description: "Main slider for homepage hero section",
    location: "homepage",
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
    slides: [
      {
        id: '1',
        image: "https://via.placeholder.com/1200x600/3B82F6/FFFFFF?text=Welcome+to+Our+Platform",
        title: "Welcome to Our Platform",
        subtitle: "Experience excellence with our comprehensive solutions",
        description: "Discover innovative tools and services designed to help you achieve your goals with cutting-edge technology and dedicated support.",
        buttonText: "Get Started",
        buttonUrl: "/signup",
        order: 1,
        isActive: true,
        textPosition: "center",
        textColor: "#ffffff",
        overlayOpacity: 0.5
      },
      {
        id: '2',
        image: "https://via.placeholder.com/1200x600/10B981/FFFFFF?text=Advanced+Features",
        title: "Advanced Features",
        subtitle: "Powerful tools for modern workflows",
        description: "Take advantage of our advanced features including real-time collaboration, automated workflows, and comprehensive analytics to streamline your operations.",
        buttonText: "Learn More",
        buttonUrl: "/features",
        order: 2,
        isActive: true,
        textPosition: "left",
        textColor: "#ffffff",
        overlayOpacity: 0.4
      },
      {
        id: '3',
        image: "https://via.placeholder.com/1200x600/F59E0B/FFFFFF?text=Join+Our+Community",
        title: "Join Our Community",
        subtitle: "Connect with thousands of users worldwide",
        description: "Be part of our growing community of professionals, share knowledge, and collaborate on exciting projects with like-minded individuals.",
        buttonText: "Join Now",
        buttonUrl: "/community",
        order: 3,
        isActive: true,
        textPosition: "right",
        textColor: "#ffffff",
        overlayOpacity: 0.6
      }
    ]
  },
  {
    id: '2',
    name: "Announcements Slider",
    description: "Important announcements and updates",
    location: "header",
    isActive: true,
    settings: {
      autoPlay: true,
      autoPlaySpeed: 8,
      showDots: false,
      showArrows: false,
      infinite: true,
      pauseOnHover: true,
      transition: 'fade',
      height: '80px'
    },
    slides: [
      {
        id: '4',
        image: "https://via.placeholder.com/1200x200/EF4444/FFFFFF?text=Important+Update",
        title: "System Maintenance Scheduled",
        subtitle: "Brief downtime expected on Sunday, 2:00 AM - 4:00 AM EST",
        buttonText: "More Info",
        buttonUrl: "/maintenance",
        order: 1,
        isActive: true,
        textPosition: "center",
        textColor: "#ffffff",
        overlayOpacity: 0.8
      },
      {
        id: '5',
        image: "https://via.placeholder.com/1200x200/8B5CF6/FFFFFF?text=New+Features",
        title: "New Features Released",
        subtitle: "Check out our latest updates and improvements",
        buttonText: "View Updates",
        buttonUrl: "/updates",
        order: 2,
        isActive: true,
        textPosition: "center",
        textColor: "#ffffff",
        overlayOpacity: 0.7
      }
    ]
  },
  {
    id: '3',
    name: "Product Showcase",
    description: "Highlighting our key products and services",
    location: "custom",
    isActive: true,
    settings: {
      autoPlay: false,
      autoPlaySpeed: 6,
      showDots: true,
      showArrows: true,
      infinite: false,
      pauseOnHover: true,
      transition: 'slide',
      height: '400px'
    },
    slides: [
      {
        id: '6',
        image: "https://via.placeholder.com/1200x500/06B6D4/FFFFFF?text=Product+A",
        title: "Product Suite A",
        subtitle: "Complete solution for enterprise needs",
        description: "Our flagship product offering comprehensive tools for large-scale operations, including advanced analytics, team collaboration, and enterprise-grade security.",
        buttonText: "Explore",
        buttonUrl: "/products/suite-a",
        order: 1,
        isActive: true,
        textPosition: "left",
        textColor: "#1f2937",
        overlayOpacity: 0.2
      }
    ]
  }
]

export function useSliderData(): UseSliderDataReturn {
  const [sliders, setSliders] = useState<Slider[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // API call with filters
  const fetchSliders = useCallback(async (filters: SliderFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters.search) params.append('search', filters.search)
      if (filters.location) params.append('location', filters.location)
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/sliders?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch sliders')
      }

      const data = await response.json()

      setSliders(data.sliders || [])
      setTotalCount(data.totalCount || 0)
      
    } catch (err) {
      console.warn('useSliderData: API failed, falling back to sample data:', err)

      // Always fallback to shared store data when API fails
      let filteredSliders = [...slidersStore]

      // Apply sample data filters as fallback
      if (filters.location) {
        filteredSliders = filteredSliders.filter(slider =>
          slider.location?.toLowerCase().includes(filters.location!.toLowerCase())
        )
      }

      if (filters.isActive !== undefined) {
        filteredSliders = filteredSliders.filter(slider => slider.isActive === filters.isActive)
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredSliders = filteredSliders.filter(slider =>
          slider.name.toLowerCase().includes(searchTerm) ||
          slider.description?.toLowerCase().includes(searchTerm)
        )
      }

      // Apply pagination
      const start = filters.offset || 0
      const end = start + (filters.limit || filteredSliders.length)
      const paginatedSliders = filteredSliders.slice(start, end)

      setTotalCount(filteredSliders.length)
      setSliders(paginatedSliders)
      setError(null) // Clear error when using fallback data
    } finally {
      setLoading(false)
    }
  }, [])

  const addSlider = useCallback(async (slider: Omit<Slider, 'id'>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/sliders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slider)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create slider')
      }
      
      const data = await response.json()
      
      if (data.success && data.slider) {
        setSliders(prev => [data.slider, ...prev])
        setTotalCount(prev => prev + 1)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add slider')
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const newSlider: Slider = {
          ...slider,
          id: Date.now().toString(),
          isActive: slider.isActive ?? true
        }

        slidersStore.unshift(newSlider)
        setSliders(prev => [newSlider, ...prev])
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSlider = useCallback(async (id: string, updates: Partial<Slider>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/sliders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update slider')
      }
      
      const data = await response.json()
      
      if (data.success && data.slider) {
        setSliders(prev => prev.map(slider => 
          slider.id === id ? data.slider : slider
        ))
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update slider')
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const sliderIndex = slidersStore.findIndex(slider => slider.id === id)
        if (sliderIndex >= 0) {
          slidersStore[sliderIndex] = { ...slidersStore[sliderIndex], ...updates }
        }

        setSliders(prev => prev.map(slider =>
          slider.id === id ? { ...slider, ...updates } : slider
        ))
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSlider = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/sliders/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete slider')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSliders(prev => prev.filter(slider => slider.id !== id))
        setTotalCount(prev => prev - 1)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete slider')
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const sliderIndex = slidersStore.findIndex(slider => slider.id === id)
        if (sliderIndex >= 0) {
          slidersStore.splice(sliderIndex, 1)
        }

        setSliders(prev => prev.filter(slider => slider.id !== id))
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshSliders = useCallback(async () => {
    await fetchSliders()
  }, [fetchSliders])

  // Initial load
  useEffect(() => {
    fetchSliders()
  }, [fetchSliders])

  return {
    sliders,
    loading,
    error,
    totalCount,
    fetchSliders,
    addSlider,
    updateSlider,
    deleteSlider,
    refreshSliders
  }
}

export default useSliderData
