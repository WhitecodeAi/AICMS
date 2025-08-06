'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, Menu as MenuIcon, X } from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  url: string
  type: 'page' | 'external' | 'custom'
  target?: '_blank' | '_self'
  children?: MenuItem[]
  isVisible: boolean
}

interface Menu {
  id: string
  name: string
  location: string
  items: MenuItem[]
  isActive: boolean
}

interface NavigationMenuProps {
  // Content
  menuLocation?: string
  title?: string
  
  // Styling
  backgroundColor?: string
  textColor?: string
  hoverColor?: string
  activeColor?: string
  dropdownBackgroundColor?: string
  dropdownTextColor?: string
  borderColor?: string
  
  // Layout
  alignment?: 'left' | 'center' | 'right'
  spacing?: 'compact' | 'normal' | 'wide'
  fontSize?: 'small' | 'medium' | 'large'
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold'
  
  // Behavior
  enableDropdowns?: boolean
  showMobileMenu?: boolean
  stickyOnScroll?: boolean
  
  // Advanced
  customCss?: string
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  menuLocation = 'header',
  title,
  backgroundColor = '#6B46C1', // Purple as shown in screenshot
  textColor = '#FFFFFF',
  hoverColor = '#8B5CF6',
  activeColor = '#7C3AED', 
  dropdownBackgroundColor = '#FFFFFF',
  dropdownTextColor = '#1F2937',
  borderColor = '#E5E7EB',
  alignment = 'center',
  spacing = 'normal',
  fontSize = 'medium',
  fontWeight = 'medium',
  enableDropdowns = true,
  showMobileMenu = true,
  stickyOnScroll = false,
  customCss
}) => {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Fetch menu data only after hydration
  useEffect(() => {
    if (!isHydrated) return

    const fetchMenu = async () => {
      try {
        const response = await fetch(`/api/menus?location=${menuLocation}`)
        const data = await response.json()
        if (data.menus && data.menus.length > 0) {
          setMenu(data.menus[0])
        }
      } catch (error) {
        console.warn('Failed to fetch menu, using fallback')
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [menuLocation, isHydrated])

  // Fallback menu items matching college layout
  const fallbackMenuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      url: '/',
      type: 'page',
      isVisible: true
    },
    {
      id: 'about',
      label: 'About',
      url: '/about',
      type: 'page',
      isVisible: true,
      children: [
        { id: 'about-history', label: 'Our History', url: '/about/history', type: 'page', isVisible: true },
        { id: 'about-mission', label: 'Mission & Vision', url: '/about/mission', type: 'page', isVisible: true },
        { id: 'about-principal', label: 'Principal Message', url: '/about/principal', type: 'page', isVisible: true }
      ]
    },
    {
      id: 'departments',
      label: 'Departments',
      url: '/departments',
      type: 'page',
      isVisible: true,
      children: [
        { id: 'dept-cs', label: 'Computer Science', url: '/departments/cs', type: 'page', isVisible: true },
        { id: 'dept-physics', label: 'Physics', url: '/departments/physics', type: 'page', isVisible: true },
        { id: 'dept-chemistry', label: 'Chemistry', url: '/departments/chemistry', type: 'page', isVisible: true },
        { id: 'dept-math', label: 'Mathematics', url: '/departments/mathematics', type: 'page', isVisible: true }
      ]
    },
    {
      id: 'admissions',
      label: 'Admissions',
      url: '/admissions',
      type: 'page',
      isVisible: true,
      children: [
        { id: 'admission-process', label: 'Admission Process', url: '/admissions/process', type: 'page', isVisible: true },
        { id: 'admission-eligibility', label: 'Eligibility Criteria', url: '/admissions/eligibility', type: 'page', isVisible: true },
        { id: 'admission-fees', label: 'Fee Structure', url: '/admissions/fees', type: 'page', isVisible: true }
      ]
    },
    {
      id: 'research',
      label: 'Research',
      url: '/research',
      type: 'page',
      isVisible: true,
      children: [
        { id: 'research-projects', label: 'Research Projects', url: '/research/projects', type: 'page', isVisible: true },
        { id: 'research-publications', label: 'Publications', url: '/research/publications', type: 'page', isVisible: true }
      ]
    },
    {
      id: 'student-life',
      label: "Student's Life",
      url: '/student-life',
      type: 'page',
      isVisible: true,
      children: [
        { id: 'clubs', label: 'Clubs & Societies', url: '/student-life/clubs', type: 'page', isVisible: true },
        { id: 'sports', label: 'Sports', url: '/student-life/sports', type: 'page', isVisible: true },
        { id: 'cultural', label: 'Cultural Activities', url: '/student-life/cultural', type: 'page', isVisible: true }
      ]
    },
    {
      id: 'events',
      label: 'Events',
      url: '/events',
      type: 'page',
      isVisible: true
    },
    {
      id: 'iqac',
      label: 'IQAC',
      url: '/iqac',
      type: 'page',
      isVisible: true,
      children: [
        { id: 'iqac-about', label: 'About IQAC', url: '/iqac/about', type: 'page', isVisible: true },
        { id: 'iqac-reports', label: 'Reports', url: '/iqac/reports', type: 'page', isVisible: true }
      ]
    },
    {
      id: 'naac',
      label: 'NAAC',
      url: '/naac',
      type: 'page',
      isVisible: true,
      children: [
        { id: 'naac-accreditation', label: 'Accreditation', url: '/naac/accreditation', type: 'page', isVisible: true },
        { id: 'naac-ssr', label: 'SSR', url: '/naac/ssr', type: 'page', isVisible: true }
      ]
    },
    {
      id: 'contact',
      label: 'Contact Us',
      url: '/contact',
      type: 'page',
      isVisible: true
    }
  ]

  // Use fallback items until data is loaded
  const menuItems = !isHydrated || loading ? fallbackMenuItems : (menu?.items || fallbackMenuItems)

  // Style configurations
  const spacingClasses = {
    compact: 'px-2 py-1',
    normal: 'px-4 py-2',
    wide: 'px-6 py-3'
  }

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  const fontWeightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }

  const handleDropdownToggle = (itemId: string) => {
    setActiveDropdown(activeDropdown === itemId ? null : itemId)
  }

  const renderMenuItem = (item: MenuItem, isMobile = false) => {
    if (!item.isVisible) return null

    const hasChildren = enableDropdowns && item.children && item.children.length > 0
    const isDropdownOpen = activeDropdown === item.id

    if (isMobile) {
      return (
        <div key={item.id} className="border-b border-gray-200 last:border-b-0">
          <div className="flex items-center justify-between">
            <a
              href={item.url}
              target={item.target || '_self'}
              className="flex-1 block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
            {hasChildren && (
              <button
                onClick={() => handleDropdownToggle(item.id)}
                className="px-4 py-3 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          {hasChildren && isDropdownOpen && (
            <div className="bg-gray-50 pl-4">
              {item.children!.map((child) => (
                <a
                  key={child.id}
                  href={child.url}
                  target={child.target || '_self'}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {child.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div key={item.id} className="relative group">
        <a
          href={item.url}
          target={item.target || '_self'}
          className={`
            ${spacingClasses[spacing]} ${fontSizeClasses[fontSize]} ${fontWeightClasses[fontWeight]}
            flex items-center transition-colors duration-200 hover:bg-opacity-80
            ${hasChildren ? 'cursor-pointer' : ''}
          `}
          style={{ color: textColor }}
          onMouseEnter={() => hasChildren && setActiveDropdown(item.id)}
        >
          {item.label}
          {hasChildren && (
            <ChevronDown className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-200" />
          )}
        </a>

        {hasChildren && (
          <div 
            className="absolute top-full left-0 min-w-48 shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
            style={{ 
              backgroundColor: dropdownBackgroundColor,
              border: `1px solid ${borderColor}`
            }}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <div className="py-2">
              {item.children!.map((child) => (
                <a
                  key={child.id}
                  href={child.url}
                  target={child.target || '_self'}
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100"
                  style={{ color: dropdownTextColor }}
                >
                  {child.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show loading state only for server-side rendering
  if (!isHydrated) {
    return (
      <nav 
        className={`w-full ${stickyOnScroll ? 'sticky top-0 z-40' : ''} shadow-md`}
        style={{ backgroundColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            {title && (
              <div className={`${fontSizeClasses[fontSize]} ${fontWeightClasses[fontWeight]}`} style={{ color: textColor }}>
                {title}
              </div>
            )}

            {/* Desktop Navigation - Show fallback */}
            <div className={`hidden md:flex items-center space-x-1 ${alignmentClasses[alignment]} flex-1`}>
              {fallbackMenuItems.slice(0, 5).map(item => (
                <a
                  key={item.id}
                  href={item.url}
                  className={`${spacingClasses[spacing]} ${fontSizeClasses[fontSize]} ${fontWeightClasses[fontWeight]} flex items-center transition-colors duration-200`}
                  style={{ color: textColor }}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Mobile menu button */}
            {showMobileMenu && (
              <button
                className="md:hidden p-2 rounded-md hover:bg-white hover:bg-opacity-10 transition-colors"
                style={{ color: textColor }}
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customCss || '' }} />
      <nav 
        className={`w-full ${stickyOnScroll ? 'sticky top-0 z-40' : ''} shadow-md`}
        style={{ backgroundColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            {title && (
              <div className={`${fontSizeClasses[fontSize]} ${fontWeightClasses[fontWeight]}`} style={{ color: textColor }}>
                {title}
              </div>
            )}

            {/* Desktop Navigation */}
            <div className={`hidden md:flex items-center space-x-1 ${alignmentClasses[alignment]} flex-1`}>
              {menuItems.map(item => renderMenuItem(item))}
            </div>

            {/* Mobile menu button */}
            {showMobileMenu && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md hover:bg-white hover:bg-opacity-10 transition-colors"
                style={{ color: textColor }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="max-h-96 overflow-y-auto">
              {menuItems.map(item => renderMenuItem(item, true))}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

export default NavigationMenu
