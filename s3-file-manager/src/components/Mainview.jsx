import React, { useState, useEffect } from 'react'
import { 
  Folder, 
  File, 
  Search, 
  Copy, 
  Move, 
  Trash2, 
  Upload, 
  FolderPlus,
  ChevronRight,
  Home,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useParams } from 'react-router-dom'

function FileExplorer() {
  const { id } = useParams();
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [bucketName, setBucketName] = useState(id || 'my-bucket') // Get from useParams in real app
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [folders, setFolders] = useState([]) // For dropdown options

  const BASE_URL = 'http://localhost:4444'

  // Fetch files when component mounts or path changes
  useEffect(() => {
    fetchFiles()
  }, [currentPath, bucketName])

  // Fetch folder structure for dropdowns
  useEffect(() => {
    fetchFolderStructure()
  }, [bucketName])

  const fetchFiles = async () => {
    setLoading(true)
    setError('')
    
    try {
      const prefix = currentPath ? `${currentPath}/` : ''
      const response = await fetch(`${BASE_URL}/objects/${bucketName}?prefix=${encodeURIComponent(prefix)}`)
      const data = await response.json()
      
      if (data.success) {
        // Filter to show only direct children (not recursive)
        const directChildren = data.items.filter(item => {
          if (!prefix) {
            // Root level - show items with depth 0
            return item.depth === 0
          } else {
            // Inside folder - show items that are direct children
            const expectedDepth = prefix.split('/').length - 1
            return item.depth === expectedDepth && item.parent_folder === prefix
          }
        })
        
        setFiles(directChildren)
      } else {
        setError(data.error || 'Failed to fetch files')
        setFiles([])
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFolderStructure = async () => {
    try {
      const response = await fetch(`${BASE_URL}/objects/${bucketName}`)
      const data = await response.json()
      
      if (data.success) {
        const folderList = data.items
          .filter(item => item.is_folder)
          .map(item => item.path)
          .sort()
        
        setFolders(['', ...folderList]) // Include root
      }
    } catch (err) {
      console.error('Failed to fetch folder structure:', err)
    }
  }

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleSelectAll = (checked) => {
    setSelectedFiles(checked ? filteredFiles.map(f => f.key) : [])
  }

  const handleDelete = async () => {
    if (selectedFiles.length === 0) return
    
    const selectedFileObjects = files.filter(f => selectedFiles.includes(f.key))
    const fileNames = selectedFileObjects.map(f => f.name).join(', ')
    
    if (!confirm(`Are you sure you want to delete: ${fileNames}?`)) return

    setLoading(true)
    try {
      for (const key of selectedFiles) {
        const response = await fetch(`${BASE_URL}/object?bucket_name=${bucketName}&key=${encodeURIComponent(key)}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error(`Failed to delete ${key}`)
        }
      }
      
      setSelectedFiles([])
      await fetchFiles() // Refresh the list
      alert('Files deleted successfully!')
    } catch (err) {
      setError('Failed to delete files: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (selectedFiles.length === 0) return
    setShowCopyModal(true)
  }

  const handleMove = () => {
    if (selectedFiles.length === 0) return
    setShowMoveModal(true)
  }

  const handleFolderClick = (folderName) => {
    const cleanFolderName = folderName.replace('/', '')
    const newPath = currentPath ? `${currentPath}/${cleanFolderName}` : cleanFolderName
    setCurrentPath(newPath)
    setSelectedFiles([])
  }

  const navigateToPath = (pathSegment, index) => {
    const pathArray = currentPath.split('/').filter(p => p)
    const newPath = pathArray.slice(0, index + 1).join('/')
    setCurrentPath(newPath)
    setSelectedFiles([])
  }

  const navigateUp = () => {
    const pathArray = currentPath.split('/').filter(p => p)
    if (pathArray.length > 0) {
      pathArray.pop()
      setCurrentPath(pathArray.join('/'))
      setSelectedFiles([])
    }
  }

  const navigateToRoot = () => {
    setCurrentPath('')
    setSelectedFiles([])
  }

  // Modal Components
  const CopyModal = () => {
    const [destinationPath, setDestinationPath] = useState(currentPath)
    const [isCustomPath, setIsCustomPath] = useState(false)
    
    const handleCopySubmit = async () => {
      if (selectedFiles.length === 0) return
      
      setLoading(true)
      try {
        for (const sourceKey of selectedFiles) {
          const fileName = sourceKey.split('/').pop()
          const destKey = destinationPath ? `${destinationPath}/${fileName}` : fileName
          
          const response = await fetch(`${BASE_URL}/copy?bucket_name=${bucketName}&source_key=${encodeURIComponent(sourceKey)}&dest_key=${encodeURIComponent(destKey)}`, {
            method: 'POST'
          })
          
          if (!response.ok) {
            throw new Error(`Failed to copy ${sourceKey}`)
          }
        }
        
        setShowCopyModal(false)
        setSelectedFiles([])
        await fetchFiles()
        await fetchFolderStructure() // Refresh folder list
        alert('Files copied successfully!')
      } catch (err) {
        setError('Failed to copy files: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Copy className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-gray-800">Copy Files</h3>
          </div>
          <p className="mb-4 text-gray-600">
            Copying {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
          </p>
          
          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                checked={!isCustomPath}
                onChange={() => setIsCustomPath(false)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Select destination folder:</span>
            </label>
            
            {!isCustomPath && (
              <select
                value={destinationPath}
                onChange={(e) => setDestinationPath(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Root folder</option>
                {folders.slice(1).map(folder => (
                  <option key={folder} value={folder.replace(/\/$/, '')}>
                    {folder.replace(/\/$/, '') || 'Root'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                checked={isCustomPath}
                onChange={() => setIsCustomPath(true)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Custom path:</span>
            </label>
            
            {isCustomPath && (
              <input
                type="text"
                placeholder="e.g., documents/archive"
                value={destinationPath}
                onChange={(e) => setDestinationPath(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowCopyModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCopySubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? 'Copying...' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const MoveModal = () => {
    const [destinationPath, setDestinationPath] = useState(currentPath)
    const [isCustomPath, setIsCustomPath] = useState(false)
    
    const handleMoveSubmit = async () => {
      if (selectedFiles.length === 0) return
      
      setLoading(true)
      try {
        for (const sourceKey of selectedFiles) {
          const fileName = sourceKey.split('/').pop()
          const destKey = destinationPath ? `${destinationPath}/${fileName}` : fileName
          
          const response = await fetch(`${BASE_URL}/move?bucket_name=${bucketName}&source_key=${encodeURIComponent(sourceKey)}&dest_key=${encodeURIComponent(destKey)}`, {
            method: 'POST'
          })
          
          if (!response.ok) {
            throw new Error(`Failed to move ${sourceKey}`)
          }
        }
        
        setShowMoveModal(false)
        setSelectedFiles([])
        await fetchFiles()
        await fetchFolderStructure() // Refresh folder list
        alert('Files moved successfully!')
      } catch (err) {
        setError('Failed to move files: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Move className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-bold text-gray-800">Move Files</h3>
          </div>
          <p className="mb-4 text-gray-600">
            Moving {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
          </p>
          
          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                checked={!isCustomPath}
                onChange={() => setIsCustomPath(false)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Select destination folder:</span>
            </label>
            
            {!isCustomPath && (
              <select
                value={destinationPath}
                onChange={(e) => setDestinationPath(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Root folder</option>
                {folders.slice(1).map(folder => (
                  <option key={folder} value={folder.replace(/\/$/, '')}>
                    {folder.replace(/\/$/, '') || 'Root'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                checked={isCustomPath}
                onChange={() => setIsCustomPath(true)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Custom path:</span>
            </label>
            
            {isCustomPath && (
              <input
                type="text"
                placeholder="e.g., documents/archive"
                value={destinationPath}
                onChange={(e) => setDestinationPath(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowMoveModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleMoveSubmit}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? 'Moving...' : 'Move'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const NewFolderModal = () => {
    const [folderName, setFolderName] = useState('')
    
    const handleCreateFolder = async () => {
      if (!folderName.trim()) {
        alert('Please enter a folder name')
        return
      }

      setLoading(true)
      try {
        const fullFolderPath = currentPath ? `${currentPath}/${folderName}` : folderName
        
        const response = await fetch(`${BASE_URL}/folder?bucket_name=${bucketName}&folder_name=${encodeURIComponent(fullFolderPath)}`, {
          method: 'POST'
        })
        
        if (response.ok) {
          setShowNewFolderModal(false)
          setFolderName('')
          await fetchFiles()
          await fetchFolderStructure()
          alert(`Folder "${folderName}" created successfully!`)
        } else {
          const error = await response.json()
          throw new Error(error.detail || 'Failed to create folder')
        }
      } catch (err) {
        setError('Failed to create folder: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <FolderPlus className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-gray-800">Create New Folder</h3>
          </div>
          <p className="mb-2 text-sm font-medium text-gray-700">Folder name:</p>
          <input
            type="text"
            placeholder="Enter folder name..."
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowNewFolderModal(false)
                setFolderName('')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFolder}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const UploadModal = () => {
    const [selectedFile, setSelectedFile] = useState(null)
    const [uploadPath, setUploadPath] = useState(currentPath)
    
    const handleUpload = async () => {
      if (!selectedFile) {
        alert('Please select a file to upload')
        return
      }

      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        const key = uploadPath ? `${uploadPath}/${selectedFile.name}` : selectedFile.name
        
        const response = await fetch(`${BASE_URL}/upload?bucket_name=${bucketName}&key=${encodeURIComponent(key)}`, {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          setShowUploadModal(false)
          setSelectedFile(null)
          await fetchFiles()
          alert('File uploaded successfully!')
        } else {
          const error = await response.json()
          throw new Error(error.detail || 'Failed to upload file')
        }
      } catch (err) {
        setError('Failed to upload file: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-gray-800">Upload File</h3>
          </div>
          
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Select file:</p>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Upload to:</p>
            <select
              value={uploadPath}
              onChange={(e) => setUploadPath(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Root folder</option>
              {folders.slice(1).map(folder => (
                <option key={folder} value={folder.replace(/\/$/, '')}>
                  {folder.replace(/\/$/, '') || 'Root'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowUploadModal(false)
                setSelectedFile(null)
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={loading || !selectedFile}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pathArray = currentPath.split('/').filter(p => p)

  return (
    <div className="w-full h-full bg-gray-50 p-8">
      {/* Header with Navigation Path */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">S3 File Explorer</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchFiles}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <span className="text-sm text-gray-600 bg-gray-200 px-3 py-2 rounded-lg">
              Bucket: {bucketName}
            </span>
          </div>
        </div>
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm bg-white p-3 rounded-lg shadow-sm border">
          <button
            onClick={navigateToRoot}
            className="flex items-center gap-1 hover:text-blue-600 transition text-gray-700"
          >
            <Home className="w-4 h-4" />
            <span>{bucketName}</span>
          </button>
          
          {pathArray.map((segment, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => navigateToPath(segment, index)}
                className={`hover:text-blue-600 transition ${
                  index === pathArray.length - 1 
                    ? 'text-blue-600 font-semibold' 
                    : 'text-gray-700 hover:underline'
                }`}
              >
                {segment}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Search + Actions Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-1/2">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2">
          {selectedFiles.length > 0 ? (
            <>
              <button 
                onClick={handleCopy}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                Copy ({selectedFiles.length})
              </button>
              <button 
                onClick={handleMove}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-md disabled:opacity-50"
              >
                <Move className="w-4 h-4" />
                Move ({selectedFiles.length})
              </button>
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedFiles.length})
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setShowNewFolderModal(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition shadow-md disabled:opacity-50"
              >
                <FolderPlus className="w-4 h-4" />
                New Folder
              </button>
              <button 
                onClick={() => setShowUploadModal(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </>
          )}
        </div>
      </div>

      {/* File Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-4 w-12">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Name</th>
              <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Last Modified</th>
              <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading files...
                </td>
              </tr>
            ) : filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <tr
                  key={file.key}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedFiles.includes(file.key) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onDoubleClick={() => file.is_folder && handleFolderClick(file.name)}
                >
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      checked={selectedFiles.includes(file.key)}
                      onChange={() => handleFileSelect(file.key)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      {file.is_folder ? (
                        <Folder className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <File className="w-6 h-6 text-blue-500" />
                      )}
                      <span className="font-medium text-gray-900">{file.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {file.last_modified ? new Date(file.last_modified).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4 text-gray-600">
                    {file.size !== null ? formatFileSize(file.size) : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  {searchTerm ? (
                    <>
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No files found matching "{searchTerm}"</p>
                    </>
                  ) : (
                    <>
                      <Folder className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>This folder is empty</p>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCopyModal && <CopyModal />}
      {showMoveModal && <MoveModal />}
      {showNewFolderModal && <NewFolderModal />}
      {showUploadModal && <UploadModal />}
    </div>
  )
}

// Helper function to format file sizes
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default FileExplorer