'use client'

import React, { useState, useEffect } from 'react'
import { 
  ExternalLink, 
  ArrowRight, 
  Calendar, 
  User, 
  Tag, 
  Filter,
  Search,
  Grid,
  List,
  Clock
} from 'lucide-react'
import { useNewsData, NewsFilters, NewsItem } from '@/lib/hooks/useNewsData'

interface NewsNoticesWidgetProps {
  // Content
  title?: string
  subtitle?: string
  showFilters?: boolean
  showSearch?: boolean
  showViewToggle?: boolean
  
  // Display options
  layout?: 'grid-2' | 'grid-3' | 'grid-4' | 'list' | 'masonry'
  cardStyle?: 'card' | 'minimal' | 'modern' | 'gradient' | 'bordered'
  maxItems?: number
  showDate?: boolean
  showCategory?: boolean
  showAuthor?: boolean
  showExcerpt?: boolean
  showTags?: boolean
  showReadTime?: boolean
  
  // Styling
  backgroundColor?: string
  textColor?: string
  titleColor?: string
  cardBackgroundColor?: string
  accentColor?: string
  
  // Behavior
  autoRefresh?: boolean
  refreshInterval?: number // in seconds
  enableInfiniteScroll?: boolean
  enableShare?: boolean
  
  // Initial filters
  initialFilters?: NewsFilters
}

