'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { storageManager } from '@/lib/storage'
import type { Tables } from '@/types/database'
import type { User } from '@supabase/supabase-js'

type Room = Tables<'rooms'>
type Recording = Tables<'recordings'>

export default function TestStoragePage() {
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testFile, setTestFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    const getRooms = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          setRooms(data || [])
        }
      } catch (err) {
        setError('Failed to fetch rooms')
      } finally {
        setLoading(false)
      }
    }

    getUser()
    getRooms()
  }, [supabase])

  const loadRecordings = async (roomId: string) => {
    try {
      const recordings = await storageManager.listRecordings(roomId)
      setRecordings(recordings)
    } catch (err) {
      setError('Failed to load recordings')
    }
  }

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId)
    if (roomId) {
      loadRecordings(roomId)
    } else {
      setRecordings([])
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if it's an audio file
      if (file.type.startsWith('audio/')) {
        setTestFile(file)
        setError(null)
      } else {
        setError('Please select an audio file')
        setTestFile(null)
      }
    }
  }

  const handleUploadTest = async () => {
    if (!testFile || !selectedRoom || !user) return

    setUploading(true)
    setError(null) // Clear previous errors
    
    try {
      console.log('Starting upload process...')
      const participantIdentity = `test_user_${Date.now()}`
      
      // Upload the test file
      const path = await storageManager.uploadRecording(
        selectedRoom,
        participantIdentity,
        testFile
      )

      if (path) {
        console.log('File uploaded, creating database record...')
        
        // Create a recording entry in the database
        const { error: dbError } = await supabase
          .from('recordings')
          .insert({
            room_id: selectedRoom,
            participant_identity: participantIdentity,
            path: path,
            status: 'completed',
            size_bytes: testFile.size,
            created_by: user.id
          })

        if (dbError) {
          console.error('Database error:', dbError)
          throw new Error(`Database error: ${dbError.message}`)
        }

        console.log('Database record created successfully')

        // Reload recordings
        await loadRecordings(selectedRoom)
        setTestFile(null)
        
        // Reset file input
        const fileInput = document.getElementById('test-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        console.log('Upload process completed successfully')
      } else {
        throw new Error('Upload returned null path')
      }
    } catch (err) {
      console.error('Upload process failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Upload failed for unknown reason'
      setError(`Upload failed: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (recording: Recording) => {
    try {
      const signedUrl = await storageManager.getSignedUrl(recording.path)
      if (signedUrl) {
        // Open in new tab for download
        window.open(signedUrl, '_blank')
      } else {
        setError('Failed to generate download URL')
      }
    } catch (err) {
      setError('Failed to download recording')
    }
  }

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !user) return

    setCreatingRoom(true)
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName.trim(),
          owner_id: user.id
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Add to rooms list
      setRooms(prev => [data, ...prev])
      
      // Auto-select the new room
      setSelectedRoom(data.id)
      
      // Clear form
      setNewRoomName('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setCreatingRoom(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">🗄️ Storage Test</h1>
            <p className="text-red-600">Please sign in to test storage functionality.</p>
            <Link href="/" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">🗄️ Storage Test</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Error: {error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 text-sm mt-2 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Room Creation & Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Room Management</h2>
              
              {/* Create New Room */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Create New Room</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter room name..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                  />
                  <button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim() || creatingRoom}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {creatingRoom ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>

              <h3 className="text-md font-semibold mb-4">Test File Upload</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Room
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => handleRoomSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">
                    {rooms.length === 0 ? 'Create a room first...' : 'Choose a room...'}
                  </option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Audio File
                </label>
                <input
                  id="test-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {testFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {testFile.name} ({(testFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <button
                onClick={handleUploadTest}
                disabled={!testFile || !selectedRoom || uploading}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Test File'}
              </button>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Storage Info</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✅ Private bucket: <code>calls</code></li>
                  <li>✅ File size limit: 50MB</li>
                  <li>✅ Allowed formats: OGG, MP3, WAV, WebM</li>
                  <li>✅ RLS policies: Room-based access</li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">🔍 Debug Info</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Check your browser&apos;s Developer Console (F12) for detailed logs during upload.
                </p>
                <p className="text-sm text-gray-600">
                  Look for messages starting with &quot;Starting upload:&quot;, &quot;Supabase storage error:&quot;, etc.
                </p>
              </div>
            </div>

            {/* Recordings List */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Recordings {selectedRoom && `(${recordings.length})`}
              </h2>
              
              {!selectedRoom ? (
                <p className="text-gray-500">Select a room to view recordings</p>
              ) : recordings.length === 0 ? (
                <p className="text-gray-500">No recordings found</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recordings.map((recording) => (
                    <div key={recording.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{recording.participant_identity}</p>
                          <p className="text-sm text-gray-600">
                            Status: <span className={`font-medium ${
                              recording.status === 'completed' ? 'text-green-600' :
                              recording.status === 'processing' ? 'text-yellow-600' :
                              recording.status === 'failed' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {recording.status}
                            </span>
                          </p>
                          {recording.duration_seconds && (
                            <p className="text-sm text-gray-600">
                              Duration: {Math.round(recording.duration_seconds)}s
                            </p>
                          )}
                          {recording.size_bytes && (
                            <p className="text-sm text-gray-600">
                              Size: {(recording.size_bytes / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            Created: {new Date(recording.created_at!).toLocaleString()}
                          </p>
                        </div>
                        
                        {recording.status === 'completed' && (
                          <button
                            onClick={() => handleDownload(recording)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t">
            <Link 
              href="/"
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Home
            </Link>
            <span className="mx-4 text-gray-300">|</span>
            <Link 
              href="/test-db"
              className="text-blue-500 hover:text-blue-600"
            >
              Database Test →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
