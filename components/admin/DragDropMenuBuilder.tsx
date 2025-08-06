'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Settings, 
  Menu as MenuIcon, 
  GripVertical, 
  Edit, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  Save,
  ExternalLink,
  FileText,
  X,
  Search,
  Eye,
  EyeOff
} from 'lucide-react'
import { useMenuStore, type Menu, type MenuItem } from '@/lib/stores/menu-store'
import { usePageStore, type Page } from '@/lib/stores/page-store'

interface DragState {
  isDragging: boolean
  draggedItem: MenuItem | null
  dragOverId: string | null
  dragPosition: 'before' | 'after' | 'inside' | null
}

export default function DragDropMenuBuilder() {
  const { 
    menus, 
    currentMenu, 
    setCurrentMenu, 
    createMenu, 
    updateMenu, 
    deleteMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenuItems
  } = useMenuStore()

  const { pages } = usePageStore()

  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showPageSelector, setShowPageSelector] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [pageSearch, setPageSearch] = useState('')
  const [addToParentId, setAddToParentId] = useState<string | null>(null)
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverId: null,
    dragPosition: null
  })

  const dragTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize with a default menu if none exist
  useEffect(() => {
    if (menus.length === 0) {
      const defaultMenu = createMenu('Main Navigation', 'header')
      setCurrentMenu(defaultMenu)
    } else if (!currentMenu) {
      setCurrentMenu(menus[0])
    }
  }, [menus, currentMenu, createMenu, setCurrentMenu])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleAddPageToMenu = (page: Page, parentId?: string) => {
    if (!currentMenu) return

    const newItem = {
      label: page.title,
      url: `/pages/${page.slug}`,
      type: 'page' as const,
      pageId: page.id,
      target: '_self' as const,
      isVisible: true
    }

    addMenuItem(currentMenu.id, newItem, parentId || addToParentId || undefined)
    setShowPageSelector(false)
    setPageSearch('')
    setAddToParentId(null)
  }

  const handleAddCustomItem = (item: Omit<MenuItem, 'id' | 'order'>) => {
    if (!currentMenu) return
    addMenuItem(currentMenu.id, item, addToParentId || undefined)
    setShowAddItem(false)
    setAddToParentId(null)
  }

  const handleUpdateItem = (item: MenuItem, updates: Partial<MenuItem>) => {
    if (!currentMenu) return
    updateMenuItem(currentMenu.id, item.id, updates)
    setEditingItem(null)
  }

  const handleDeleteItem = (itemId: string) => {
    if (!currentMenu) return
    if (confirm('Are you sure you want to delete this menu item?')) {
      deleteMenuItem(currentMenu.id, itemId)
    }
  }

  const handleAddSubMenuItem = (parentId: string) => {
    setAddToParentId(parentId)
    setShowPageSelector(true)
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, item: MenuItem) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      dragOverId: null,
      dragPosition: null
    })
    
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', item.id)
    
    // Add a subtle visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverId: null,
      dragPosition: null
    })

    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
  }

  const handleDragOver = (e: React.DragEvent, targetItem: MenuItem) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (!dragState.draggedItem || dragState.draggedItem.id === targetItem.id) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height

    let position: 'before' | 'after' | 'inside'

    // Adjust thresholds for better repositioning - smaller "inside" zone for sub-menus
    if (y < height * 0.3) {
      position = 'before'
    } else if (y > height * 0.7) {
      position = 'after'
    } else {
      position = 'inside'
    }

    setDragState(prev => ({
      ...prev,
      dragOverId: targetItem.id,
      dragPosition: position
    }))
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Clear drag state after a short delay to handle quick mouse movements
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
    
    dragTimeoutRef.current = setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        dragOverId: null,
        dragPosition: null
      }))
    }, 100)
  }

  const handleDrop = (e: React.DragEvent, targetItem: MenuItem) => {
    e.preventDefault()

    if (!currentMenu || !dragState.draggedItem || !dragState.dragPosition) {
      return
    }

    const draggedItem = dragState.draggedItem
    const position = dragState.dragPosition

    // Reorganize items based on drag position
    const newItems = reorganizeItems(currentMenu.items, draggedItem, targetItem, position)

    reorderMenuItems(currentMenu.id, newItems)
  }

  const reorganizeItems = (
    items: MenuItem[],
    draggedItem: MenuItem,
    targetItem: MenuItem,
    position: 'before' | 'after' | 'inside'
  ): MenuItem[] => {
    if (position === 'inside') {
      // Add as child to target item - preserve existing hierarchy
      return addItemAsChild(items, draggedItem, targetItem.id)
    } else {
      // Reorder items at the same level
      return reorderItemsAtLevel(items, draggedItem, targetItem, position)
    }
  }

  const addItemAsChild = (items: MenuItem[], draggedItem: MenuItem, parentId: string): MenuItem[] => {
    // Remove dragged item from its current position
    const removeFromItems = (itemList: MenuItem[]): MenuItem[] => {
      return itemList.filter(item => {
        if (item.id === draggedItem.id) {
          return false
        }
        if (item.children) {
          item.children = removeFromItems(item.children)
        }
        return true
      })
    }

    // Add item as child to parent
    const addToParent = (itemList: MenuItem[]): MenuItem[] => {
      return itemList.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children || []), { ...draggedItem, children: [] }]
          }
        }
        if (item.children) {
          return {
            ...item,
            children: addToParent(item.children)
          }
        }
        return item
      })
    }

    const itemsWithoutDragged = removeFromItems(items)
    return addToParent(itemsWithoutDragged)
  }

  const reorderItemsAtLevel = (
    items: MenuItem[],
    draggedItem: MenuItem,
    targetItem: MenuItem,
    position: 'before' | 'after'
  ): MenuItem[] => {
    // Remove dragged item from its current position recursively
    const removeFromLevel = (itemList: MenuItem[]): MenuItem[] => {
      return itemList.filter(item => {
        if (item.id === draggedItem.id) {
          return false
        }
        if (item.children) {
          item.children = removeFromLevel(item.children)
        }
        return true
      })
    }

    // Add item to the target level at the correct position
    const addToLevel = (itemList: MenuItem[]): MenuItem[] => {
      // Check if this is the target level
      const targetExists = itemList.some(item => item.id === targetItem.id)

      if (targetExists) {
        // Find target position and insert dragged item
        const targetIndex = itemList.findIndex(item => item.id === targetItem.id)
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1

        const newList = [...itemList]
        newList.splice(insertIndex, 0, { ...draggedItem, children: draggedItem.children || [] })
        return newList
      } else {
        // Recursively check children
        return itemList.map(item => ({
          ...item,
          children: item.children ? addToLevel(item.children) : []
        }))
      }
    }

    const itemsWithoutDragged = removeFromLevel(items)
    return addToLevel(itemsWithoutDragged)
  }

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
    page.slug.toLowerCase().includes(pageSearch.toLowerCase())
  )

  const getDragOverStyle = (itemId: string) => {
    if (dragState.dragOverId === itemId && dragState.dragPosition) {
      const baseStyle = "transition-all duration-150"
      switch (dragState.dragPosition) {
        case 'before':
          return `${baseStyle} border-t-4 border-blue-500 shadow-lg`
        case 'after':
          return `${baseStyle} border-b-4 border-blue-500 shadow-lg`
        case 'inside':
          return `${baseStyle} bg-blue-50 border-2 border-blue-400 border-dashed shadow-md`
        default:
          return baseStyle
      }
    }
    return ""
  }

  const renderMenuItem = (item: MenuItem, index: number, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const isEditing = editingItem?.id === item.id
    const isDraggedOver = dragState.dragOverId === item.id

    return (
      <div key={item.id} className="mb-2">
        <div 
          className={`flex items-center p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-move ${getDragOverStyle(item.id)}`}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, item)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item)}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="mr-3 text-gray-400 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5" />
          </div>
          
          {isEditing ? (
            <EditItemForm
              item={item}
              onSave={(updates) => handleUpdateItem(item, updates)}
              onCancel={() => setEditingItem(null)}
            />
          ) : (
            <>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{item.label}</span>
                    <span className="text-sm text-gray-500">({item.url})</span>
                    
                    {/* Type indicators */}
                    <div className="flex items-center space-x-1">
                      {item.type === 'page' && (
                        <FileText className="w-3 h-3 text-blue-500" title="Page" />
                      )}
                      {item.type === 'external' && (
                        <ExternalLink className="w-3 h-3 text-green-500" title="External Link" />
                      )}
                      {!item.isVisible && (
                        <EyeOff className="w-3 h-3 text-red-500" title="Hidden" />
                      )}
                    </div>
                    
                    {hasChildren && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {item.children!.length} subitems
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {hasChildren && (
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => updateMenuItem(currentMenu!.id, item.id, { isVisible: !item.isVisible })}
                      className={`p-1 transition-colors ${
                        item.isVisible 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-red-600 hover:text-red-700'
                      }`}
                      title={item.isVisible ? 'Hide item' : 'Show item'}
                    >
                      {item.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleAddSubMenuItem(item.id)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Add submenu item"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Children items */}
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {item.children!.map((child, childIndex) => 
              renderMenuItem(child, childIndex, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  if (!currentMenu) {
    return <div className="text-center py-8">Loading menu builder...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          <p className="text-gray-600 mt-1">Drag and drop menu items to reorder or create sub-menus</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              setAddToParentId(null)
              setShowPageSelector(true)
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Add Page
          </button>
          <button 
            onClick={() => {
              setAddToParentId(null)
              setShowAddItem(true)
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Item
          </button>
          <button 
            onClick={() => setShowCreateMenu(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <MenuIcon className="w-4 h-4 mr-2" />
            New Menu
          </button>
        </div>
      </div>

      {/* Menu Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Menu: {currentMenu.name}</h3>
            <p className="text-sm text-gray-600">Location: {currentMenu.location} • {currentMenu.items.length} items</p>
          </div>
          
          {menus.length > 1 && (
            <select
              value={currentMenu.id}
              onChange={(e) => {
                const selectedMenu = menus.find(m => m.id === e.target.value)
                if (selectedMenu) setCurrentMenu(selectedMenu)
              }}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              {menus.map(menu => (
                <option key={menu.id} value={menu.id}>
                  {menu.name} ({menu.location})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Menu Structure */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Menu Structure</h3>
          <div className="text-sm text-gray-500 flex items-center space-x-4">
            <span>🔀 Drag up/down to reorder • Drag to middle for sub-menus</span>
            <span>👁️ Toggle visibility</span>
            <span>➕ Add sub-items</span>
          </div>
        </div>

        {currentMenu.items.length > 0 ? (
          <div className="space-y-2">
            {currentMenu.items.map((item, index) => renderMenuItem(item, index))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MenuIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items</h3>
            <p className="text-gray-600 mb-6">Start building your menu by adding pages or custom items.</p>
            <div className="flex items-center justify-center space-x-3">
              <button 
                onClick={() => {
                  setAddToParentId(null)
                  setShowPageSelector(true)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Add Pages
              </button>
              <button 
                onClick={() => {
                  setAddToParentId(null)
                  setShowAddItem(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Custom Item
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menu Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Menu Name</label>
            <input
              type="text"
              value={currentMenu.name}
              onChange={(e) => updateMenu(currentMenu.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Menu Location</label>
            <select 
              value={currentMenu.location}
              onChange={(e) => updateMenu(currentMenu.id, { location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="header">Header Navigation</option>
              <option value="footer">Footer Navigation</option>
              <option value="sidebar">Sidebar Navigation</option>
              <option value="mobile">Mobile Navigation</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this menu?')) {
                deleteMenu(currentMenu.id)
              }
            }}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
          >
            Delete Menu
          </button>
          <div className="text-sm text-gray-600">
            Menu will be automatically available in NavigationMenu components
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPageSelector && (
        <PageSelectorModal
          pages={filteredPages}
          searchTerm={pageSearch}
          onSearchChange={setPageSearch}
          onSelectPage={handleAddPageToMenu}
          onClose={() => {
            setShowPageSelector(false)
            setPageSearch('')
            setAddToParentId(null)
          }}
          isAddingToParent={!!addToParentId}
        />
      )}

      {showAddItem && (
        <AddItemModal
          onAdd={handleAddCustomItem}
          onClose={() => {
            setShowAddItem(false)
            setAddToParentId(null)
          }}
          isAddingToParent={!!addToParentId}
        />
      )}

      {showCreateMenu && (
        <CreateMenuModal
          onClose={() => setShowCreateMenu(false)}
        />
      )}
    </div>
  )
}

// Component definitions for modals and forms
function PageSelectorModal({ 
  pages, 
  searchTerm, 
  onSearchChange, 
  onSelectPage, 
  onClose,
  isAddingToParent = false
}: {
  pages: Page[]
  searchTerm: string
  onSearchChange: (term: string) => void
  onSelectPage: (page: Page) => void
  onClose: () => void
  isAddingToParent?: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isAddingToParent ? 'Select Pages to Add as Sub-menu' : 'Select Pages to Add'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {pages.length > 0 ? (
            <div className="space-y-2">
              {pages.map(page => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectPage(page)}
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">{page.title}</div>
                      <div className="text-sm text-gray-500">/{page.slug}</div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    page.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {page.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No pages found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddItemModal({ onAdd, onClose, isAddingToParent = false }: {
  onAdd: (item: Omit<MenuItem, 'id' | 'order'>) => void
  onClose: () => void
  isAddingToParent?: boolean
}) {
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<'custom' | 'external'>('custom')
  const [target, setTarget] = useState<'_self' | '_blank'>('_self')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (label.trim() && url.trim()) {
      onAdd({
        label: label.trim(),
        url: url.trim(),
        type,
        target,
        isVisible: true
      })
      setLabel('')
      setUrl('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isAddingToParent ? 'Add Custom Sub-menu Item' : 'Add Custom Menu Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Menu item label"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="/page-url or https://external-site.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'custom' | 'external')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="custom">Custom Link</option>
                <option value="external">External Link</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as '_self' | '_blank')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="_self">Same Tab</option>
                <option value="_blank">New Tab</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateMenuModal({ onClose }: { onClose: () => void }) {
  const { createMenu, setCurrentMenu } = useMenuStore()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('header')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      const newMenu = createMenu(name.trim(), location)
      setCurrentMenu(newMenu)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Menu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Menu Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Navigation"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="header">Header Navigation</option>
              <option value="footer">Footer Navigation</option>
              <option value="sidebar">Sidebar Navigation</option>
              <option value="mobile">Mobile Navigation</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditItemForm({ 
  item, 
  onSave, 
  onCancel 
}: {
  item: MenuItem
  onSave: (updates: Partial<MenuItem>) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(item.label)
  const [url, setUrl] = useState(item.url)
  const [target, setTarget] = useState(item.target || '_self')
  const [isVisible, setIsVisible] = useState(item.isVisible)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ label, url, target, isVisible })
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          placeholder="Label"
        />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          placeholder="URL"
        />
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as '_self' | '_blank')}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="_self">Same Tab</option>
          <option value="_blank">New Tab</option>
        </select>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
            className="mr-1"
          />
          Visible
        </label>
        <div className="flex items-center space-x-2">
          <button
            type="submit"
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            <Save className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </form>
  )
}
