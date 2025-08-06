'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ExternalLink } from 'lucide-react'

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

interface DynamicNavigationProps {
  location: string
  className?: string
  orientation?: 'horizontal' | 'vertical'
  showIcons?: boolean
  maxDepth?: number
}

export default function DynamicNavigation({ 
  location, 
  className = '',
  orientation = 'horizontal',
  showIcons = false,
  maxDepth = 2
}: DynamicNavigationProps) {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`/api/menus?location=${location}`)
        const data = await response.json()
        
        if (data.menus && data.menus.length > 0) {
          setMenu(data.menus[0])
        }
      } catch (error) {
        console.warn('Failed to fetch menu for location:', location)
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [location])

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!item.isVisible || level >= maxDepth) return null

    const hasChildren = item.children && item.children.length > 0 && level < maxDepth - 1
    const isExternal = item.type === 'external'

    return (
      <div key={item.id} className={`relative group ${orientation === 'vertical' ? 'w-full' : ''}`}>
        <a 
          href={item.url}
          target={item.target || '_self'}
          className={`
            flex items-center transition-colors duration-200
            ${orientation === 'horizontal' 
              ? 'hover:text-blue-600 font-medium px-3 py-2' 
              : 'hover:bg-gray-100 px-4 py-2 block'
            }
            ${level > 0 ? 'text-sm pl-6' : ''}
          `}
        >
          {item.label}
          {showIcons && isExternal && (
            <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
          )}
          {hasChildren && orientation === 'horizontal' && (
            <ChevronRight className="w-4 h-4 ml-1 group-hover:rotate-90 transition-transform" />
          )}
        </a>

        {/* Desktop Dropdown */}
        {hasChildren && orientation === 'horizontal' && (
          <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-1">
              {item.children!.map((child) => (
                <a
                  key={child.id}
                  href={child.url}
                  target={child.target || '_self'}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                >
                  {child.label}
                  {showIcons && child.type === 'external' && (
                    <ExternalLink className="w-3 h-3 ml-1 inline opacity-60" />
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Vertical Children */}
        {hasChildren && orientation === 'vertical' && (
          <div className="ml-4">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className={`flex ${orientation === 'horizontal' ? 'space-x-6' : 'flex-col space-y-2'}`}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!menu || !menu.items.length) {
    // Fallback menu
    const fallbackItems = [
      { id: '1', label: 'Home', url: '/', type: 'page' as const, isVisible: true },
      { id: '2', label: 'About', url: '/about', type: 'page' as const, isVisible: true },
      { id: '3', label: 'Contact', url: '/contact', type: 'page' as const, isVisible: true }
    ]

    return (
      <nav className={className}>
        <div className={`flex ${orientation === 'horizontal' ? 'space-x-6' : 'flex-col space-y-1'}`}>
          {fallbackItems.map(item => renderMenuItem(item))}
        </div>
      </nav>
    )
  }

  return (
    <nav className={className}>
      <div className={`flex ${orientation === 'horizontal' ? 'space-x-6' : 'flex-col space-y-1'}`}>
        {menu.items.map(item => renderMenuItem(item))}
      </div>
    </nav>
  )
}
