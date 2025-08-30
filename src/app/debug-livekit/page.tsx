'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import AuthButton from '@/components/AuthButton'
import Link from 'next/link'

export default function DebugLiveKitPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<{
    success: boolean
    requestParams?: Record<string, unknown>
    response?: Record<string, unknown>
    error?: string
    timestamp: string
  } | null>(null)
  const [testRoomId, setTestRoomId] = useState('demo-test-room')
  const [testing, setTesting] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase.auth])

  const testTokenGeneration = async () => {
    if (!user) return
    
    setTesting(true)
    setDebugInfo(null)
    
    try {
      console.log('🧪 Testing token generation...')
      
      let actualRoomId = testRoomId

      // Handle demo room case - create/get proper UUID room
      if (testRoomId === 'demo-test-room') {
        // Check if user already has a debug demo room
        const { data: existingRooms, error: checkError } = await supabase
          .from('rooms')
          .select('*')
          .eq('name', '🧪 Debug Test Room')
          .eq('owner_id', user.id)
          .limit(1)

        if (checkError) throw checkError

        if (existingRooms && existingRooms.length > 0) {
          actualRoomId = existingRooms[0].id
          console.log('📍 Using existing debug room:', actualRoomId)
        } else {
          // Create new debug room with proper UUID
          console.log('📝 Creating debug room...')
          const { data: newRoom, error: createError } = await supabase
            .from('rooms')
            .insert([{
              name: '🧪 Debug Test Room',
              owner_id: user.id
            }])
            .select()
            .single()

          if (createError) {
            throw new Error(`Failed to create room: ${createError.message}`)
          }
          
          actualRoomId = newRoom.id
          console.log('✅ Created debug room:', actualRoomId)
        }
      } else {
        // For UUID room IDs, verify the room exists
        const { error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', testRoomId)
          .single()

        if (roomError) {
          if (roomError.code === 'PGRST116') {
            throw new Error('Room not found. Please use an existing room ID or "demo-test-room".')
          } else if (roomError.code === '22P02') {
            throw new Error('Invalid room ID format. Please use a valid UUID or "demo-test-room".')
          } else {
            throw new Error(`Database error: ${roomError.message}`)
          }
        }
      }

      // Test Edge Function call
      console.log('🚀 Calling Edge Function with:', {
        roomId: actualRoomId,
        identity: user.id,
        participantName: user.user_metadata?.full_name || user.email || 'Test User'
      })

      const { data, error } = await supabase.functions.invoke('livekit-token', {
        body: {
          roomId: actualRoomId,
          identity: user.id,
          participantName: user.user_metadata?.full_name || user.email || 'Test User'
        }
      })

      const debugResult = {
        success: !error,
        requestParams: {
          roomId: actualRoomId,
          identity: user.id,
          participantName: user.user_metadata?.full_name || user.email || 'Test User'
        },
        response: {
          data,
          error: error ? {
            message: error.message,
            details: error.details,
            context: error.context
          } : null
        },
        timestamp: new Date().toISOString()
      }

      setDebugInfo(debugResult)

      if (error) {
        throw error
      }

      if (data?.token) {
        console.log('✅ Token generated successfully!')
      } else {
        throw new Error('No token in response')
      }

    } catch (error) {
      console.error('🚨 Token generation failed:', error)
      setDebugInfo({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                🎙️ MultiSpeaker
              </Link>
              <span className="ml-4 text-gray-500">Debug LiveKit</span>
            </div>
            <AuthButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {!user ? (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                You need to sign in to debug LiveKit token generation.
              </p>
              <AuthButton />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🧪 LiveKit Debug Center
              </h1>
              <p className="mt-2 text-gray-600">
                Debug and test LiveKit Edge Function integration
              </p>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">👤 User Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>User ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user.id}</code>
                </div>
                <div>
                  <strong>Email:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user.email}</code>
                </div>
                <div>
                  <strong>Full Name:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user.user_metadata?.full_name || 'Not set'}</code>
                </div>
                <div>
                  <strong>Provider:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user.app_metadata?.provider}</code>
                </div>
              </div>
            </div>

            {/* Test Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">🔧 Token Generation Test</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                    Test Room ID
                  </label>
                  <input
                    id="roomId"
                    type="text"
                    value={testRoomId}
                    onChange={(e) => setTestRoomId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter room ID to test"
                  />
                </div>
                
                <button
                  onClick={testTokenGeneration}
                  disabled={testing || !testRoomId.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {testing ? '🔄 Testing...' : '🧪 Test Token Generation'}
                </button>
              </div>
            </div>

            {/* Debug Results */}
            {debugInfo && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {debugInfo.success ? '✅ Debug Results' : '❌ Error Details'}
                </h2>
                
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-800">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
                
                {debugInfo.success && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">🎉 Success!</h3>
                    <p className="text-green-700 text-sm">
                      LiveKit token generated successfully. You can now join rooms with this user account.
                    </p>
                    <div className="mt-3">
                      <Link
                        href={`/call/${testRoomId}`}
                        className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                      >
                        🎧 Join Test Room
                      </Link>
                    </div>
                  </div>
                )}
                
                {!debugInfo.success && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">🚨 Error Analysis</h3>
                    <div className="text-red-700 text-sm space-y-2">
                      <p><strong>Issue:</strong> {debugInfo.error}</p>
                      <div className="mt-3">
                        <h4 className="font-medium mb-1">Possible Solutions:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Check if LiveKit environment variables are set in Supabase</li>
                          <li>Verify that you own the room you&apos;re trying to join</li>
                          <li>Ensure Edge Functions are deployed correctly</li>
                          <li>Check if the room exists in the database</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Environment Check */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">🔍 Environment Check</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                    <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                    <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>NEXT_PUBLIC_LIVEKIT_URL:</span>
                    <span className={process.env.NEXT_PUBLIC_LIVEKIT_URL ? 'text-green-600' : 'text-red-600'}>
                      {process.env.NEXT_PUBLIC_LIVEKIT_URL ? '✅ Set' : '❌ Missing'}
                    </span>
                  </div>
                  {process.env.NEXT_PUBLIC_LIVEKIT_URL && (
                    <div className="text-xs text-gray-600">
                      URL: <code className="bg-gray-100 px-1 rounded">{process.env.NEXT_PUBLIC_LIVEKIT_URL}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">🎯 Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/rooms"
                  className="block text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🏠 Go to Rooms
                </Link>
                <Link
                  href="/call/demo-test-room"
                  className="block text-center bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🎧 Try Demo Room
                </Link>
                <Link
                  href="/test-db"
                  className="block text-center bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  🗄️ Test Database
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
