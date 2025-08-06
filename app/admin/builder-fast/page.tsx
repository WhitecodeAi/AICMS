'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePageStore } from '@/lib/stores/page-store'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import FastEditor to prevent SSR hydration issues
const FastEditor = dynamic(() => import('@/components/page-builder/FastEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading editor...</p>
      </div>
    </div>
  )
})

function FastEditorContent() {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasProcessedPageId, setHasProcessedPageId] = useState(false)
  const searchParams = useSearchParams()
  const pageId = searchParams.get('page')
  const { pages, setCurrentPage, currentPage, createPage } = usePageStore()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Effect to handle page loading based on pageId
  useEffect(() => {
    // Only run after component mounts to avoid hydration issues
    if (!isMounted) return

    // Prevent re-processing the same pageId
    if (hasProcessedPageId) return

    console.log('FastEditorContent useEffect:', { pageId, pagesCount: pages.length, currentPageId: currentPage?.id })
    setIsLoading(true)

    if (pageId) {
      const page = pages.find(p => p.id === pageId)
      if (page) {
        console.log('FastEditor: Found page:', page.title)
        if (currentPage?.id !== page.id) {
          console.log('Setting current page:', page.title)
          setCurrentPage(page)
        }
        setIsLoading(false)
        setHasProcessedPageId(true)
      } else {
        console.warn('Page not found with ID:', pageId, 'Available pages:', pages.length)
        // If page not found but we have a pageId, wait a bit for pages to load
        if (pages.length === 0) {
          console.log('No pages loaded yet, waiting for pages to load...')
          // Set a timeout to handle case where pages never load
          setTimeout(() => {
            setIsLoading(false)
            console.log('Timeout waiting for pages, redirecting to pages list')
            window.location.href = '/admin/pages'
          }, 3000)
          return
        }
        // If pages are loaded but page not found, redirect to pages list
        console.log('Page not found in loaded pages, redirecting to pages list')
        setIsLoading(false)
        window.location.href = '/admin/pages'
      }
    } else {
      // If no pageId, create a new page for the fast editor (client-side only)
      console.log('No page ID provided, creating new page for Fast Editor')
      const timestamp = Date.now()
      const newPage = createPage('New Page', `new-page-${timestamp}`, 'html')

      // Update URL to include the new page ID
      const url = new URL(window.location.href)
      url.searchParams.set('page', newPage.id)
      window.history.replaceState({}, '', url.toString())

      setIsLoading(false)
      setHasProcessedPageId(true)
    }
  }, [isMounted, pageId, pages.length])

  // Reset processing flag when pageId changes
  useEffect(() => {
    setHasProcessedPageId(false)
  }, [pageId])

  // Show loading during hydration to prevent mismatches
  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading fast editor...</p>
        </div>
      </div>
    )
  }

  // Show loading if we have a pageId but no current page set yet, or if explicitly loading
  if (isLoading || (pageId && !currentPage)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading page editor...</p>
          {pageId && <p className="text-sm text-gray-500 mt-2">Page ID: {pageId}</p>}
          <p className="text-xs text-gray-400 mt-1">
            {pages.length === 0 ? 'Loading pages...' : `Found ${pages.length} pages`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <FastEditor 
      pageId={pageId || undefined}
      onSave={(html, css) => {
        console.log('Page saved:', { html, css })
      }}
      onPublish={() => {
        console.log('Page published')
      }}
    />
  )
}

export default function FastEditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading fast editor...</p>
        </div>
      </div>
    }>
      <FastEditorContent />
    </Suspense>
  )
}
