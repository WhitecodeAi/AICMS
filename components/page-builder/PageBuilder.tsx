'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import {
  Type,
  Image,
  Layout,
  Columns,
  Video,
  Plus,
  Settings,
  Eye,
  Save,
  Smartphone,
  Tablet,
  Monitor,
  Trash2,
  Copy,
  Move3D
} from 'lucide-react'

interface BlockComponent {
  id: string
  type: 'text' | 'image' | 'video' | 'button' | 'columns' | 'spacer'
  content: any
  settings: any
}

interface ComponentLibraryItem {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  type: BlockComponent['type']
  defaultContent: any
  defaultSettings: any
}

const componentLibrary: ComponentLibraryItem[] = [
  {
    id: 'text',
    name: 'Text Block',
    icon: Type,
    type: 'text',
    defaultContent: { html: '<p>Enter your text here...</p>' },
    defaultSettings: { fontSize: '16px', color: '#000000' }
  },
  {
    id: 'image',
    name: 'Image',
    icon: Image,
    type: 'image',
    defaultContent: { src: '', alt: '', caption: '' },
    defaultSettings: { width: '100%', alignment: 'center' }
  },
  {
    id: 'video',
    name: 'Video',
    icon: Video,
    type: 'video',
    defaultContent: { url: '', thumbnail: '' },
    defaultSettings: { autoplay: false, controls: true }
  },
  {
    id: 'button',
    name: 'Button',
    icon: Plus,
    type: 'button',
    defaultContent: { text: 'Click me', url: '#' },
    defaultSettings: { color: '#3b82f6', size: 'medium' }
  },
  {
    id: 'columns',
    name: 'Columns',
    icon: Columns,
    type: 'columns',
    defaultContent: { columns: [{ width: '50%', content: [] }, { width: '50%', content: [] }] },
    defaultSettings: { gap: '20px' }
  }
]

export default function PageBuilder() {
  const [components, setComponents] = useState<BlockComponent[]>([])
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showSettings, setShowSettings] = useState(false)

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination } = result

    // Handle adding new component from library
    if (source.droppableId === 'component-library') {
      const newComponent = componentLibrary[source.index]
      const component: BlockComponent = {
        id: `${newComponent.type}-${Date.now()}`,
        type: newComponent.type,
        content: { ...newComponent.defaultContent },
        settings: { ...newComponent.defaultSettings }
      }

      const newComponents = [...components]
      newComponents.splice(destination.index, 0, component)
      setComponents(newComponents)
      return
    }

    // Handle reordering existing components
    if (source.droppableId === 'page-canvas' && destination.droppableId === 'page-canvas') {
      const newComponents = Array.from(components)
      const [reorderedItem] = newComponents.splice(source.index, 1)
      newComponents.splice(destination.index, 0, reorderedItem)
      setComponents(newComponents)
    }
  }

  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id))
    if (selectedComponent === id) {
      setSelectedComponent(null)
    }
  }

  const duplicateComponent = (id: string) => {
    const component = components.find(comp => comp.id === id)
    if (component) {
      const newComponent = {
        ...component,
        id: `${component.type}-${Date.now()}`
      }
      setComponents(prev => [...prev, newComponent])
    }
  }

  const renderComponent = (component: BlockComponent, index: number) => {
    const isSelected = selectedComponent === component.id

    return (
      <Draggable key={component.id} draggableId={component.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`relative group border-2 border-dashed transition-colors ${
              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
            onClick={() => setSelectedComponent(component.id)}
          >
            {/* Component Content */}
            <div className="p-4">
              {component.type === 'text' && (
                <div 
                  dangerouslySetInnerHTML={{ __html: component.content.html }}
                  style={{ fontSize: component.settings.fontSize, color: component.settings.color }}
                />
              )}
              {component.type === 'image' && (
                <div className="text-center">
                  {component.content.src ? (
                    <img 
                      src={component.content.src} 
                      alt={component.content.alt}
                      className="max-w-full h-auto"
                      style={{ width: component.settings.width }}
                    />
                  ) : (
                    <div className="bg-gray-100 h-48 flex items-center justify-center">
                      <Image className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
              {component.type === 'button' && (
                <div className="text-center">
                  <button
                    className="px-6 py-2 rounded-md text-white"
                    style={{ backgroundColor: component.settings.color }}
                  >
                    {component.content.text}
                  </button>
                </div>
              )}
              {component.type === 'video' && (
                <div className="bg-gray-100 h-48 flex items-center justify-center">
                  <Video className="w-12 h-12 text-gray-400" />
                  <span className="ml-2 text-gray-600">Video Component</span>
                </div>
              )}
            </div>

            {/* Component Controls */}
            <div 
              {...provided.dragHandleProps}
              className={`absolute -top-10 left-0 right-0 bg-gray-900 text-white px-3 py-1 text-xs flex items-center justify-between transition-opacity ${
                isSelected || snapshot.isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <div className="flex items-center">
                <Move3D className="w-3 h-3 mr-2" />
                <span className="capitalize">{component.type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    duplicateComponent(component.id)
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSettings(true)
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  <Settings className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteComponent(component.id)
                  }}
                  className="hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-screen flex bg-gray-50">
        {/* Component Library Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Components</h2>
            <p className="text-sm text-gray-600">Drag to add to page</p>
          </div>
          
          <Droppable droppableId="component-library" isDropDisabled={true}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex-1 p-4 space-y-2"
              >
                {componentLibrary.map((item, index) => (
                  <Draggable key={item.id} draggableId={`library-${item.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 border border-gray-200 rounded-md cursor-move hover:bg-gray-50 transition-colors ${
                          snapshot.isDragging ? 'shadow-lg bg-white' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className="w-5 h-5 text-gray-600 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">Page Builder</h1>
                <div className="flex items-center space-x-2 border border-gray-300 rounded-md p-1">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('tablet')}
                    className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </button>
                <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-8 bg-gray-100">
            <div className={`mx-auto bg-white min-h-96 shadow-sm ${
              previewMode === 'mobile' ? 'max-w-sm' : 
              previewMode === 'tablet' ? 'max-w-2xl' : 'max-w-6xl'
            }`}>
              <Droppable droppableId="page-canvas">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-96 p-4 ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
                    }`}
                  >
                    {components.length === 0 && (
                      <div className="text-center py-16">
                        <Layout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Start building your page</h3>
                        <p className="text-gray-600">Drag components from the left sidebar to get started.</p>
                      </div>
                    )}
                    
                    {components.map((component, index) => renderComponent(component, index))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && selectedComponent && (
          <div className="w-80 bg-white border-l border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Component Settings</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">Settings panel for component customization would go here.</p>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  )
}
