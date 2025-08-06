'use client'

import { useEffect, useState } from 'react'

export default function MenuTestPage() {
  const [menu, setMenu] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch('/api/menus?location=header')
        const data = await response.json()
        setMenu(data)
      } catch (err) {
        setError('Failed to fetch menu')
      }
    }

    fetchMenu()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Menu API Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Menu Data</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(menu, null, 2)}
          </pre>
        </div>

        <div className="mt-8 space-y-4">
          <a 
            href="/admin/menus"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Menu Builder
          </a>
          
          <a 
            href="/demo/menu"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors ml-4"
          >
            View Menu Demo
          </a>
        </div>
      </div>
    </div>
  )
}
