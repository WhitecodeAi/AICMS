'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePageStore } from '@/lib/stores/page-store'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import GrapesJSLite to prevent SSR hydration issues
const GrapesJSLite = dynamic(() => import('@/components/page-builder/GrapesJSLite'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading visual builder...</p>
      </div>
    </div>
  )
})

function GrapesJSLiteContent() {
  const searchParams = useSearchParams()
  const pageId = searchParams.get('page')
  const { pages, setCurrentPage, currentPage } = usePageStore()

  useEffect(() => {
    if (pageId) {
      const page = pages.find(p => p.id === pageId)
      if (page) {
        setCurrentPage(page)
      }
    }
  }, [pageId, pages, setCurrentPage])

  if (pageId && !currentPage) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading visual builder...</p>
        </div>
      </div>
    )
  }

  return (
    <GrapesJSLite 
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

export default function GrapesJSLitePage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GrapesJSLiteContent />
    </Suspense>
  )
}
