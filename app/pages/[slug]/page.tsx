'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { usePageStore, type Page } from '@/lib/stores/page-store'
import { Loader2, FileX } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import PageRenderer to prevent SSR hydration issues
const PageRenderer = dynamic(() => import('@/components/page-builder/PageRenderer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading page content...</p>
      </div>
    </div>
  )
})

export default function PublicPageView() {
  const params = useParams()
  const slug = params.slug as string
  const [isMounted, setIsMounted] = useState(false)
  const { pages } = usePageStore()
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Find the page by slug
    const foundPage = pages.find(p => p.slug === slug && p.isPublished)
    setPage(foundPage || null)
    setLoading(false)
  }, [isMounted, slug, pages])

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">
            The page you're looking for doesn't exist or isn't published.
          </p>
          <a 
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* SEO Meta Tags would go here */}
      <title>{page.metaTitle || page.title}</title>
      {page.metaDescription && (
        <meta name="description" content={page.metaDescription} />
      )}
      
      {/* Render the page content */}
      <PageRenderer data={page.data} />
    </div>
  )
}
