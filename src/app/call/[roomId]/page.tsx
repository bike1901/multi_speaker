'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Tables } from '@/types/database'
import { User } from '@supabase/supabase-js'
import LiveKitRoom from '@/components/LiveKitRoom'

type Room = Tables<'rooms'>
type Participant = Tables<'participants'>
type Recording = Tables<'recordings'>

export default function CallPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  
  const [user, setUser] = useState<User | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  
  const supabase = createClient()

  const createOrGetDemoRoom = useCallback(async () => {
    if (!user) return null
    
    try {
      // First check if a demo room already exists for this user
      const { data: existingRooms, error: checkError } = await supabase
        .from('rooms')
        .select('*')
        .eq('name', '🎧 Demo Test Room')
        .eq('owner_id', user.id)
        .limit(1)

      if (checkError) {
        console.error('Error checking for existing demo room:', checkError)
        throw checkError
      }

      if (existingRooms && existingRooms.length > 0) {
        // Demo room already exists, use it
        console.log('Using existing demo room:', existingRooms[0].id)
        setRoom(existingRooms[0])
        return existingRooms[0].id
      }

      // Create a new demo room with proper UUID (let database generate it)
      const { data: newRoom, error: insertError } = await supabase
        .from('rooms')
        .insert([
          {
            name: '🎧 Demo Test Room',
            owner_id: user.id,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Error creating demo room:', insertError)
        throw insertError
      }
      
      console.log('Created new demo room:', newRoom.id)
      setRoom(newRoom)
      return newRoom.id
    } catch (error) {
      console.error('Error with demo room:', error)
      setError('Failed to create or access demo room')
      return null
    }
  }, [user, supabase])

  const fetchRoom = useCallback(async () => {
    try {
      // Special handling for demo room URL
      if (roomId === 'demo-test-room') {
        if (!user) {
          setError('Please sign in to access the demo room')
          return
        }
        
        console.log('Handling demo room request')
        const demoRoomId = await createOrGetDemoRoom()
        
        if (demoRoomId) {
          // Redirect to the proper UUID-based room URL
          console.log('Redirecting to demo room:', demoRoomId)
          router.push(`/call/${demoRoomId}`)
        }
        return
      }

      // Regular room fetching for UUID-based room IDs
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Room not found')
        } else if (error.code === '22P02') {
          // Invalid UUID format
          setError('Invalid room ID format')
        } else {
          console.error('Database error:', error)
          setError('Failed to load room')
        }
        return
      }
      
      setRoom(data)
    } catch (error) {
      console.error('Error fetching room:', error)
      setError('Failed to load room')
    }
  }, [roomId, user, supabase, createOrGetDemoRoom, router])

  const fetchParticipants = useCallback(async () => {
    // Skip if this is the demo room URL (will redirect first)
    if (roomId === 'demo-test-room') return
    
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true })

      if (error) {
        if (error.code === '22P02') {
          // Invalid UUID format - don't log as error, just skip
          console.log('Skipping participant fetch for invalid room ID format')
          return
        }
        throw error
      }
      setParticipants(data || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }, [roomId, supabase])

  const fetchRecordings = useCallback(async () => {
    // Skip if this is the demo room URL (will redirect first)
    if (roomId === 'demo-test-room') return
    
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '22P02') {
          // Invalid UUID format - don't log as error, just skip
          console.log('Skipping recordings fetch for invalid room ID format')
          return
        }
        throw error
      }
      setRecordings(data || [])
    } catch (error) {
      console.error('Error fetching recordings:', error)
    }
  }, [roomId, supabase])

  const generateToken = useCallback(async (user: User) => {
    // Skip if this is the demo room URL (will redirect first)
    if (roomId === 'demo-test-room') return
    
    try {
      console.log('Generating token for:', {
        roomId,
        identity: user.id,
        participantName: user.user_metadata?.full_name || user.email || 'Anonymous'
      })

      const { data, error } = await supabase.functions.invoke('livekit-token', {
        body: {
          roomId: roomId,
          identity: user.id,
          participantName: user.user_metadata?.full_name || user.email || 'Anonymous'
        }
      })

      if (error) {
        console.error('Edge Function error details:', {
          error,
          message: error.message,
          context: error.context,
          details: error.details
        })
        throw error
      }
      
      if (data?.token) {
        console.log('Token generated successfully')
        setToken(data.token)
      } else {
        console.error('No token in response:', data)
        throw new Error('No token returned from server')
      }
    } catch (error) {
      console.error('Error generating token:', error)
      setError(`Failed to generate access token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [roomId, supabase])

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!mounted) return
      
      if (!user) {
        router.push('/rooms')
        return
      }
      
      setUser(user)
      
      // For demo room, handle redirect first
      if (roomId === 'demo-test-room') {
        try {
          // First check if a demo room already exists for this user
          const { data: existingRooms, error: checkError } = await supabase
            .from('rooms')
            .select('*')
            .eq('name', '🎧 Demo Test Room')
            .eq('owner_id', user.id)
            .limit(1)

          if (checkError) {
            console.error('Error checking for existing demo room:', checkError)
            setError('Failed to access demo room')
            setLoading(false)
            return
          }

          let demoRoomId = null

          if (existingRooms && existingRooms.length > 0) {
            // Demo room already exists, use it
            demoRoomId = existingRooms[0].id
          } else {
            // Create a new demo room
            const { data: newRoom, error: insertError } = await supabase
              .from('rooms')
              .insert([{
                name: '🎧 Demo Test Room',
                owner_id: user.id,
              }])
              .select()
              .single()

            if (insertError) {
              console.error('Error creating demo room:', insertError)
              setError('Failed to create demo room')
              setLoading(false)
              return
            }
            
            demoRoomId = newRoom.id
          }

          if (demoRoomId && mounted) {
            router.push(`/call/${demoRoomId}`)
          }
        } catch (error) {
          console.error('Error with demo room:', error)
          setError('Failed to access demo room')
        }
        
        setLoading(false)
        return
      }
      
      // For regular UUID rooms, fetch all data in parallel
      try {
        await Promise.all([
          fetchRoom(),
          fetchParticipants(),
          fetchRecordings(),
          generateToken(user)
        ])
      } catch (error) {
        console.error('Error loading room data:', error)
      }
      
      if (mounted) {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/rooms')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [roomId]) // Only depend on roomId to avoid infinite loops

  const startRecording = async () => {
    if (!user || !room) return

    try {
      const { data, error } = await supabase.functions.invoke('livekit-egress', {
        body: {
          action: 'start_participant',
          roomId,
          participantIdentity: user.id
        }
      })

      if (error) throw error
      
      // Refresh recordings to show the new recording
      await fetchRecordings()
      
      console.log('Recording started:', data)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Failed to start recording')
    }
  }

  const stopRecording = async (recordingId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase.functions.invoke('livekit-egress', {
        body: {
          action: 'stop',
          roomId,
          egressId: recordingId
        }
      })

      if (error) throw error
      
      // Refresh recordings to show updated status
      await fetchRecordings()
      
      console.log('Recording stopped:', data)
    } catch (error) {
      console.error('Error stopping recording:', error)
      alert('Failed to stop recording')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to room...</p>
        </div>
      </div>
    )
  }

  if (error || !room || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || 'Room not found'}
          </h1>
          <button
            onClick={() => router.push('/rooms')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">{room.name}</h1>
            <p className="text-gray-400 text-sm">Room ID: {roomId}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              <span className="text-green-400 text-sm font-medium">Connected</span>
            </div>
            <button
              onClick={() => router.push('/rooms')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Call Area */}
        <div className="flex-1 flex flex-col">
          {/* LiveKit Room Component */}
          <div className="flex-1 bg-gray-800">
            {token ? (
              <LiveKitRoom
                token={token}
                roomName={roomId}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-white">Generating access token...</p>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={startRecording}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <span className="w-3 h-3 bg-white rounded-full"></span>
                <span>Start Recording</span>
              </button>
              
              {recordings.filter(r => r.status === 'recording').map((recording) => (
                <button
                  key={recording.id}
                  onClick={() => stopRecording(recording.id)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></span>
                  <span>Stop Recording</span>
                </button>
              ))}
            </div>
            
            {recordings.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-sm">
                  {recordings.filter(r => r.status === 'recording').length} active recording(s) • {' '}
                  {recordings.filter(r => r.status === 'completed').length} completed
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Participants */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold mb-3">
              Participants ({participants.length})
            </h2>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-3 text-white">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {participant.identity.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm truncate">
                      {participant.identity === user.id ? 'You' : participant.identity}
                    </p>
                    <p className="text-xs text-gray-400">
                      {participant.joined_at ? 
                        new Date(participant.joined_at).toLocaleTimeString() : 
                        'Just joined'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recordings */}
          <div className="flex-1 p-4">
            <h2 className="text-white font-semibold mb-3">
              Recordings ({recordings.length})
            </h2>
            <div className="space-y-3">
              {recordings.map((recording) => (
                <div key={recording.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium truncate">
                      {recording.participant_identity === user.id ? 'Your track' : recording.participant_identity}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      recording.status === 'recording' ? 'bg-red-100 text-red-800' :
                      recording.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {recording.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Started: {new Date(recording.created_at!).toLocaleTimeString()}</p>
                    {recording.duration_seconds && (
                      <p>Duration: {Math.round(recording.duration_seconds / 60)}m {recording.duration_seconds % 60}s</p>
                    )}
                    {recording.size_bytes && (
                      <p>Size: {(recording.size_bytes / 1024 / 1024).toFixed(1)} MB</p>
                    )}
                  </div>
                </div>
              ))}
              
              {recordings.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">
                  No recordings yet.{'\n'}Click &ldquo;Start Recording&rdquo; to begin.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
