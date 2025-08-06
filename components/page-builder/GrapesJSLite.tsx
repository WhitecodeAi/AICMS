'use client'

import { useEffect, useRef, useState } from 'react'
import { usePageStore } from '@/lib/stores/page-store'
import { 
  Save, 
  Eye, 
  Globe, 
  ArrowLeft, 
  FileText,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle,
  Code,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface GrapesJSLiteProps {
  pageId?: string
  onSave?: (html: string, css: string) => void
  onPublish?: () => void
}

export default function GrapesJSLite({ pageId, onSave, onPublish }: GrapesJSLiteProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState('Initializing...')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const { currentPage, savePageHTML, publishPage } = usePageStore()

  useEffect(() => {
    const loadGrapesJS = async () => {
      try {
        setLoadingStep('Loading GrapesJS core...')
        
        // Load only core GrapesJS without heavy plugins
        const grapesjs = (await import('grapesjs')).default
        
        setLoadingStep('Configuring editor...')

        if (editorRef.current) {
          const editorInstance = grapesjs.init({
            container: editorRef.current,
            height: '100vh',
            width: 'auto',
            fromElement: false,
            canvas: {
              styles: [
                'https://cdn.tailwindcss.com'
              ]
            },
            blockManager: {
              appendTo: '.blocks-container',
              blocks: [
                {
                  id: 'section',
                  label: 'Section',
                  content: '<section class="py-16 px-4"><div class="max-w-6xl mx-auto"><h2 class="text-3xl font-bold text-center mb-8">Section Title</h2><p class="text-lg text-center text-gray-600">Add your content here</p></div></section>',
                  category: 'Basic'
                },
                {
                  id: 'hero',
                  label: 'Hero',
                  content: `
                    <section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-24 px-4">
                      <div class="max-w-4xl mx-auto text-center">
                        <h1 class="text-5xl font-bold mb-6">Welcome to Our Website</h1>
                        <p class="text-xl mb-8 opacity-90">Create amazing experiences</p>
                        <a href="#" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Get Started</a>
                      </div>
                    </section>
                  `,
                  category: 'Sections'
                },
                {
                  id: 'text',
                  label: 'Text',
                  content: '<div class="text-block"><p>Insert your text here</p></div>',
                  category: 'Basic'
                },
                {
                  id: 'image',
                  label: 'Image',
                  content: '<img src="https://via.placeholder.com/400x300" alt="Image" class="max-w-full h-auto">',
                  category: 'Basic'
                },
                {
                  id: 'button',
                  label: 'Button',
                  content: '<a href="#" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">Button</a>',
                  category: 'Basic'
                },
                {
                  id: 'columns',
                  label: '2 Columns',
                  content: `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div class="column"><p>Column 1 content</p></div>
                      <div class="column"><p>Column 2 content</p></div>
                    </div>
                  `,
                  category: 'Layout'
                },
                {
                  id: 'features',
                  label: 'Features',
                  content: `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
                      <div class="text-center">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span class="text-blue-600 text-2xl">🚀</span>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Feature 1</h3>
                        <p class="text-gray-600">Description here</p>
                      </div>
                      <div class="text-center">
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span class="text-green-600 text-2xl">⚡</span>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Feature 2</h3>
                        <p class="text-gray-600">Description here</p>
                      </div>
                      <div class="text-center">
                        <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span class="text-purple-600 text-2xl">🎯</span>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Feature 3</h3>
                        <p class="text-gray-600">Description here</p>
                      </div>
                    </div>
                  `,
                  category: 'Sections'
                }
              ]
            },
            deviceManager: {
              devices: [{
                name: 'Desktop',
                width: '',
              }, {
                name: 'Tablet',
                width: '768px',
                widthMedia: '992px',
              }, {
                name: 'Mobile',
                width: '320px',
                widthMedia: '768px',
              }]
            },
            panels: {
              defaults: [
                {
                  id: 'basic-actions',
                  el: '.panel-actions',
                  buttons: [
                    {
                      id: 'visibility',
                      active: true,
                      className: 'btn-toggle-borders',
                      label: '<i class="fa fa-clone"></i>',
                      command: 'sw-visibility',
                    },
                    {
                      id: 'export',
                      className: 'btn-open-export',
                      label: '<i class="fa fa-code"></i>',
                      command: 'export-template',
                      context: 'export-template',
                    },
                    {
                      id: 'show-json',
                      className: 'btn-show-json',
                      label: '<i class="fa fa-download"></i>',
                      context: 'show-json',
                      command: 'show-json',
                    }
                  ],
                },
                {
                  id: 'panel-devices',
                  el: '.panel-devices',
                  buttons: [{
                    id: 'device-desktop',
                    label: '<i class="fa fa-desktop"></i>',
                    command: 'set-device-desktop',
                    active: true,
                  }, {
                    id: 'device-tablet',
                    label: '<i class="fa fa-tablet"></i>',
                    command: 'set-device-tablet',
                  }, {
                    id: 'device-mobile',
                    label: '<i class="fa fa-mobile"></i>',
                    command: 'set-device-mobile',
                  }],
                }
              ]
            },
            layerManager: {
              appendTo: '.layers-container'
            },
            styleManager: {
              appendTo: '.styles-container',
              sectors: [{
                name: 'Dimension',
                open: false,
                buildProps: ['width', 'min-height', 'padding'],
              }, {
                name: 'Typography',
                open: false,
                buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height'],
              }, {
                name: 'Decorations',
                open: false,
                buildProps: ['opacity', 'border-radius', 'border', 'box-shadow', 'background'],
              }, {
                name: 'Extra',
                open: false,
                buildProps: ['transition', 'perspective', 'transform'],
              }]
            },
            traitManager: {
              appendTo: '.traits-container',
            }
          })

          setLoadingStep('Loading content...')

          // Load existing page content
          if (currentPage) {
            if (currentPage.html && currentPage.css) {
              editorInstance.setComponents(currentPage.html)
              editorInstance.setStyle(currentPage.css)
            } else if (currentPage.data && typeof currentPage.data === 'object') {
              if (currentPage.data.html && currentPage.data.css) {
                editorInstance.setComponents(currentPage.data.html)
                editorInstance.setStyle(currentPage.data.css)
              }
            }
          }

          // Add custom commands
          editorInstance.Commands.add('show-json', {
            run: (editor: any) => {
              editor.Modal.setTitle('Components JSON')
                .setContent(`<textarea style="width:100%; height: 250px;">${JSON.stringify(editor.getComponents())}</textarea>`)
                .open();
            }
          });

          // Track changes
          let changeTimeout: NodeJS.Timeout
          editorInstance.on('component:add component:remove component:update style:update', () => {
            clearTimeout(changeTimeout)
            changeTimeout = setTimeout(() => {
              setHasUnsavedChanges(true)
            }, 500)
          })

          setEditor(editorInstance)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to load GrapesJS:', error)
        setLoadingStep('Failed to load editor')
        setIsLoading(false)
      }
    }

    loadGrapesJS()

    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [currentPage])

  const handleSave = async () => {
    if (editor && currentPage) {
      setIsSaving(true)
      try {
        const html = editor.getHtml()
        const css = editor.getCss()
        
        savePageHTML(currentPage.id, html, css)
        setHasUnsavedChanges(false)
        onSave?.(html, css)
      } catch (error) {
        console.error('Failed to save page:', error)
        alert('Failed to save page. Please try again.')
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handlePublish = async () => {
    if (editor && currentPage) {
      setIsPublishing(true)
      try {
        await handleSave()
        publishPage(currentPage.id)
        setShowPublishSuccess(true)
        onPublish?.()
        setTimeout(() => setShowPublishSuccess(false), 5000)
      } catch (error) {
        console.error('Failed to publish page:', error)
        alert('Failed to publish page. Please try again.')
      } finally {
        setIsPublishing(false)
      }
    }
  }

  const handlePreview = () => {
    if (editor) {
      const html = editor.getHtml()
      const css = editor.getCss()
      const previewContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Preview - ${currentPage?.title || 'Page'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>${css}</style>
          </head>
          <body>${html}</body>
        </html>
      `
      
      const previewWindow = window.open('', '_blank', 'width=1200,height=800')
      if (previewWindow) {
        previewWindow.document.write(previewContent)
        previewWindow.document.close()
      }
    }
  }

  const handleDeviceChange = (device: string) => {
    if (editor) {
      editor.setDevice(device)
      setViewport(device.toLowerCase() as any)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Visual Editor</p>
          <p className="text-sm text-gray-500 mt-2">{loadingStep}</p>
          <div className="mt-4 text-xs text-gray-400">
            This is much faster than the full GrapesJS version!
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Success Message */}
      {showPublishSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 z-10">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <p className="text-green-700">
              🎉 Page published! View at{' '}
              <a 
                href={`/pages/${currentPage?.slug}`}
                target="_blank"
                className="underline hover:text-green-800 font-medium"
              >
                /{currentPage?.slug}
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/pages"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <h1 className="text-lg font-semibold text-gray-900">
                {currentPage?.title || 'Untitled Page'}
              </h1>
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 animate-pulse">• Unsaved</span>
              )}
              {currentPage?.isPublished && !hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  <Globe className="w-3 h-3 mr-1" />
                  Live
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Device Switcher */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => handleDeviceChange('Desktop')}
                className={`p-2 rounded ${viewport === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeviceChange('Tablet')}
                className={`p-2 rounded ${viewport === 'tablet' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeviceChange('Mobile')}
                className={`p-2 rounded ${viewport === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handlePreview}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`flex items-center px-4 py-2 rounded-lg ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </button>
            
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`flex items-center px-4 py-2 rounded-lg text-white ${
                isPublishing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex">
        {/* Blocks */}
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">Components</h3>
            <div className="blocks-container"></div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <div ref={editorRef} className="h-full" />
        </div>

        {/* Properties */}
        <div className="w-80 border-l border-gray-200 bg-gray-50">
          <div className="layers-container h-1/3 p-4 border-b">
            <h3 className="text-sm font-semibold mb-3">Layers</h3>
          </div>
          <div className="styles-container h-1/3 p-4 border-b">
            <h3 className="text-sm font-semibold mb-3">Styles</h3>
          </div>
          <div className="traits-container h-1/3 p-4">
            <h3 className="text-sm font-semibold mb-3">Settings</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
