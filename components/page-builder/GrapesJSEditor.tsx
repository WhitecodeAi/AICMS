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
  Download,
  Upload,
  Settings,
  Code,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

declare global {
  interface Window {
    grapesjs: any
  }
}

interface GrapesJSEditorProps {
  pageId?: string
  onSave?: (html: string, css: string) => void
  onPublish?: () => void
}

export default function GrapesJSEditor({ pageId, onSave, onPublish }: GrapesJSEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  
  const { currentPage, updatePage, savePageHTML, publishPage } = usePageStore()

  useEffect(() => {
    const loadGrapesJS = async () => {
      try {
        // Dynamically import GrapesJS and plugins
        const grapesjs = (await import('grapesjs')).default
        const gjsPresetWebpage = (await import('grapesjs-preset-webpage')).default as any
        const gjsBlocksBasic = (await import('grapesjs-blocks-basic')).default as any
        const gjsPluginForms = (await import('grapesjs-plugin-forms')).default as any
        const gjsPluginExport = (await import('grapesjs-plugin-export')).default as any
        const gjsTabs = (await import('grapesjs-tabs')).default as any
        const gjsCustomCode = (await import('grapesjs-custom-code')).default as any
        const gjsStyleBg = (await import('grapesjs-style-bg')).default as any

        if (editorRef.current) {
          const editorInstance = grapesjs.init({
            container: editorRef.current,
            height: '100vh',
            width: 'auto',
            plugins: [
              gjsPresetWebpage,
              gjsBlocksBasic,
              gjsPluginForms,
              gjsPluginExport,
              gjsTabs,
              gjsCustomCode,
              gjsStyleBg
            ],
            pluginsOpts: {
              [gjsPresetWebpage]: {
                modalImportTitle: 'Import Template',
                modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Paste here your HTML/CSS and click Import</div>',
                modalImportContent: function(editor: any) {
                  return editor.getHtml() + '<style>' + editor.getCss() + '</style>'
                }
              },
              [gjsBlocksBasic]: {},
              [gjsPluginForms]: {},
              [gjsPluginExport]: {},
              [gjsTabs]: {},
              [gjsCustomCode]: {},
              [gjsStyleBg]: {}
            },
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
                  label: '<i class="fa fa-square-o"></i><div>Section</div>',
                  attributes: { class: 'gjs-block-section' },
                  content: '<section class="py-16 px-4"><div class="max-w-6xl mx-auto"><h2 class="text-3xl font-bold text-center mb-8">Section Title</h2><p class="text-lg text-center text-gray-600">Add your content here</p></div></section>'
                },
                {
                  id: 'hero',
                  label: '<i class="fa fa-star"></i><div>Hero Section</div>',
                  content: `
                    <section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-24 px-4">
                      <div class="max-w-4xl mx-auto text-center">
                        <h1 class="text-5xl font-bold mb-6">Welcome to Our Website</h1>
                        <p class="text-xl mb-8 opacity-90">Create amazing experiences with our page builder</p>
                        <a href="#" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Get Started</a>
                      </div>
                    </section>
                  `
                },
                {
                  id: 'card',
                  label: '<i class="fa fa-credit-card"></i><div>Card</div>',
                  content: `
                    <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <h3 class="text-xl font-semibold mb-3">Card Title</h3>
                      <p class="text-gray-600 mb-4">Card description goes here. Add your content and customize as needed.</p>
                      <a href="#" class="text-blue-600 hover:text-blue-800 font-medium">Learn more →</a>
                    </div>
                  `
                },
                {
                  id: 'grid-3',
                  label: '<i class="fa fa-th"></i><div>3 Columns</div>',
                  content: `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
                      <div class="text-center">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span class="text-blue-600 text-2xl">🚀</span>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Feature 1</h3>
                        <p class="text-gray-600">Description of your first feature</p>
                      </div>
                      <div class="text-center">
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span class="text-green-600 text-2xl">⚡</span>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Feature 2</h3>
                        <p class="text-gray-600">Description of your second feature</p>
                      </div>
                      <div class="text-center">
                        <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span class="text-purple-600 text-2xl">🎯</span>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Feature 3</h3>
                        <p class="text-gray-600">Description of your third feature</p>
                      </div>
                    </div>
                  `
                },
                {
                  id: 'contact-form',
                  label: '<i class="fa fa-envelope"></i><div>Contact Form</div>',
                  content: `
                    <div class="bg-gray-50 p-8 rounded-lg">
                      <h3 class="text-2xl font-bold mb-6 text-center">Contact Us</h3>
                      <form class="max-w-lg mx-auto space-y-4">
                        <div>
                          <input type="text" placeholder="Your Name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                          <input type="email" placeholder="Your Email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                          <textarea placeholder="Your Message" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                        <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Send Message</button>
                      </form>
                    </div>
                  `
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
                  id: 'layers',
                  el: '.panel__right',
                  resizable: {
                    maxDim: 350,
                    minDim: 200,
                    tc: false,
                    cl: true,
                    cr: false,
                    bc: false,
                    keyWidth: 'flex-basis',
                  },
                },
                {
                  id: 'panel-switcher',
                  el: '.panel__switcher',
                  buttons: [{
                    id: 'show-layers',
                    active: true,
                    label: 'Layers',
                    command: 'show-layers',
                    togglable: false,
                  }, {
                    id: 'show-style',
                    active: true,
                    label: 'Styles',
                    command: 'show-styles',
                    togglable: false,
                  }, {
                    id: 'show-traits',
                    active: true,
                    label: 'Settings',
                    command: 'show-traits',
                    togglable: false,
                  }],
                }
              ]
            },
            layerManager: {
              appendTo: '.layers-container'
            },
            selectorManager: {
              appendTo: '.styles-container'
            },
            styleManager: {
              appendTo: '.styles-container',
              sectors: [{
                name: 'Dimension',
                open: false,
                buildProps: ['width', 'min-height', 'padding'],
                properties: [{
                  type: 'integer',
                  name: 'The width',
                  property: 'width',
                  units: ['px', '%'],
                  defaults: 'auto',
                  min: 0,
                }]
              }, {
                name: 'Extra',
                open: false,
                buildProps: ['background-color', 'box-shadow', 'custom-prop'],
                properties: [{
                  id: 'custom-prop',
                  name: 'Custom Label',
                  property: 'font-size',
                  type: 'select',
                  defaults: '32px',
                  options: [
                    { id: 'tiny', value: '12px', name: 'Tiny' },
                    { id: 'medium', value: '18px', name: 'Medium' },
                    { id: 'big', value: '32px', name: 'Big' },
                  ],
                }]
              }]
            },
            traitManager: {
              appendTo: '.traits-container',
            }
          })

          // Load existing page content if available
          if (currentPage) {
            if (currentPage.html && currentPage.css) {
              // Load from HTML/CSS
              editorInstance.setComponents(currentPage.html)
              editorInstance.setStyle(currentPage.css)
            } else if (currentPage.data && typeof currentPage.data === 'object') {
              // Load from previous GrapesJS data
              if (currentPage.data.html && currentPage.data.css) {
                editorInstance.setComponents(currentPage.data.html)
                editorInstance.setStyle(currentPage.data.css)
              }
            }
          }

          // Track changes
          let changeTimeout: NodeJS.Timeout
          editorInstance.on('component:add component:remove component:update style:update', () => {
            clearTimeout(changeTimeout)
            changeTimeout = setTimeout(() => {
              setHasUnsavedChanges(true)
            }, 500) // Debounce to avoid too many triggers
          })

          setEditor(editorInstance)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to load GrapesJS:', error)
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
        
        console.log('Saving page data...', { pageId: currentPage.id, htmlLength: html.length, cssLength: css.length })
        
        const pageData = {
          html,
          css,
          components: editor.getComponents(),
          styles: editor.getStyles()
        }
        
        savePageHTML(currentPage.id, html, css)
        setHasUnsavedChanges(false)
        onSave?.(html, css)
        
        // Show brief success feedback
        setTimeout(() => {
          console.log('Page saved successfully')
        }, 500)
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
        console.log('Publishing page...', currentPage.id)
        
        // First save the current data
        await handleSave()
        
        // Then publish the page
        publishPage(currentPage.id)
        
        setShowPublishSuccess(true)
        onPublish?.()
        
        console.log('Page published successfully')
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowPublishSuccess(false)
        }, 5000)
        
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

  const handleImportHTML = (html: string, css: string) => {
    if (editor) {
      editor.setComponents(html)
      editor.setStyle(css)
      setHasUnsavedChanges(true)
      setShowImportModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GrapesJS page builder...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment on first load</p>
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
              🎉 Page published successfully! View it live at{' '}
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
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/pages"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pages
            </Link>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <h1 className="text-lg font-semibold text-gray-900">
                {currentPage?.title || 'Untitled Page'}
              </h1>
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 animate-pulse">• Unsaved changes</span>
              )}
              {currentPage?.isPublished && !hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  <Globe className="w-3 h-3 mr-1" />
                  Published
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Device Switcher */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => handleDeviceChange('Desktop')}
                className={`p-2 rounded transition-colors ${viewport === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeviceChange('Tablet')}
                className={`p-2 rounded transition-colors ${viewport === 'tablet' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Tablet View"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeviceChange('Mobile')}
                className={`p-2 rounded transition-colors ${viewport === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Import HTML */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Import HTML/CSS"
            >
              <Code className="w-4 h-4 mr-2" />
              Import
            </button>

            {/* Preview */}
            <button
              onClick={handlePreview}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Preview in new window"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
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
            
            {/* Publish */}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                isPublishing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
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

      {/* Editor Content */}
      <div className="flex-1 flex">
        {/* Blocks Panel */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Components</h3>
            <div className="blocks-container"></div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 relative">
          <div ref={editorRef} className="h-full" />
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
          <div className="panel__switcher p-2 border-b border-gray-200 bg-white"></div>
          <div className="panel__right flex-1 overflow-y-auto">
            <div className="layers-container h-1/3 p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Layers</h3>
            </div>
            <div className="styles-container h-1/3 p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Styles</h3>
            </div>
            <div className="traits-container h-1/3 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Settings</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportHTMLModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportHTML}
        />
      )}
    </div>
  )
}

// Import HTML Modal Component
function ImportHTMLModal({ onClose, onImport }: {
  onClose: () => void
  onImport: (html: string, css: string) => void
}) {
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')

  const handleImport = () => {
    if (html.trim()) {
      onImport(html, css)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Import HTML/CSS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">HTML Content</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Paste your HTML here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSS Styles (optional)</label>
            <textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Paste your CSS here..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!html.trim()}
            className={`px-4 py-2 rounded-lg transition-colors ${
              html.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Import & Replace
          </button>
        </div>
      </div>
    </div>
  )
}
