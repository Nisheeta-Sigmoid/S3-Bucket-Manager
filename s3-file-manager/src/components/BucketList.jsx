import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { env } from '../env'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Plus, Trash2, X } from 'lucide-react'

function BucketList() {  
  const [bucket, setBucket] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [bucketToDelete, setBucketToDelete] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [createError, setCreateError] = useState('')
  const navigate = useNavigate()

  const getBuckets = async() => {
    setLoading(true)
    try {
      const bucketInfo = await axios.get(`${env.baseUrl}/buckets`)
      setBucket(bucketInfo.data.buckets)
    } catch (error) {
      console.error('Error fetching buckets:', error)
    }
    setLoading(false)      
  }

  useEffect(() => {
    getBuckets()
  }, [])

  const navBucketInfo = (bucketName) => {
    navigate(`/bucketManagement/${bucketName}`)
  }

  const handleCreateBucket = async() => {
    if (!newBucketName.trim()) return
    
    setCreating(true)
    setCreateError('') // Clear any previous errors
    try {
      await axios.post(`${env.baseUrl}/bucket/${newBucketName}`)
      setShowCreateModal(false)
      setNewBucketName('')
      getBuckets() // Refresh the bucket list
    } catch (error) {
      console.error('Error creating bucket:', error)
      // Handle different types of errors
      if (error.response?.status === 400) {
        setCreateError('Bucket name already exists or is invalid. Please try a different name.')
      } else {
        setCreateError('Failed to create bucket. Please try again.')
      }
    }
    setCreating(false)
  }

  const handleDeleteBucket = async() => {
    if (!deleteConfirmation) return
    
    setDeleting(true)
    try {
      await axios.delete(`${env.baseUrl}/bucket/${bucketToDelete}`)
      setShowDeleteModal(false)
      setBucketToDelete('')
      setDeleteConfirmation(false)
      getBuckets() // Refresh the bucket list
    } catch (error) {
      console.error('Error deleting bucket:', error)
      // You might want to show an error message to the user here
    }
    setDeleting(false)
  }

  const openDeleteModal = (bucketName, e) => {
    e.stopPropagation() // Prevent navigation when clicking delete button
    setBucketToDelete(bucketName)
    setShowDeleteModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setNewBucketName('')
    setCreateError('') // Clear error when closing modal
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setBucketToDelete('')
    setDeleteConfirmation(false)
  }

  if(loading) {
    return (
      <div className='h-full w-full flex justify-center items-center'>
        <RefreshCw className='animate-spin' />
      </div>
    )
  }

  return (
    <div className='h-full w-full relative'>
      {/* Create Bucket Button */}
      <div className='p-8 pb-4'>
        <button
          onClick={() => setShowCreateModal(true)}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200'
        >
          <Plus size={18} />
          Create Bucket
        </button>
      </div>

      {/* Bucket List */}
      <div className='h-full flex flex-wrap gap-6 px-8 pb-8'>
        {bucket.map((item, index) => (
          <div 
            key={index} 
            onClick={() => navBucketInfo(item)} 
            className='h-[250px] w-[250px] bg-[#333446] text-white rounded-md flex items-center justify-center cursor-pointer hover:scale-[1.05] transition-transform duration-300 ease-in-out relative group'
          >
            {/* Delete Button */}
            <button
              onClick={(e) => openDeleteModal(item, e)}
              className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 p-2 rounded-full transition-all duration-200'
              title="Delete bucket"
            >
              <Trash2 size={16} />
            </button>
            
            <span className='text-center px-4 break-words'>{item}</span>
          </div>
        ))}
      </div>

      {/* Create Bucket Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-[90%]'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold text-gray-800'>Create New Bucket</h2>
              <button
                onClick={closeCreateModal}
                className='text-gray-500 hover:text-gray-700'
              >
                <X size={24} />
              </button>
            </div>
            
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Bucket Name
              </label>
              <input
                type='text'
                value={newBucketName}
                onChange={(e) => {
                  setNewBucketName(e.target.value)
                  setCreateError('') // Clear error when user types
                }}
                placeholder='Enter bucket name'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800'
                onKeyPress={(e) => e.key === 'Enter' && handleCreateBucket()}
              />
              {createError && (
                <p className='mt-2 text-sm text-red-600'>
                  {createError}
                </p>
              )}
            </div>
            
            <div className='flex gap-3 justify-end'>
              <button
                onClick={closeCreateModal}
                className='px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors'
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBucket}
                disabled={!newBucketName.trim() || creating}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors'
              >
                {creating && <RefreshCw size={16} className='animate-spin' />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-[90%]'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold text-gray-800'>Delete Bucket</h2>
              <button
                onClick={closeDeleteModal}
                className='text-gray-500 hover:text-gray-700'
              >
                <X size={24} />
              </button>
            </div>
            
            <div className='mb-6'>
              <p className='text-gray-700 mb-4'>
                Are you sure you want to delete the bucket "{bucketToDelete}"?
              </p>
              <p className='text-red-600 text-sm mb-4'>
                This action cannot be undone and will permanently delete the bucket and all its contents.
              </p>
              
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='deleteConfirm'
                  checked={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.checked)}
                  className='w-4 h-4 text-red-600'
                />
                <label htmlFor='deleteConfirm' className='text-sm text-gray-700'>
                  I understand that this action cannot be undone
                </label>
              </div>
            </div>
            
            <div className='flex gap-3 justify-end'>
              <button
                onClick={closeDeleteModal}
                className='px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors'
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBucket}
                disabled={!deleteConfirmation || deleting}
                className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors'
              >
                {deleting && <RefreshCw size={16} className='animate-spin' />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BucketList