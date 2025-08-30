'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Tables } from '@/types/database'
import AuthButton from '@/components/AuthButton'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

type Room = Tables<'rooms'>

export default function RoomsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const supabase = createClient()

  const fetchRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }, [supabase])

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await fetchRooms()
      }
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchRooms()
      } else {
        setRooms([])
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchRooms, supabase.auth])

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim() || !user || creating) return

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          {
            name: roomName.trim(),
            owner_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setRoomName('')
      await fetchRooms()
      
      // Navigate to the call interface
      window.location.href = `/call/${data.id}`
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const joinRoom = (roomId: string) => {
    if (!user) return
    window.location.href = `/call/${roomId}`
  }

  const handleJoinById = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinRoomId.trim()) return
    joinRoom(joinRoomId.trim())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                🎙️ MultiSpeaker
              </Link>
            </div>
            <AuthButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {!user ? (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                You need to sign in to create or join rooms.
              </p>
              <AuthButton />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Page Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                Voice Rooms
              </h1>
              <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
                Create or join multi-speaker recording sessions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Room Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  🆕 Create New Room
                </h2>
                <form onSubmit={createRoom} className="space-y-4">
                  <div>
                    <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                      Room Name
                    </label>
                    <input
                      id="roomName"
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Enter room name (e.g., Team Meeting, Podcast Recording)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={creating}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!roomName.trim() || creating}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? 'Creating...' : 'Create & Join Room'}
                  </button>
                </form>
              </div>

              {/* Join Room by ID Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  🔗 Join by Room ID
                </h2>
                <form onSubmit={handleJoinById} className="space-y-4">
                  <div>
                    <label htmlFor="joinRoomId" className="block text-sm font-medium text-gray-700 mb-2">
                      Room ID
                    </label>
                    <input
                      id="joinRoomId"
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      placeholder="Enter room ID to join"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!joinRoomId.trim()}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Join Room
                  </button>
                </form>
              </div>
            </div>

            {/* Available Rooms Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Available Rooms
                </h2>
                <button
                  onClick={fetchRooms}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  🔄 Refresh
                </button>
              </div>

              {rooms.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🏠</div>
                  <p className="text-gray-500">No rooms available. Create the first one!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {room.name}
                        </h3>
                        {room.owner_id === user.id && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Owner
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-500">
                          <strong>Room ID:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{room.id}</code>
                        </p>
                        <p className="text-sm text-gray-500">
                          <strong>Created:</strong> {new Date(room.created_at!).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => joinRoom(room.id)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                      >
                        Join Room
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How It Works Section */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                🎯 How Multi-Speaker Recording Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="text-2xl mb-2">1️⃣</div>
                  <h3 className="font-semibold text-blue-900 mb-1">Create or Join</h3>
                  <p className="text-blue-700">
                    Create a new room or join an existing one with the room ID
                  </p>
                </div>
                <div>
                  <div className="text-2xl mb-2">2️⃣</div>
                  <h3 className="font-semibold text-blue-900 mb-1">Start Recording</h3>
                  <p className="text-blue-700">
                    Each participant gets their own audio track recorded separately
                  </p>
                </div>
                <div>
                  <div className="text-2xl mb-2">3️⃣</div>
                  <h3 className="font-semibold text-blue-900 mb-1">Download & Edit</h3>
                  <p className="text-blue-700">
                    Get individual audio files for perfect post-production editing
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
