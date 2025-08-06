'use client'

import React, { useState, useEffect } from 'react'
import { useSliderData, Slider, Slide } from '@/lib/hooks/useSliderData'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SliderWidgetProps {
  // Content
  title?: string
  sliderId?: string
  location?: string
  
  // Display options
  height?: string
  autoPlay?: boolean
  autoPlaySpeed?: number
  showDots?: boolean
  showArrows?: boolean
  infinite?: boolean
  pauseOnHover?: boolean
  transition?: 'slide' | 'fade'
  
  // Styling
  backgroundColor?: string
  overlayOpacity?: number
}

export const SliderWidget: React.FC<SliderWidgetProps> = ({
  title,
  sliderId,
  location,
  height = '500px',
  autoPlay = true,
  autoPlaySpeed = 5,
  showDots = true,
  showArrows = true,
  infinite = true,
  pauseOnHover = true,
  transition = 'slide',
  backgroundColor,
  overlayOpacity = 0.3
}) => {
  const { sliders, loading, error, fetchSliders } = useSliderData()
  const [selectedSlider, setSelectedSlider] = useState<Slider | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  // Load sliders and find selected one
  useEffect(() => {
    try {
      fetchSliders().catch(err => {
        console.warn('SliderWidget: Failed to fetch sliders, using fallback data:', err)
      })
    } catch (err) {
      console.warn('SliderWidget: Error in fetchSliders call:', err)
    }
  }, [fetchSliders])

  useEffect(() => {
    if (sliders.length > 0) {
      let slider: Slider | undefined

      if (sliderId && sliderId.trim()) {
        // Try multiple matching strategies for flexibility
        slider = sliders.find(s =>
          s.id === sliderId ||
          s.id === sliderId.toString() ||
          s.name?.toLowerCase().includes(sliderId.toLowerCase()) ||
          s.name?.toLowerCase().replace(/\s+/g, '').includes(sliderId.toLowerCase().replace(/\s+/g, ''))
        )
      }

      if (!slider && location) {
        slider = sliders.find(s => s.location === location && s.isActive)
      }

      if (!slider) {
        // Fallback to first active slider or any slider
        slider = sliders.find(s => s.isActive) || sliders[0]
      }

      setSelectedSlider(slider || null)

      // Apply slider settings
      if (slider?.settings) {
        setIsPlaying(slider.settings.autoPlay ?? autoPlay)
      }
    }
  }, [sliders, sliderId, location, autoPlay])

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && selectedSlider?.slides?.length && selectedSlider.slides.length > 1) {
      const interval = setInterval(() => {
        nextSlide()
      }, (selectedSlider.settings?.autoPlaySpeed || autoPlaySpeed) * 1000)
      
      return () => clearInterval(interval)
    }
  }, [isPlaying, selectedSlider, currentSlide])

  const nextSlide = () => {
    if (!selectedSlider?.slides?.length) return
    
    if (infinite || currentSlide < selectedSlider.slides.length - 1) {
      setCurrentSlide(prev => (prev + 1) % selectedSlider.slides.length)
    }
  }

  const prevSlide = () => {
    if (!selectedSlider?.slides?.length) return
    
    if (infinite || currentSlide > 0) {
      setCurrentSlide(prev => 
        prev === 0 ? selectedSlider.slides.length - 1 : prev - 1
      )
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPlaying(false)
    }
  }

  const handleMouseLeave = () => {
    if (pauseOnHover && (selectedSlider?.settings?.autoPlay ?? autoPlay)) {
      setIsPlaying(true)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !selectedSlider || !selectedSlider.slides?.length) {
    return (
      <div className="w-full flex items-center justify-center bg-gray-100" style={{ height }}>
        <div className="text-center p-4">
          <p className="text-gray-500 mb-2">No slides available</p>
          {sliderId && (
            <div className="text-sm text-gray-400">
              <p className="mb-2">Slider ID "{sliderId}" not found.</p>
              {sliders.length > 0 && (
                <div>
                  <p className="mb-1">Available sliders:</p>
                  <ul className="text-xs">
                    {sliders.map(s => (
                      <li key={s.id} className="mb-1">
                        ID: <span className="font-mono bg-gray-200 px-1 rounded">{s.id}</span> - {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {location && !sliderId && (
            <p className="text-sm text-gray-400">
              No active slider found for location "{location}".
            </p>
          )}
        </div>
      </div>
    )
  }

  const activeSlides = selectedSlider.slides.filter(slide => slide.isActive !== false)
  const slide = activeSlides[currentSlide]

  if (!slide) return null

  const getTextAlignmentClass = (position: string) => {
    switch(position) {
      case 'left': return 'text-left items-start'
      case 'right': return 'text-right items-end'
      default: return 'text-center items-center'
    }
  }

  const getTransitionClass = () => {
    return transition === 'fade' ? 'transition-opacity duration-1000' : 'transition-transform duration-500'
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ 
        height: selectedSlider.settings?.height || height,
        backgroundColor 
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {activeSlides.map((slideItem, index) => (
          <div
            key={slideItem.id || index}
            className={`absolute inset-0 ${getTransitionClass()} ${
              index === currentSlide ? 'opacity-100 translate-x-0' : 
              transition === 'fade' ? 'opacity-0' : 'translate-x-full'
            }`}
            style={{
              transform: transition === 'slide' && index !== currentSlide ? 
                `translateX(${(index - currentSlide) * 100}%)` : undefined
            }}
          >
            {/* Background Image */}
            <img
              src={slideItem.image}
              alt={slideItem.title}
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black"
              style={{ opacity: slideItem.overlayOpacity ?? overlayOpacity }}
            />

            {/* Content */}
            <div className={`absolute inset-0 flex flex-col justify-center px-4 sm:px-6 lg:px-8 ${getTextAlignmentClass(slideItem.textPosition || 'center')}`}>
              <div className="max-w-4xl mx-auto w-full">
                <h1 
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
                  style={{ color: slideItem.textColor || '#ffffff' }}
                >
                  {slideItem.title}
                </h1>
                
                {slideItem.subtitle && (
                  <h2 
                    className="text-xl sm:text-2xl lg:text-3xl mb-6 opacity-90"
                    style={{ color: slideItem.textColor || '#ffffff' }}
                  >
                    {slideItem.subtitle}
                  </h2>
                )}
                
                {slideItem.description && (
                  <p 
                    className="text-lg sm:text-xl mb-8 max-w-2xl opacity-80"
                    style={{ color: slideItem.textColor || '#ffffff' }}
                  >
                    {slideItem.description}
                  </p>
                )}
                
                {slideItem.buttonText && slideItem.buttonUrl && (
                  <a
                    href={slideItem.buttonUrl}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
                  >
                    {slideItem.buttonText}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && activeSlides.length > 1 && (selectedSlider.settings?.showArrows ?? true) && (
        <>
          <button
            onClick={prevSlide}
            disabled={!infinite && currentSlide === 0}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            disabled={!infinite && currentSlide === activeSlides.length - 1}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && activeSlides.length > 1 && (selectedSlider.settings?.showDots ?? true) && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Title Overlay (if provided) */}
      {title && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
    </div>
  )
}

export default SliderWidget
