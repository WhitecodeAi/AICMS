'use client'

import React, { useState, useEffect } from 'react'
import { useGalleryData, Gallery, GalleryImage } from '@/lib/hooks/useGalleryData'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

interface GalleryWidgetProps {
  // Content
  title?: string
  subtitle?: string
  galleryId?: string
  
  // Display options
  layout?: 'grid' | 'masonry' | 'carousel'
  columns?: number
  showCaptions?: boolean
  lightbox?: boolean
  maxImages?: number
  
  // Styling
  backgroundColor?: string
  textColor?: string
  titleColor?: string
  accentColor?: string
  
  // Behavior
  autoPlay?: boolean
  autoPlaySpeed?: number
}

export const GalleryWidget: React.FC<GalleryWidgetProps> = ({
  title = "Photo Gallery",
  subtitle,
  galleryId,
  layout = 'grid',
  columns = 3,
  showCaptions = true,
  lightbox = true,
  maxImages = 12,
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  titleColor,
  accentColor = '#3b82f6',
  autoPlay = false,
  autoPlaySpeed = 5
}) => {
  const { galleries, loading, error, fetchGalleries } = useGalleryData()
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Load galleries and find selected one
  useEffect(() => {
    try {
      fetchGalleries().catch(err => {
        console.warn('GalleryWidget: Failed to fetch galleries, using fallback data:', err)
      })
    } catch (err) {
      console.warn('GalleryWidget: Error in fetchGalleries call:', err)
    }
  }, [fetchGalleries])

  // Sync layout changes from Puck editor (for carousel auto-play)
  useEffect(() => {
    if (layout === 'carousel') {
      setCarouselIndex(0) // Reset carousel when switching to carousel layout
    }
  }, [layout])

  useEffect(() => {
    if (galleries.length > 0) {
      let gallery: Gallery | undefined

      if (galleryId && galleryId.trim()) {
        // Try multiple matching strategies for flexibility
        gallery = galleries.find(g =>
          g.id === galleryId ||
          g.id === galleryId.toString() ||
          g.shortcode === galleryId ||
          g.title?.toLowerCase().includes(galleryId.toLowerCase()) ||
          g.title?.toLowerCase().replace(/\s+/g, '').includes(galleryId.toLowerCase().replace(/\s+/g, ''))
        )
      }

      // Fallback to first active gallery or first gallery
      if (!gallery) {
        gallery = galleries.find(g => g.isActive) || galleries[0]
      }

      setSelectedGallery(gallery || null)
    }
  }, [galleries, galleryId])

  // Auto-play for carousel
  useEffect(() => {
    if (layout === 'carousel' && autoPlay && selectedGallery?.images?.length) {
      const interval = setInterval(() => {
        setCarouselIndex(prev => (prev + 1) % selectedGallery.images.length)
      }, autoPlaySpeed * 1000)
      return () => clearInterval(interval)
    }
  }, [layout, autoPlay, autoPlaySpeed, selectedGallery])

  const getLayoutClasses = () => {
    switch(layout) {
      case 'masonry': return 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4'
      case 'carousel': return 'relative'
      default: 
        return `grid gap-4 ${
          columns === 1 ? 'grid-cols-1' :
          columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
          columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`
    }
  }

  const openLightbox = (index: number) => {
    if (lightbox) {
      setLightboxIndex(index)
      setLightboxOpen(true)
    }
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextLightboxImage = () => {
    if (selectedGallery?.images) {
      setLightboxIndex((prev) => (prev + 1) % selectedGallery.images.length)
    }
  }

  const prevLightboxImage = () => {
    if (selectedGallery?.images) {
      setLightboxIndex((prev) => (prev - 1 + selectedGallery.images.length) % selectedGallery.images.length)
    }
  }

  const nextCarouselImage = () => {
    if (selectedGallery?.images) {
      setCarouselIndex((prev) => (prev + 1) % selectedGallery.images.length)
    }
  }

  const prevCarouselImage = () => {
    if (selectedGallery?.images) {
      setCarouselIndex((prev) => (prev - 1 + selectedGallery.images.length) % selectedGallery.images.length)
    }
  }

  if (loading) {
    return (
      <section className="py-16 px-4" style={{ backgroundColor, color: textColor }}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading gallery...</p>
        </div>
      </section>
    )
  }

  if (error || !selectedGallery || !selectedGallery.images?.length) {
    return (
      <section className="py-16 px-4" style={{ backgroundColor, color: textColor }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 mb-2">No gallery images available</p>
          {galleryId && (
            <div className="text-sm text-gray-400">
              <p className="mb-2">Gallery ID/shortcode "{galleryId}" not found.</p>
              {galleries.length > 0 && (
                <div>
                  <p className="mb-1">Available galleries:</p>
                  <ul className="text-xs">
                    {galleries.map(g => (
                      <li key={g.id} className="mb-1">
                        ID: <span className="font-mono bg-gray-200 px-1 rounded">{g.id}</span>
                        {g.shortcode && <span> | Shortcode: <span className="font-mono bg-gray-200 px-1 rounded">{g.shortcode}</span></span>}
                        <span> - {g.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    )
  }

  const displayImages = selectedGallery.images.slice(0, maxImages)

  return (
    <>
      <section className="py-16 px-4" style={{ backgroundColor, color: textColor }}>
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

          {/* Gallery Content */}
          {layout === 'carousel' ? (
            /* Carousel Layout */
            <div className="relative max-w-4xl mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={displayImages[carouselIndex]?.src}
                  alt={displayImages[carouselIndex]?.alt}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openLightbox(carouselIndex)}
                />
                
                {/* Overlay Caption */}
                {showCaptions && displayImages[carouselIndex]?.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
                    <p className="text-sm">{displayImages[carouselIndex].caption}</p>
                  </div>
                )}
              </div>

              {/* Carousel Controls */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={prevCarouselImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextCarouselImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Dots */}
                  <div className="flex justify-center mt-4 space-x-2">
                    {displayImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCarouselIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === carouselIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Grid/Masonry Layout */
            <div className={getLayoutClasses()}>
              {displayImages.map((image, index) => (
                <div 
                  key={index} 
                  className={`group cursor-pointer ${layout === 'masonry' ? 'break-inside-avoid mb-4' : ''}`}
                  onClick={() => openLightbox(index)}
                >
                  <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Hover Overlay */}
                    {lightbox && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}

                    {/* Caption */}
                    {showCaptions && image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3">
                        <p className="text-sm">{image.caption}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] mx-4">
            <img
              src={displayImages[lightboxIndex]?.src}
              alt={displayImages[lightboxIndex]?.alt}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prevLightboxImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextLightboxImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Caption */}
            {showCaptions && displayImages[lightboxIndex]?.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
                <p className="text-center">{displayImages[lightboxIndex].caption}</p>
              </div>
            )}

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white text-sm">
              {lightboxIndex + 1} / {displayImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GalleryWidget