export const NewsNoticesWidget: React.FC<NewsNoticesWidgetProps> = ({
  title = "News & Notices",
  subtitle,
  showFilters = false,
  showSearch = false,
  showViewToggle = false,
  layout = 'grid-3',
  cardStyle = 'card',
  maxItems = 6,
  showDate = true,
  showCategory = true,
  showAuthor = false,
  showExcerpt = true,
  showTags = false,
  showReadTime = false,
  backgroundColor = '#f8fafc',
  textColor = '#1f2937',
  titleColor,
  cardBackgroundColor = '#ffffff',
  accentColor = '#3b82f6',
  autoRefresh = false,
  refreshInterval = 300,
  enableInfiniteScroll = false,
  enableShare = false,
  initialFilters = {}
}) => {
  const { 
    news, 
    loading, 
    error, 
    categories, 
    totalCount,
    fetchNews 
  } = useNewsData()

  const [filters, setFilters] = useState<NewsFilters>(initialFilters)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentLayout, setCurrentLayout] = useState(layout)
  const [visibleItems, setVisibleItems] = useState(maxItems)

  // Sync layout with prop changes from Puck editor
  useEffect(() => {
    setCurrentLayout(layout)
  }, [layout])

  // Sync maxItems with prop changes from Puck editor
  useEffect(() => {
    setVisibleItems(maxItems)
  }, [maxItems])

  // Apply filters
  useEffect(() => {
    const appliedFilters = {
      ...filters,
      search: searchTerm || undefined,
      limit: visibleItems
    }
    fetchNews(appliedFilters)
  }, [filters, searchTerm, visibleItems, fetchNews])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchNews({ ...filters, search: searchTerm, limit: visibleItems })
    }, refreshInterval * 1000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, filters, searchTerm, visibleItems, fetchNews])

  const getLayoutClasses = () => {
    switch(currentLayout) {
      case 'list': return 'flex flex-col space-y-4'
      case 'grid-2': return 'grid grid-cols-1 md:grid-cols-2 gap-6'
      case 'grid-3': return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      case 'grid-4': return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
      case 'masonry': return 'columns-1 md:columns-2 lg:columns-3 gap-6'
      default: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    }
  }

  const getCardClasses = () => {
    const baseClasses = 'relative overflow-hidden transition-all duration-300'
    
    // For masonry layout, add break-inside-avoid
    const masonryClasses = currentLayout === 'masonry' ? 'break-inside-avoid mb-6' : ''
    
    // For list layout, use horizontal card layout
    const listClasses = currentLayout === 'list' ? 'flex flex-col md:flex-row' : 'flex flex-col'
    
    const shadowClasses = {
      'card': 'bg-white rounded-lg shadow-md hover:shadow-xl',
      'minimal': 'bg-white border border-gray-200 hover:border-gray-300',
      'modern': 'bg-white rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1',
      'gradient': 'bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md hover:shadow-xl',
      'bordered': 'bg-white border-l-4 shadow-sm hover:shadow-md'
    }
    
    return `${baseClasses} ${masonryClasses} ${listClasses} ${shadowClasses[cardStyle] || shadowClasses.card}`
  }

  const getImageClasses = () => {
    if (currentLayout === 'list') {
      return 'w-full md:w-64 h-48 md:h-full flex-shrink-0'
    }
    return 'aspect-video w-full'
  }

  const getContentClasses = () => {
    if (currentLayout === 'list') {
      return 'p-6 flex-1'
    }
    return 'p-6'
  }

  const getPriorityColor = (priority?: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(' ').length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min read`
  }

  const handleLoadMore = () => {
    setVisibleItems(prev => prev + maxItems)
  }

  const handleShare = (item: NewsItem) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.excerpt || item.content.substring(0, 100) + '...',
        url: item.link || window.location.href
      })
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .news-masonry {
            column-fill: balance;
          }
        `
      }} />
      <section 
        className="py-16 px-4"
        style={{ backgroundColor, color: textColor }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: titleColor || accentColor }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg opacity-80 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}

          </div>

          {/* Controls */}
          <div className="mb-8 space-y-4">
            {/* Search and View Toggle */}
            {(showSearch || showViewToggle) && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {showSearch && (
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search news..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {showViewToggle && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentLayout('grid-3')}
                      className={`p-2 rounded ${currentLayout.startsWith('grid') ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentLayout('list')}
                      className={`p-2 rounded ${currentLayout === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            {showFilters && categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Filter className="w-4 h-4 text-gray-500 mt-1" />
                <button
                  onClick={() => setFilters({})}
                  className={`px-3 py-1 rounded-full text-sm ${!filters.category ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setFilters({ category })}
                    className={`px-3 py-1 rounded-full text-sm ${filters.category === category ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading news...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => fetchNews(filters)}
                className="mt-2 text-blue-500 hover:text-blue-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* News Grid/List */}
          {!loading && !error && (
            <div className={getLayoutClasses()}>
              {news.map((item, index) => (
                <article 
                  key={item.id || index} 
                  className={getCardClasses()}
                  style={{ 
                    backgroundColor: cardBackgroundColor,
                    borderLeftColor: cardStyle === 'bordered' ? accentColor : undefined
                  }}
                >
                  {/* Priority Badge */}
                  {item.priority && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Image */}
                  {item.image && (
                    <div className={`${getImageClasses()} overflow-hidden`}>
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className={getContentClasses()}>
                    {/* Meta Information */}
                    <div className="flex items-center justify-between mb-3 text-sm">
                      <div className="flex items-center space-x-3">
                        {showDate && item.date && (
                          <div className="flex items-center text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            <time>{new Date(item.date).toLocaleDateString()}</time>
                          </div>
                        )}
                        {showAuthor && item.author && (
                          <div className="flex items-center text-gray-500">
                            <User className="w-4 h-4 mr-1" />
                            <span>{item.author}</span>
                          </div>
                        )}
                        {showReadTime && (
                          <div className="flex items-center text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{estimateReadTime(item.content)}</span>
                          </div>
                        )}
                      </div>
                      
                      {showCategory && item.category && (
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${accentColor}20`,
                            color: accentColor
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-3 hover:opacity-80 transition-opacity">
                      {item.link ? (
                        <a href={item.link} className="block">
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </h3>

                    {/* Excerpt */}
                    {showExcerpt && (item.excerpt || item.content) && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {item.excerpt || item.content.substring(0, 150) + '...'}
                      </p>
                    )}

                    {/* Tags */}
                    {showTags && item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="inline-flex items-center text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        {item.link && (
                          <a 
                            href={item.link}
                            className="inline-flex items-center text-sm font-medium hover:opacity-80 transition-opacity"
                            style={{ color: accentColor }}
                          >
                            Read More 
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </a>
                        )}
                      </div>
                      
                      {enableShare && (
                        <button 
                          onClick={() => handleShare(item)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Share
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {enableInfiniteScroll && news.length < totalCount && !loading && (
            <div className="text-center mt-12">
              <button 
                onClick={handleLoadMore}
                className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: accentColor,
                  color: '#ffffff'
                }}
              >
                Load More News
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}

          {/* View All Link */}
          {news.length > 0 && !enableInfiniteScroll && (
            <div className="text-center mt-12">
              <a 
                href="/news"
                className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: accentColor,
                  color: '#ffffff'
                }}
              >
                View All News & Notices
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default NewsNoticesWidget
