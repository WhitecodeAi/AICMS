'use client'

import { useState } from 'react'
import { 
  FolderPlus, 
  Upload, 
  ArrowUp, 
  Search, 
  Folder, 
  FileText, 
  Image, 
  Video,
  Download,
  Trash2,
  Edit3,
  MoreVertical
} from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'

interface FileItem {
  id: string
  name: string
  type: 'folder' | 'file'
  size?: number
  mimeType?: string
  dateModified: Date
  isSelected?: boolean
}

const mockFiles: FileItem[] = [
  { id: '1', name: 'abcde', type: 'folder', dateModified: new Date('2025-07-23'), size: 0 },
  { id: '2', name: 'activityFiles', type: 'folder', dateModified: new Date('2025-08-01'), size: 189.88 * 1024 },
  { id: '3', name: 'adminwhitecodetech', type: 'folder', dateModified: new Date('2025-06-26'), size: 0 },
  { id: '4', name: 'AQAR', type: 'folder', dateModified: new Date('2025-03-07'), size: 0 },
  { id: '5', name: 'sample.pdf', type: 'file', mimeType: 'application/pdf', dateModified: new Date('2025-07-15'), size: 2048576 },
  { id: '6', name: 'image.jpg', type: 'file', mimeType: 'image/jpeg', dateModified: new Date('2025-07-20'), size: 1024768 },
]

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles)
  const [currentPath, setCurrentPath] = useState('Home')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null)

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return Folder
    if (file.mimeType?.startsWith('image/')) return Image
    if (file.mimeType?.startsWith('video/')) return Video
    return FileText
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleFileAction = (action: string, fileId: string) => {
    switch (action) {
      case 'download':
        console.log('Download file:', fileId)
        break
      case 'delete':
        setFiles(prev => prev.filter(file => file.id !== fileId))
        break
      case 'rename':
        console.log('Rename file:', fileId)
        break
    }
    setShowActionsMenu(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Manager</h1>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <span>Upload file to:</span>
            <span className="ml-2 font-medium">{currentPath}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
            <FolderPlus className="w-4 h-4 mr-2" />
            Create Folder
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
            <ArrowUp className="w-4 h-4 mr-2" />
            One Step Up
          </button>
          
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-1">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFiles(filteredFiles.map(f => f.id))
                  } else {
                    setSelectedFiles([])
                  }
                }}
              />
            </div>
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Date Modified</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>

        {/* File List */}
        <div className="divide-y divide-gray-200">
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file)
            const isSelected = selectedFiles.includes(file.id)

            return (
              <div
                key={file.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFileSelection(file.id)}
                      className="rounded border-gray-300"
                    />
                  </div>
                  
                  <div className="col-span-5 flex items-center">
                    <FileIcon className={`w-5 h-5 mr-3 ${
                      file.type === 'folder' ? 'text-blue-500' : 'text-gray-500'
                    }`} />
                    <span className="text-sm text-gray-900 truncate">{file.name}</span>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">
                      {formatDate(file.dateModified)}
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">
                      {file.size ? formatFileSize(file.size) : '0 B'}
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFileAction('download', file.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFileAction('rename', file.id)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Rename"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFileAction('delete', file.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a file to preview</p>
        </div>
      </div>
    </div>
  )
}
