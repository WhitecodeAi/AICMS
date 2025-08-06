'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the menu builder to avoid hydration issues
const DragDropMenuBuilder = dynamic(() => import('./DragDropMenuBuilder'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Menu selector skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Menu structure skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center p-4 border border-gray-200 rounded-lg">
              <div className="flex flex-col mr-2">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="mr-3">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div>
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function ClientMenuBuilder() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="space-y-6">
        {/* Loading state that matches server */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
            <p className="text-gray-600 mt-1">Drag and drop menu items to reorder or create sub-menus</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Initializing menu builder...</p>
          </div>
        </div>
      </div>
    )
  }

  return <DragDropMenuBuilder />
}
