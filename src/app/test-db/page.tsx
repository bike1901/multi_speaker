'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Tables } from '@/types/database'
import type { User } from '@supabase/supabase-js'

export default function TestDbPage() {
  const [rooms, setRooms] = useState<Tables<'rooms'>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
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
      } catch {
        setError('Failed to fetch rooms')
      } finally {
        setLoading(false)
      }
    }

    getUser()
    getRooms()
  }, [supabase])

  const createTestRoom = async () => {
    if (!user) {
      setError('Please sign in first')
      return
    }

    try {
      // Get custom name from input or use default
      const nameInput = document.getElementById('room-name-input') as HTMLInputElement
      const customName = nameInput?.value.trim()
      const roomName = customName || `Test Room ${Date.now()}`

      const { error } = await supabase
        .from('rooms')
        .insert([
          {
            name: roomName,
            owner_id: user.id
          }
        ])
        .select()

      if (error) {
        setError(error.message)
      } else {
        // Clear input
        if (nameInput) nameInput.value = ''
        
        // Refresh rooms
        const { data: rooms } = await supabase
          .from('rooms')
          .select('*')
          .order('created_at', { ascending: false })
        setRooms(rooms || [])
        setError(null)
      }
    } catch {
      setError('Failed to create room')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">🧪 Database Test</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
            {user ? (
              <div className="text-green-600">
                ✅ Signed in as: {user.email}
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Not signed in
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Database Connection</h2>
            {loading ? (
              <div className="text-blue-600">Loading...</div>
            ) : error ? (
              <div className="text-red-600">❌ Error: {error}</div>
            ) : (
              <div className="text-green-600">✅ Connected successfully</div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Rooms ({rooms.length})</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Room name (optional)"
                  className="flex-1 border border-gray-300 rounded px-3 py-2"
                  id="room-name-input"
                />
                <button
                  onClick={createTestRoom}
                  disabled={!user}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Create Test Room
                </button>
              </div>
            </div>
            
            {rooms.length === 0 ? (
              <div className="text-gray-500">No rooms yet. Create one to test!</div>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div key={room.id} className="border rounded p-3">
                    <div className="font-medium">{room.name}</div>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(room.created_at!).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {room.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Link 
              href="/"
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
