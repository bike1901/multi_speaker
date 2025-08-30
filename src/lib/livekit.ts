import { createClient } from '@/lib/supabase'

export interface LiveKitTokenRequest {
  roomId: string
  identity: string
  participantName?: string
}

export interface LiveKitTokenResponse {
  token: string
}

export interface LiveKitEgressRequest {
  action: 'start_room' | 'start_participant' | 'start_track' | 'stop'
  roomId?: string
  participantIdentity?: string
  egressId?: string
  trackSid?: string
  filename?: string
}

export interface LiveKitEgressResponse {
  egress_id?: string
  status?: string
  url?: string
}

/**
 * Generate a LiveKit access token for a user to join a room
 */
export async function generateLiveKitToken(
  roomId: string,
  identity: string,
  participantName?: string
): Promise<string> {
  const supabase = createClient()
  
  const { data, error } = await supabase.functions.invoke('livekit-token', {
    body: {
      roomId,
      identity,
      participantName: participantName || identity
    }
  })

  if (error) {
    console.error('Error generating LiveKit token:', error)
    throw new Error('Failed to generate access token')
  }

  if (!data?.token) {
    throw new Error('No token returned from server')
  }

  return data.token
}

/**
 * Start recording for a room and participant
 */
export async function startRecording(
  roomId: string,
  participantIdentity: string
): Promise<LiveKitEgressResponse> {
  const supabase = createClient()
  
  const { data, error } = await supabase.functions.invoke('livekit-egress', {
    body: {
      action: 'start_participant',
      roomId,
      participantIdentity
    }
  })

  if (error) {
    console.error('Error starting recording:', error)
    throw new Error('Failed to start recording')
  }

  return data
}

/**
 * Stop recording for a specific egress
 */
export async function stopRecording(egressId: string, roomId: string): Promise<LiveKitEgressResponse> {
  const supabase = createClient()
  
  const { data, error } = await supabase.functions.invoke('livekit-egress', {
    body: {
      action: 'stop',
      roomId,
      egressId
    }
  })

  if (error) {
    console.error('Error stopping recording:', error)
    throw new Error('Failed to stop recording')
  }

  return data
}

/**
 * Get the LiveKit server URL from environment variables
 */
export function getLiveKitUrl(): string {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL
  if (!url) {
    throw new Error('NEXT_PUBLIC_LIVEKIT_URL environment variable is not set')
  }
  return url
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Generate a participant display name from identity
 */
export function getParticipantDisplayName(identity: string, currentUserId?: string): string {
  if (identity === currentUserId) {
    return 'You'
  }
  
  // If it looks like a UUID, show a shortened version
  if (identity.length === 36 && identity.includes('-')) {
    return `User ${identity.slice(0, 8)}`
  }
  
  return identity
}
