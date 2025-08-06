'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Settings,
  Home,
  Globe,
  Hammer,
  FileImage,
  Menu,
  Users,
  MessageSquare,
  BarChart3,
  Search,
  BookOpen,
  Calendar,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Code,
  Layers,
  Rocket,
  Zap,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    title: 'File Manager',
    href: '/admin/files',
    icon: FolderOpen
  },
  {
    title: 'Setup / Config',
    icon: Settings,
    children: [
      { title: 'General Settings', href: '/admin/settings', icon: Settings },
      { title: 'Theme Settings', href: '/admin/settings/theme', icon: Settings }
    ]
  },
  {
    title: 'Homepage',
    href: '/admin/homepage',
    icon: Home
  },
  {
    title: 'Website',
    icon: Globe,
    children: [
      { title: 'Pages Manager', href: '/admin/pages', icon: FileText },
      { title: 'Menus', href: '/admin/menus', icon: Menu }
    ]
  },
  {
    title: 'Dynamic Builders',
    icon: Layers,
    children: [
      { title: 'HTML/CSS Import', href: '/admin/html-import', icon: Code },
      { title: 'Puck.js Builder', href: '/admin/builder', icon: Layers },
      { title: 'Fast Code Editor', href: '/admin/builder-fast', icon: Rocket }
    ]
  },
  {
    title: 'Content Sections',
    icon: FileText,
    children: [
      { title: 'Home Sliders', href: '/admin/slider', icon: Play },
      { title: 'Photo Gallery', href: '/admin/gallery', icon: FileImage },
      { title: 'News & Notices', href: '/admin/news', icon: FileText },
      { title: 'Events', href: '/admin/events', icon: Calendar },
      { title: 'Activities', href: '/admin/activities', icon: GraduationCap }
    ]
  },
  {
    title: 'Quick Links',
    href: '/admin/quick-links',
    icon: BookOpen
  },
  {
    title: 'NAAC',
    href: '/admin/naac',
    icon: BarChart3
  },
  {
    title: 'Feedback',
    href: '/admin/feedback',
    icon: MessageSquare
  },
  {
    title: 'Config Table',
    href: '/admin/config',
    icon: Settings
  },
  {
    title: 'Research',
    href: '/admin/research',
    icon: Search
  },
  {
    title: 'Grievance',
    href: '/admin/grievance',
    icon: MessageSquare
  },
  {
    title: 'Admission',
    href: '/admin/admission',
    icon: GraduationCap
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dynamic Builders', 'Content Sections'])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0
    const isActive = item.href === pathname

    return (
      <div key={item.title} className="mb-1">
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              'flex items-center px-3 py-2.5 text-sm rounded-md transition-colors',
              'hover:bg-white hover:bg-opacity-10',
              level > 0 && 'ml-6',
              isActive && 'bg-white bg-opacity-20 text-white font-medium'
            )}
          >
            <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        ) : (
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'flex items-center w-full px-3 py-2.5 text-sm rounded-md transition-colors',
              'hover:bg-white hover:bg-opacity-10',
              level > 0 && 'ml-6'
            )}
          >
            <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="truncate flex-1 text-left">{item.title}</span>
            {hasChildren && (
              <div className="ml-auto">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            )}
          </button>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-64 bg-sidebar-bg text-white h-full flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white border-opacity-10">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <Layers className="w-5 h-5 text-sidebar-bg" />
          </div>
          <div className="ml-3">
            <div className="text-lg font-semibold">Dynamic CMS</div>
            <div className="text-xs opacity-75">Multi-Tenant Builder</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-white border-opacity-10">
        <div className="text-xs font-semibold text-white opacity-75 mb-2">QUICK START</div>
        <div className="space-y-1">
          <Link
            href="/admin/html-import"
            className="flex items-center text-xs py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Code className="w-3 h-3 mr-2" />
            Import HTML/CSS
          </Link>
          <Link
            href="/admin/builder"
            className="flex items-center text-xs py-2 px-3 rounded-md bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <Layers className="w-3 h-3 mr-2" />
            Dynamic Builder
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </nav>
      </div>

      {/* Search */}
      <div className="p-4 border-t border-white border-opacity-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Type here to search"
            className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-10 rounded-md text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-20"
          />
        </div>
      </div>
    </div>
  )
}
