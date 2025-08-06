'use client'

import { useState, useEffect } from 'react'
import { Puck, Render } from "@measured/puck"
import { config, initialData } from "@/lib/puck-config"
import { usePageStore } from "@/lib/stores/page-store"
import type { Data } from "@measured/puck"
import {
  Save,
  Eye,
  Globe,
  Settings,
  ArrowLeft,
  FileText,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface PuckEditorProps {
  pageId?: string
  onSave?: (data: Data) => void
  onPublish?: () => void
}

export default function PuckEditor({ pageId, onSave, onPublish }: PuckEditorProps) {
  const { currentPage, updatePage, savePageData, publishPage } = usePageStore()
  const [data, setData] = useState<Data>(currentPage?.data || initialData)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    if (currentPage) {
      setData(currentPage.data)
      setHasUnsavedChanges(false)
    }
  }, [currentPage])

  // Keyboard shortcuts for preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + P for preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setActiveTab('preview')
      }
      // Escape to exit preview
      if (e.key === 'Escape' && activeTab === 'preview') {
        setActiveTab('editor')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  const handleSave = async () => {
    if (currentPage) {
      try {
        savePageData(currentPage.id, data)
        setHasUnsavedChanges(false)
        onSave?.(data)
        
        // Show brief success indication
        setTimeout(() => {
          // Visual feedback could go here
        }, 500)
      } catch (error) {
        console.error('Failed to save page:', error)
        alert('Failed to save page. Please try again.')
      }
    }
  }

  const handlePublish = async () => {
    if (currentPage) {
      setIsPublishing(true)
      try {
        // First save the current data
        savePageData(currentPage.id, data)
        
        // Then publish the page
        publishPage(currentPage.id)
        
        setHasUnsavedChanges(false)
        setShowPublishSuccess(true)
        onPublish?.()
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowPublishSuccess(false)
        }, 3000)
        
      } catch (error) {
        console.error('Failed to publish page:', error)
        alert('Failed to publish page. Please try again.')
      } finally {
        setIsPublishing(false)
      }
    }
  }

  const handleDataChange = (newData: Data) => {
    setData(newData)
    setHasUnsavedChanges(true)
  }

  const getViewportClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-sm mx-auto'
      case 'tablet':
        return 'max-w-2xl mx-auto'
      default:
        return 'w-full'
    }
  }

  const renderPreview = () => {
    return (
      <div className={`bg-white border border-gray-200 ${getViewportClass()}`}>
        <Render config={config} data={data} />
      </div>
    )
  }




  return (
    <div className="h-screen flex flex-col">
      {/* Success Message */}
      {showPublishSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-0">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <p className="text-green-700">
              Page published successfully! It's now live at{' '}
              <a 
                href={`/pages/${currentPage?.slug}`}
                target="_blank"
                className="underline hover:text-green-800"
              >
                /pages/{currentPage?.slug}
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Editor Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
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
                <span className="text-sm text-amber-600">• Unsaved changes</span>
              )}
              {currentPage?.isPublished && !hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  <Globe className="w-3 h-3 mr-1" />
                  Published
                </span>
              )}
              <span className="text-xs text-gray-400 hidden lg:inline">
                • Press Ctrl+P to preview
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Device Switcher for Preview */}
            {activeTab === 'preview' && (
              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewport('desktop')}
                  className={`p-2 rounded transition-colors ${viewport === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  className={`p-2 rounded transition-colors ${viewport === 'tablet' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  className={`p-2 rounded transition-colors ${viewport === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => window.open(`/pages/${currentPage?.slug}`, '_blank')}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Live
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                hasUnsavedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
            
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
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

      {/* Tabs */}
      <div className="bg-gray-50 border-b border-gray-200 px-4">
        <div className="flex space-x-1">
          {[
            { id: 'editor', label: 'Editor', icon: Settings },
            { id: 'preview', label: 'Preview', icon: Eye }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-t-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'editor' ? (
          <Puck
            config={config}
            data={data}
            onPublish={handlePublish}
            onChange={handleDataChange}
          />
        ) : (
          <div className="h-full overflow-auto bg-gray-100 p-4">
            {renderPreview()}
          </div>
        )}
      </div>
    </div>
  )
}
