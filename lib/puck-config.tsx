import React, { useState, useEffect } from "react"
import type { Config, Data } from "@measured/puck"
import { NewsNoticesWidget } from '@/components/widgets/NewsNoticesWidget'
import { GalleryWidget } from '@/components/widgets/GalleryWidget'
import { SliderWidget } from '@/components/widgets/SliderWidget'
import { NavigationMenu } from '@/components/widgets/NavigationMenu'

import {
  Type,
  Image as ImageIcon,
  Video,
  Columns as ColumnsIcon,
  FileText,
  Layout,
  Quote,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  Camera,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink,
  ArrowRight
} from "lucide-react"

// Dynamic Header Component with Menu Integration
export const DynamicHeader = ({
  logo,
  logoText,
  backgroundColor,
  textColor,
  menuLocation,
  contactInfo,
  socialLinks,
  customCss
}: any) => {
  const [menu, setMenu] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Fetch menu based on location only after hydration
  useEffect(() => {
    if (!isHydrated) return

    const fetchMenu = async () => {
      try {
        const response = await fetch(`/api/menus?location=${menuLocation || 'header'}`)
        const data = await response.json()
        if (data.menus && data.menus.length > 0) {
          setMenu(data.menus[0]) // Use the first active menu for this location
        }
      } catch (error) {
        console.warn('Failed to fetch menu, using fallback')
      }
    }

    fetchMenu()
  }, [menuLocation, isHydrated])

  // Fallback menu items if no dynamic menu is found
  const fallbackMenuItems = [
    { label: "Home", url: "/", isVisible: true },
    { label: "About", url: "/about", isVisible: true },
    { label: "Services", url: "/services", isVisible: true },
    { label: "Contact", url: "/contact", isVisible: true }
  ]

  // Use fallback items until hydrated and data is loaded
  const menuItems = !isHydrated ? fallbackMenuItems : (menu?.items || fallbackMenuItems)

  const renderMenuItem = (item: any, level = 0) => {
    if (!item.isVisible) return null

    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id || item.label} className={`relative group ${level > 0 ? 'w-full' : ''}`}>
        <a
          href={item.url}
          target={item.target || '_self'}
          className={`
            flex items-center hover:opacity-75 transition-opacity font-medium
            ${level > 0 ? 'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100' : ''}
          `}
        >
          {item.label}
          {hasChildren && level === 0 && (
            <ChevronRight className="w-4 h-4 ml-1 group-hover:rotate-90 transition-transform" />
          )}
        </a>

        {/* Dropdown for desktop */}
        {hasChildren && level === 0 && (
          <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-1">
              {item.children.map((child: any) => renderMenuItem(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderMobileMenuItem = (item: any, level = 0) => {
    if (!item.isVisible) return null

    const [isExpanded, setIsExpanded] = useState(false)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id || item.label} className={level > 0 ? 'ml-4' : ''}>
        <div className="flex items-center justify-between">
          <a
            href={item.url}
            target={item.target || '_self'}
            className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 flex-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {item.label}
          </a>
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-3 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children.map((child: any) => renderMobileMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <header
      className="w-full py-4 px-6 shadow-md relative z-50"
      style={{ backgroundColor: backgroundColor || '#ffffff', color: textColor || '#000000' }}
    >
      <style dangerouslySetInnerHTML={{ __html: customCss || '' }} />
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          {logo && <img src={logo} alt="Logo" className="h-12 w-auto mr-3" />}
          <span className="text-2xl font-bold">{logoText || "Your Website"}</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          {menuItems.map((item: any, index: number) => renderMenuItem(item))}
        </nav>

        {/* Contact Info */}
        <div className="hidden lg:flex items-center space-x-4">
          {contactInfo && (
            <>
              {contactInfo.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-1" />
                  {contactInfo.phone}
                </div>
              )}
              {contactInfo.email && (
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-1" />
                  {contactInfo.email}
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => isHydrated && setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isHydrated && isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          {menuItems.map((item: any, index: number) => renderMobileMenuItem(item))}
        </div>
      )}
    </header>
  )
}

// Dynamic Slider Component (Now uses SliderWidget internally)
export const DynamicSlider = ({ slides, autoPlay, customCss, sliderId, location }: any) => {
  // If slides are provided directly, use the old behavior
  if (slides && slides.length > 0) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const slidesList = slides

    useEffect(() => {
      if (autoPlay && slidesList.length > 1) {
        const interval = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % slidesList.length)
        }, 5000)
        return () => clearInterval(interval)
      }
    }, [autoPlay, slidesList.length])

    return (
      <section className="relative w-full h-96 md:h-[500px] overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: customCss || '' }} />
        {slidesList.map((slide: any, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{slide.title}</h1>
                {slide.subtitle && (
                  <p className="text-xl md:text-2xl mb-6 opacity-90">{slide.subtitle}</p>
                )}
                {slide.buttonText && (
                  <a
                    href={slide.buttonUrl}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {slide.buttonText}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        {slidesList.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slidesList.length) % slidesList.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slidesList.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {slidesList.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {slidesList.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        )}
      </section>
    )
  }

  // Use SliderWidget for dynamic content
  return (
    <SliderWidget
      sliderId={sliderId}
      location={location || "homepage"}
      height="500px"
      autoPlay={autoPlay}
    />
  )
}



// Dynamic Photo Gallery Component
export const PhotoGallerySection = ({ 
  title, 
  images, 
  columns, 
  backgroundColor, 
  customCss 
}: any) => {
  const imageList = images || [
    { src: "https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Photo+1", alt: "Photo 1", caption: "Sample Photo 1" },
    { src: "https://via.placeholder.com/400x300/10B981/FFFFFF?text=Photo+2", alt: "Photo 2", caption: "Sample Photo 2" },
    { src: "https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Photo+3", alt: "Photo 3", caption: "Sample Photo 3" }
  ]

  const columnClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4'
  }[columns || 3]

  return (
    <section 
      className="py-16 px-4"
      style={{ backgroundColor: backgroundColor || '#ffffff' }}
    >
      <style dangerouslySetInnerHTML={{ __html: customCss || '' }} />
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title || "Photo Gallery"}</h2>
        <div className={`grid grid-cols-1 ${columnClass} gap-6`}>
          {imageList.map((image: any, index: number) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg shadow-md">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3">
                    <p className="text-sm">{image.caption}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Dynamic Events Component
export const EventsSection = ({ 
  title, 
  events, 
  backgroundColor, 
  textColor, 
  customCss 
}: any) => {
  const eventList = events || [
    {
      title: "Annual Conference 2024",
      date: "2024-03-15",
      time: "10:00 AM",
      location: "Main Auditorium",
      description: "Join us for our annual conference featuring industry experts.",
      image: "https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Event"
    }
  ]

  return (
    <section 
      className="py-16 px-4"
      style={{ backgroundColor: backgroundColor || '#f8fafc', color: textColor || '#1f2937' }}
    >
      <style dangerouslySetInnerHTML={{ __html: customCss || '' }} />
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title || "Upcoming Events"}</h2>
        <div className="space-y-6">
          {eventList.map((event: any, index: number) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="md:flex">
                {event.image && (
                  <div className="md:w-1/3">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 md:w-2/3">
                  <div className="flex items-center text-sm text-blue-600 mb-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  {event.location && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      {event.location}
                    </div>
                  )}
                  <p className="text-gray-700 mb-4">{event.description}</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Dynamic Activities Component
export const ActivitiesSection = ({ 
  title, 
  activities, 
  backgroundColor, 
  layout, 
  customCss 
}: any) => {
  const activitiesList = activities || [
    {
      title: "Research Programs",
      description: "Cutting-edge research in various fields",
      icon: "🔬",
      link: "#",
      image: "https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Research"
    }
  ]

  const isGridLayout = layout === 'grid'

  return (
    <section 
      className="py-16 px-4"
      style={{ backgroundColor: backgroundColor || '#ffffff' }}
    >
      <style dangerouslySetInnerHTML={{ __html: customCss || '' }} />
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title || "Our Activities"}</h2>
        <div className={isGridLayout ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
          {activitiesList.map((activity: any, index: number) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {activity.image && (
                <img 
                  src={activity.image} 
                  alt={activity.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <div className="flex items-center mb-3">
                {activity.icon && <span className="text-2xl mr-3">{activity.icon}</span>}
                <h3 className="text-xl font-semibold">{activity.title}</h3>
              </div>
              <p className="text-gray-600 mb-4">{activity.description}</p>
              {activity.link && (
                <a 
                  href={activity.link}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Learn More →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Dynamic Footer Component
export const DynamicFooter = ({ 
  backgroundColor, 
  textColor, 
  sections, 
  copyright, 
  socialLinks, 
  customCss 
}: any) => {
  const footerSections = sections || [
    {
      title: "Quick Links",
      links: [
        { label: "Home", url: "/" },
        { label: "About", url: "/about" },
        { label: "Services", url: "/services" },
        { label: "Contact", url: "/contact" }
      ]
    }
  ]

  return (
    <footer 
      className="py-12 px-4"
      style={{ backgroundColor: backgroundColor || '#1f2937', color: textColor || '#ffffff' }}
    >
      <style dangerouslySetInnerHTML={{ __html: customCss || '' }} />
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section: any, index: number) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links?.map((link: any, linkIndex: number) => (
                  <li key={linkIndex}>
                    <a href={link.url} className="hover:opacity-75 transition-opacity">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-600 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm opacity-75">
            {copyright || "© 2024 Your Website. All rights reserved."}
          </p>
          {socialLinks && (
            <div className="flex space-x-4 mt-4 md:mt-0">
              {socialLinks.map((link: any, index: number) => (
                <a 
                  key={index}
                  href={link.url} 
                  className="hover:opacity-75 transition-opacity"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}

// Dynamic Popup Component
export const DynamicPopup = ({
  isVisible,
  title,
  content,
  backgroundColor,
  textColor,
  buttonText,
  buttonAction,
  customCss
}: any) => {
  const [showPopup, setShowPopup] = useState(isVisible || false)

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowPopup(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!showPopup) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <style dangerouslySetInnerHTML={{ __html: customCss || '' }} />
      <div 
        className="bg-white rounded-lg p-6 max-w-md mx-4 relative"
        style={{ backgroundColor: backgroundColor || '#ffffff', color: textColor || '#1f2937' }}
      >
        <button
          onClick={() => setShowPopup(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        
        {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
        {content && <p className="mb-6">{content}</p>}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowPopup(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          {buttonText && (
            <button
              onClick={() => {
                if (buttonAction) buttonAction()
                setShowPopup(false)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// HTML Import Component
export const HTMLImportSection = ({ htmlContent, cssContent, customCss }: any) => {
  return (
    <section className="w-full">
      <style dangerouslySetInnerHTML={{ __html: `${cssContent || ''} ${customCss || ''}` }} />
      <div dangerouslySetInnerHTML={{ __html: htmlContent || '<div class="p-8 text-center text-gray-500">Import your HTML content here</div>' }} />
    </section>
  )
}

// Enhanced Puck Configuration
export const config: Config = {
  components: {
    DynamicHeader: {
      render: DynamicHeader,
      fields: {
        logo: { type: "text", label: "Logo URL" },
        logoText: { type: "text", label: "Logo Text" },
        backgroundColor: { type: "text", label: "Background Color" },
        textColor: { type: "text", label: "Text Color" },
        menuLocation: {
          type: "select",
          label: "Menu Location",
          options: [
            { label: "Header Menu", value: "header" },
            { label: "Footer Menu", value: "footer" },
            { label: "Sidebar Menu", value: "sidebar" },
            { label: "Mobile Menu", value: "mobile" }
          ]
        },
        contactInfo: {
          type: "object",
          label: "Contact Info",
          objectFields: {
            phone: { type: "text", label: "Phone Number" },
            email: { type: "text", label: "Email Address" }
          }
        },
        customCss: { type: "textarea", label: "Custom CSS" }
      }
    },

    DynamicSlider: {
      render: DynamicSlider,
      fields: {
        sliderId: {
          type: "text",
          label: "Slider ID (enter the exact ID from /admin/slider - typically a number like '1', '2', etc.)"
        },
        location: {
          type: "select",
          label: "Or Select by Location",
          options: [
            { label: "Homepage", value: "homepage" },
            { label: "Header", value: "header" },
            { label: "Custom", value: "custom" }
          ]
        },
        slides: {
          type: "array",
          label: "Custom Slides (if not using managed slider)",
          arrayFields: {
            image: { type: "text", label: "Image URL" },
            title: { type: "text", label: "Title" },
            subtitle: { type: "text", label: "Subtitle" },
            buttonText: { type: "text", label: "Button Text" },
            buttonUrl: { type: "text", label: "Button URL" }
          }
        },
        autoPlay: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        customCss: { type: "textarea", label: "Custom CSS" }
      }
    },



    PhotoGallerySection: {
      render: PhotoGallerySection,
      fields: {
        title: { type: "text", label: "Gallery Title" },
        columns: { 
          type: "select", 
          options: [
            { label: "2 Columns", value: 2 },
            { label: "3 Columns", value: 3 },
            { label: "4 Columns", value: 4 }
          ]
        },
        backgroundColor: { type: "text", label: "Background Color" },
        images: {
          type: "array",
          label: "Images",
          arrayFields: {
            src: { type: "text", label: "Image URL" },
            alt: { type: "text", label: "Alt Text" },
            caption: { type: "text", label: "Caption" }
          }
        },
        customCss: { type: "textarea", label: "Custom CSS" }
      }
    },

    EventsSection: {
      render: EventsSection,
      fields: {
        title: { type: "text", label: "Section Title" },
        backgroundColor: { type: "text", label: "Background Color" },
        textColor: { type: "text", label: "Text Color" },
        events: {
          type: "array",
          label: "Events",
          arrayFields: {
            title: { type: "text" },
            date: { type: "text", label: "Date (YYYY-MM-DD)" },
            time: { type: "text" },
            location: { type: "text" },
            description: { type: "textarea" },
            image: { type: "text", label: "Image URL" }
          }
        },
        customCss: { type: "textarea", label: "Custom CSS" }
      }
    },

    ActivitiesSection: {
      render: ActivitiesSection,
      fields: {
        title: { type: "text", label: "Section Title" },
        backgroundColor: { type: "text", label: "Background Color" },
        layout: { 
          type: "select", 
          options: [
            { label: "Grid Layout", value: "grid" },
            { label: "List Layout", value: "list" }
          ]
        },
        activities: {
          type: "array",
          label: "Activities",
          arrayFields: {
            title: { type: "text" },
            description: { type: "textarea" },
            icon: { type: "text", label: "Icon (emoji or text)" },
            image: { type: "text", label: "Image URL" },
            link: { type: "text", label: "Link URL" }
          }
        },
        customCss: { type: "textarea", label: "Custom CSS" }
      }
    },

    DynamicFooter: {
      render: DynamicFooter,
      fields: {
        backgroundColor: { type: "text", label: "Background Color" },
        textColor: { type: "text", label: "Text Color" },
        copyright: { type: "text", label: "Copyright Text" },
        sections: {
          type: "array",
          label: "Footer Sections",
          arrayFields: {
            title: { type: "text" },
            links: {
              type: "array",
              arrayFields: {
                label: { type: "text" },
                url: { type: "text" }
              }
            }
          }
        },
        customCss: { type: "textarea", label: "Custom CSS" }
      }
    },

    DynamicPopup: {
      render: DynamicPopup,
      fields: {
        isVisible: { type: "radio", options: [{ label: "Show", value: true }, { label: "Hide", value: false }] },
        title: { type: "text", label: "Popup Title" },
        content: { type: "textarea", label: "Popup Content" },
        backgroundColor: { type: "text", label: "Background Color" },
        textColor: { type: "text", label: "Text Color" },
        buttonText: { type: "text", label: "Button Text" },
        customCss: { type: "textarea", label: "Custom CSS" }
      }
    },

    HTMLImportSection: {
      render: HTMLImportSection,
      fields: {
        htmlContent: { type: "textarea", label: "HTML Content" },
        cssContent: { type: "textarea", label: "CSS Content" },
        customCss: { type: "textarea", label: "Additional CSS" }
      }
    },

    NewsNoticesWidget: {
      render: (props: any) => <NewsNoticesWidget {...props} />,
      fields: {
        // Content
        title: { type: "text", label: "Section Title" },
        subtitle: { type: "textarea", label: "Subtitle/Description" },

        // Display Controls
        showFilters: {
          type: "radio",
          label: "Show Category Filters",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        showSearch: {
          type: "radio",
          label: "Show Search",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        showViewToggle: {
          type: "radio",
          label: "Show View Toggle",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },

        // Layout Options
        layout: {
          type: "select",
          label: "Layout Style",
          options: [
            { label: "Grid - 3 Columns", value: "grid-3" },
            { label: "Grid - 2 Columns", value: "grid-2" },
            { label: "Grid - 4 Columns", value: "grid-4" },
            { label: "List View", value: "list" },
            { label: "Masonry", value: "masonry" }
          ]
        },
        cardStyle: {
          type: "select",
          label: "Card Style",
          options: [
            { label: "Card (Default)", value: "card" },
            { label: "Modern", value: "modern" },
            { label: "Minimal", value: "minimal" },
            { label: "Gradient", value: "gradient" },
            { label: "Left Bordered", value: "bordered" }
          ]
        },
        maxItems: { type: "number", label: "Maximum Items to Show" },

        // Content Display Options
        showDate: {
          type: "radio",
          label: "Show Dates",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        showCategory: {
          type: "radio",
          label: "Show Categories",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        showAuthor: {
          type: "radio",
          label: "Show Authors",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        showExcerpt: {
          type: "radio",
          label: "Show Excerpt",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        showTags: {
          type: "radio",
          label: "Show Tags",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        showReadTime: {
          type: "radio",
          label: "Show Read Time",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },

        // Styling Options
        backgroundColor: { type: "text", label: "Background Color" },
        textColor: { type: "text", label: "Text Color" },
        titleColor: { type: "text", label: "Title Color" },
        cardBackgroundColor: { type: "text", label: "Card Background Color" },
        accentColor: { type: "text", label: "Accent Color" },

        // Behavior Options
        autoRefresh: {
          type: "radio",
          label: "Auto Refresh",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        refreshInterval: { type: "number", label: "Refresh Interval (seconds)" },
        enableInfiniteScroll: {
          type: "radio",
          label: "Enable Load More",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        enableShare: {
          type: "radio",
          label: "Enable Share Button",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        }
      }
    },

    GalleryWidget: {
      render: (props: any) => <GalleryWidget {...props} />,
      fields: {
        // Content
        title: { type: "text", label: "Gallery Title" },
        subtitle: { type: "textarea", label: "Subtitle" },
        galleryId: {
          type: "text",
          label: "Gallery ID or Shortcode (enter exact ID like '1' or shortcode like 'campus-events-2024' from /admin/gallery)"
        },

        // Display Options
        layout: {
          type: "select",
          label: "Layout Style",
          options: [
            { label: "Grid", value: "grid" },
            { label: "Masonry", value: "masonry" },
            { label: "Carousel", value: "carousel" }
          ]
        },
        columns: {
          type: "select",
          label: "Columns (Grid only)",
          options: [
            { label: "1 Column", value: 1 },
            { label: "2 Columns", value: 2 },
            { label: "3 Columns", value: 3 },
            { label: "4 Columns", value: 4 }
          ]
        },
        maxImages: { type: "number", label: "Maximum Images" },

        // Display Features
        showCaptions: {
          type: "radio",
          label: "Show Captions",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        lightbox: {
          type: "radio",
          label: "Enable Lightbox",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },

        // Styling
        backgroundColor: { type: "text", label: "Background Color" },
        textColor: { type: "text", label: "Text Color" },
        titleColor: { type: "text", label: "Title Color" },
        accentColor: { type: "text", label: "Accent Color" },

        // Carousel Options
        autoPlay: {
          type: "radio",
          label: "Auto Play (Carousel)",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        autoPlaySpeed: { type: "number", label: "Auto Play Speed (seconds)" }
      }
    },

    SliderWidget: {
      render: (props: any) => <SliderWidget {...props} />,
      fields: {
        // Content
        title: { type: "text", label: "Slider Title (optional)" },
        sliderId: {
          type: "text",
          label: "Slider ID (enter the exact ID from /admin/slider - typically a number like '1', '2', etc.)"
        },
        location: {
          type: "select",
          label: "Slider Location (if no ID selected)",
          options: [
            { label: "Homepage", value: "homepage" },
            { label: "Header", value: "header" },
            { label: "Custom", value: "custom" }
          ]
        },

        // Display Options
        height: { type: "text", label: "Slider Height (e.g., 500px)" },
        showDots: {
          type: "radio",
          label: "Show Dots",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        showArrows: {
          type: "radio",
          label: "Show Arrows",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },

        // Behavior Options
        autoPlay: {
          type: "radio",
          label: "Auto Play",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        autoPlaySpeed: { type: "number", label: "Auto Play Speed (seconds)" },
        infinite: {
          type: "radio",
          label: "Infinite Loop",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        pauseOnHover: {
          type: "radio",
          label: "Pause on Hover",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        transition: {
          type: "select",
          label: "Transition Effect",
          options: [
            { label: "Slide", value: "slide" },
            { label: "Fade", value: "fade" }
          ]
        },

        // Styling
        backgroundColor: { type: "text", label: "Background Color" },
        overlayOpacity: { type: "number", label: "Overlay Opacity (0-1)" }
      }
    },

    NavigationMenu: {
      render: (props: any) => <NavigationMenu {...props} />,
      fields: {
        // Content
        title: { type: "text", label: "Navigation Title (optional)" },
        menuLocation: {
          type: "select",
          label: "Menu Location",
          options: [
            { label: "Header Menu", value: "header" },
            { label: "Footer Menu", value: "footer" },
            { label: "Sidebar Menu", value: "sidebar" },
            { label: "Mobile Menu", value: "mobile" }
          ]
        },

        // Styling
        backgroundColor: { type: "text", label: "Background Color (e.g., #6B46C1)" },
        textColor: { type: "text", label: "Text Color (e.g., #FFFFFF)" },
        hoverColor: { type: "text", label: "Hover Color (e.g., #8B5CF6)" },
        activeColor: { type: "text", label: "Active Color (e.g., #7C3AED)" },
        dropdownBackgroundColor: { type: "text", label: "Dropdown Background (e.g., #FFFFFF)" },
        dropdownTextColor: { type: "text", label: "Dropdown Text Color (e.g., #1F2937)" },
        borderColor: { type: "text", label: "Border Color (e.g., #E5E7EB)" },

        // Layout
        alignment: {
          type: "select",
          label: "Menu Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" }
          ]
        },
        spacing: {
          type: "select",
          label: "Menu Spacing",
          options: [
            { label: "Compact", value: "compact" },
            { label: "Normal", value: "normal" },
            { label: "Wide", value: "wide" }
          ]
        },
        fontSize: {
          type: "select",
          label: "Font Size",
          options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" }
          ]
        },
        fontWeight: {
          type: "select",
          label: "Font Weight",
          options: [
            { label: "Normal", value: "normal" },
            { label: "Medium", value: "medium" },
            { label: "Semi Bold", value: "semibold" },
            { label: "Bold", value: "bold" }
          ]
        },

        // Behavior
        enableDropdowns: {
          type: "radio",
          label: "Enable Dropdowns",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        showMobileMenu: {
          type: "radio",
          label: "Show Mobile Menu",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },
        stickyOnScroll: {
          type: "radio",
          label: "Sticky on Scroll",
          options: [{ label: "Yes", value: true }, { label: "No", value: false }]
        },

        // Advanced
        customCss: { type: "textarea", label: "Custom CSS" }
      }
    }
  }
}

export const initialData: Data = {
  content: [
    {
      type: "DynamicHeader",
      props: {
        id: "header-1",
        logoText: "Your Website",
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        menuLocation: "header"
      }
    },
    {
      type: "DynamicSlider",
      props: {
        id: "slider-1",
        autoPlay: true
      }
    }
  ],
  root: { props: { title: "My Dynamic Website" } }
}
