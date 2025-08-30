'use client'

import { useState, useEffect } from 'react'
import {
  LiveKitRoom as LiveKitRoomComponent,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useRoomContext,
} from '@livekit/components-react'
import {
  Track,
  RoomEvent,
  ConnectionState,
  Room,
} from 'livekit-client'
import '@livekit/components-styles'

interface LiveKitRoomProps {
  token: string
  roomName: string
  onParticipantConnected?: (identity: string) => void
}

function ParticipantView() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  return (
    <div className="grid gap-4 p-4">
      {tracks.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-700 rounded-lg">
          <p className="text-gray-400">Waiting for participants...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <div key={track.participant.sid} className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
              <ParticipantTile
                {...track}
                className="h-full w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RoomStatus() {
  const room = useRoomContext()
  const [connectionState, setConnectionState] = useState<ConnectionState>(room?.state ?? ConnectionState.Disconnected)
  const [participants, setParticipants] = useState(0)

  useEffect(() => {
    if (!room) return

    const updateState = () => {
      setConnectionState(room.state)
      setParticipants(room.remoteParticipants.size + 1) // +1 for local participant
    }

    updateState()
    
    room.on(RoomEvent.ConnectionStateChanged, updateState)
    room.on(RoomEvent.ParticipantConnected, updateState)
    room.on(RoomEvent.ParticipantDisconnected, updateState)

    return () => {
      room.off(RoomEvent.ConnectionStateChanged, updateState)
      room.off(RoomEvent.ParticipantConnected, updateState)
      room.off(RoomEvent.ParticipantDisconnected, updateState)
    }
  }, [room])

  const getStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return 'text-green-400'
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return 'text-yellow-400'
      case ConnectionState.Disconnected:
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusText = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return 'Connected'
      case ConnectionState.Connecting:
        return 'Connecting...'
      case ConnectionState.Reconnecting:
        return 'Reconnecting...'
      case ConnectionState.Disconnected:
        return 'Disconnected'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          connectionState === ConnectionState.Connected ? 'bg-green-400' :
          connectionState === ConnectionState.Connecting || connectionState === ConnectionState.Reconnecting ? 'bg-yellow-400 animate-pulse' :
          'bg-red-400'
        }`}></div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        <span className="text-gray-400 text-sm">•</span>
        <span className="text-gray-300 text-sm">
          {participants} participant{participants !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

export default function LiveKitRoom({ token, roomName, onParticipantConnected }: LiveKitRoomProps) {
  const [isConnected, setIsConnected] = useState(false)
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!serverUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-semibold mb-2">LiveKit Configuration Missing</h2>
          <p className="text-gray-400 text-sm">
            NEXT_PUBLIC_LIVEKIT_URL environment variable is not set
          </p>
        </div>
      </div>
    )
  }

  const handleRoomConnected = () => {
    console.log('Connected to room')
    setIsConnected(true)
  }

  const handleRoomDisconnected = () => {
    console.log('Disconnected from room')
    setIsConnected(false)
  }

  const handleRoomError = (error: Error) => {
    console.error('Room error:', error)
    setIsConnected(false)
  }

  return (
    <div className="h-full relative">
      <LiveKitRoomComponent
        video={false} // Audio-only for now
        audio={true}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#1f2937', // bg-gray-800
        }}
        onConnected={handleRoomConnected}
        onDisconnected={handleRoomDisconnected}
        onError={handleRoomError}
      >
        {/* Room Status Overlay */}
        <RoomStatus />
        
        {/* Participant Grid */}
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ParticipantView />
          </div>
          
          {/* Control Bar */}
          <div className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-700">
            <ControlBar 
              variation="minimal"
              controls={{
                microphone: true,
                camera: false, // Audio-only for now
                screenShare: false,
                chat: false,
                settings: true,
                leave: false, // We handle leaving in the parent component
              }}
            />
          </div>
        </div>

        {/* Audio renderer for remote participants */}
        <RoomAudioRenderer />
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-white text-xl font-semibold mb-2">Joining Room</h2>
              <p className="text-gray-400">Connecting to {roomName}...</p>
            </div>
          </div>
        )}
      </LiveKitRoomComponent>
    </div>
  )
}
