'use client'

import { useState, useEffect, useCallback } from 'react'

export interface NewsItem {
  id?: string
  title: string
  content: string
  excerpt?: string
  date: string
  category: string
  priority?: 'low' | 'medium' | 'high'
  image?: string
  link?: string
  author?: string
  status?: 'draft' | 'published' | 'archived'
  featured?: boolean
  tags?: string[]
  publishDate?: string
  expiryDate?: string
}

export interface NewsFilters {
  category?: string
  priority?: string
  status?: 'draft' | 'published' | 'archived'
  featured?: boolean
  dateFrom?: string
  dateTo?: string
  search?: string
  limit?: number
  offset?: number
}

export interface UseNewsDataReturn {
  news: NewsItem[]
  loading: boolean
  error: string | null
  categories: string[]
  totalCount: number
  
  // Actions
  fetchNews: (filters?: NewsFilters) => Promise<void>
  addNews: (item: Omit<NewsItem, 'id'>) => Promise<void>
  updateNews: (id: string, updates: Partial<NewsItem>) => Promise<void>
  deleteNews: (id: string) => Promise<void>
  refreshNews: () => Promise<void>
}

// Sample data for development/demo purposes
const sampleNewsData: NewsItem[] = [
  {
    id: '1',
    title: "Platform Launch Announcement",
    content: "We're excited to announce the official launch of our new multi-tenant CMS platform with enhanced security features and improved performance. This milestone represents months of development and testing to bring you the best content management experience.",
    excerpt: "Official launch of our new multi-tenant CMS platform with enhanced features...",
    date: "2024-01-15",
    category: "Announcements",
    priority: "high",
    image: "https://via.placeholder.com/600x300/3B82F6/FFFFFF?text=Platform+Launch",
    link: "/news/platform-launch",
    author: "Product Team",
    status: "published",
    featured: true,
    tags: ["launch", "platform", "cms"],
    publishDate: "2024-01-15"
  },
  {
    id: '2',
    title: "Security Updates Released",
    content: "Latest security patches and updates have been deployed to enhance system protection and user data safety. These updates include improved encryption, enhanced authentication, and better protection against common vulnerabilities.",
    excerpt: "Latest security patches deployed for enhanced protection...",
    date: "2024-01-12",
    category: "Security",
    priority: "high",
    image: "https://via.placeholder.com/600x300/EF4444/FFFFFF?text=Security+Update",
    link: "/news/security-updates",
    author: "Security Team",
    status: "published",
    featured: false,
    tags: ["security", "updates", "patches"],
    publishDate: "2024-01-12"
  },
  {
    id: '3',
    title: "New Dashboard Features",
    content: "Introducing new dashboard widgets and analytics tools to help you better understand your content performance. The new features include real-time analytics, custom reporting, and improved data visualization.",
    excerpt: "New dashboard widgets and analytics tools for better insights...",
    date: "2024-01-10",
    category: "Features",
    priority: "medium",
    image: "https://via.placeholder.com/600x300/10B981/FFFFFF?text=Dashboard+Features",
    link: "/news/dashboard-features",
    author: "Development Team",
    status: "published",
    featured: true,
    tags: ["features", "dashboard", "analytics"],
    publishDate: "2024-01-10"
  },
  {
    id: '4',
    title: "Scheduled Maintenance Notice",
    content: "Routine maintenance will be performed on January 20th from 2:00 AM to 4:00 AM EST to improve system performance. During this time, some services may be temporarily unavailable.",
    excerpt: "Routine maintenance scheduled for January 20th, 2:00-4:00 AM EST...",
    date: "2024-01-08",
    category: "Maintenance",
    priority: "medium",
    image: "https://via.placeholder.com/600x300/F59E0B/FFFFFF?text=Maintenance",
    link: "/news/maintenance-notice",
    author: "IT Operations",
    status: "published",
    featured: false,
    tags: ["maintenance", "downtime", "performance"],
    publishDate: "2024-01-08",
    expiryDate: "2024-01-21"
  },
  {
    id: '5',
    title: "Community Forum Launch",
    content: "Join our new community forum to connect with other users, share tips, and get support from our team and community. The forum includes dedicated sections for different topics and skill levels.",
    excerpt: "New community forum for user connection and support...",
    date: "2024-01-05",
    category: "Community",
    priority: "low",
    image: "https://via.placeholder.com/600x300/8B5CF6/FFFFFF?text=Community+Forum",
    link: "/news/community-forum",
    author: "Community Team",
    status: "published",
    featured: false,
    tags: ["community", "forum", "support"],
    publishDate: "2024-01-05"
  },
  {
    id: '6',
    title: "API Documentation Update",
    content: "Comprehensive API documentation has been updated with new endpoints, examples, and best practices for developers. The documentation now includes interactive examples and better code samples.",
    excerpt: "Updated API documentation with new endpoints and examples...",
    date: "2024-01-03",
    category: "Documentation",
    priority: "low",
    image: "https://via.placeholder.com/600x300/06B6D4/FFFFFF?text=API+Docs",
    link: "/news/api-documentation",
    author: "Developer Relations",
    status: "published",
    featured: false,
    tags: ["api", "documentation", "developers"],
    publishDate: "2024-01-03"
  }
]

export function useNewsData(): UseNewsDataReturn {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Get unique categories from news data
  const categories = Array.from(new Set(news.map(item => item.category))).filter(Boolean)

  // API call with filters
  const fetchNews = useCallback(async (filters: NewsFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.featured !== undefined) params.append('featured', filters.featured.toString())
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/news?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await response.json()

      setNews(data.news || [])
      setTotalCount(data.totalCount || 0)

      // Update categories from API response
      if (data.categories) {
        // Store categories in state for use by components
        const uniqueCategories = Array.from(new Set([...categories, ...data.categories]))
        // Since categories is computed, we'll update it through news data
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news')
      // Fallback to sample data if API fails in development
      if (process.env.NODE_ENV === 'development') {
        let filteredNews = [...sampleNewsData]

        // Apply sample data filters as fallback
        if (filters.category) {
          filteredNews = filteredNews.filter(item =>
            item.category.toLowerCase().includes(filters.category!.toLowerCase())
          )
        }

        if (filters.priority) {
          filteredNews = filteredNews.filter(item => item.priority === filters.priority)
        }

        if (filters.status) {
          filteredNews = filteredNews.filter(item => item.status === filters.status)
        }

        if (filters.featured !== undefined) {
          filteredNews = filteredNews.filter(item => item.featured === filters.featured)
        }

        if (filters.search) {
          const searchTerm = filters.search.toLowerCase()
          filteredNews = filteredNews.filter(item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.content.toLowerCase().includes(searchTerm) ||
            item.excerpt?.toLowerCase().includes(searchTerm) ||
            item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
          )
        }

        if (filters.dateFrom) {
          filteredNews = filteredNews.filter(item => item.date >= filters.dateFrom!)
        }

        if (filters.dateTo) {
          filteredNews = filteredNews.filter(item => item.date <= filters.dateTo!)
        }

        // Sort by date (newest first)
        filteredNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Apply pagination
        const start = filters.offset || 0
        const end = start + (filters.limit || filteredNews.length)
        const paginatedNews = filteredNews.slice(start, end)

        setTotalCount(filteredNews.length)
        setNews(paginatedNews)
        setError(null) // Clear error when using fallback data
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const addNews = useCallback(async (item: Omit<NewsItem, 'id'>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create news item')
      }

      const data = await response.json()

      if (data.success && data.news) {
        setNews(prev => [data.news, ...prev])
        setTotalCount(prev => prev + 1)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add news item')

      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const newItem: NewsItem = {
          ...item,
          id: Date.now().toString(),
          status: item.status || 'draft'
        }

        sampleNewsData.unshift(newItem)
        setNews(prev => [newItem, ...prev])
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateNews = useCallback(async (id: string, updates: Partial<NewsItem>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update news item')
      }

      const data = await response.json()

      if (data.success && data.news) {
        setNews(prev => prev.map(item =>
          item.id === id ? data.news : item
        ))
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update news item')

      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const itemIndex = sampleNewsData.findIndex(item => item.id === id)
        if (itemIndex >= 0) {
          sampleNewsData[itemIndex] = { ...sampleNewsData[itemIndex], ...updates }
        }

        setNews(prev => prev.map(item =>
          item.id === id ? { ...item, ...updates } : item
        ))
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteNews = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete news item')
      }

      const data = await response.json()

      if (data.success) {
        setNews(prev => prev.filter(item => item.id !== id))
        setTotalCount(prev => prev - 1)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete news item')

      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const itemIndex = sampleNewsData.findIndex(item => item.id === id)
        if (itemIndex >= 0) {
          sampleNewsData.splice(itemIndex, 1)
        }

        setNews(prev => prev.filter(item => item.id !== id))
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshNews = useCallback(async () => {
    await fetchNews()
  }, [fetchNews])

  // Initial load
  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  return {
    news,
    loading,
    error,
    categories,
    totalCount,
    fetchNews,
    addNews,
    updateNews,
    deleteNews,
    refreshNews
  }
}

export default useNewsData
