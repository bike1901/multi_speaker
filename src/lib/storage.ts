import { createClient } from './supabase'
import type { Tables } from '@/types/database'

export type Recording = Tables<'recordings'>

export class StorageManager {
  private supabase = createClient()

  /**
   * Generate a signed URL for downloading a recording
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `/api/storage-manager?action=get-signed-url&path=${encodeURIComponent(path)}&expiresIn=${expiresIn}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get signed URL: ${response.statusText}`)
      }

      const { signedUrl } = await response.json()
      return signedUrl
    } catch (error) {
      console.error('Error getting signed URL:', error)
      return null
    }
  }

  /**
   * List all recordings for a room
   */
  async listRecordings(roomId: string): Promise<Recording[]> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `/api/storage-manager?action=list-recordings&roomId=${encodeURIComponent(roomId)}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to list recordings: ${response.statusText}`)
      }

      const { recordings } = await response.json()
      return recordings || []
    } catch (error) {
      console.error('Error listing recordings:', error)
      return []
    }
  }

  /**
   * Generate a recording file path
   */
  generateRecordingPath(roomId: string, participantIdentity: string, extension: string = 'ogg'): string {
    return `${roomId}/${participantIdentity}.${extension}`
  }

  /**
   * Upload a recording (for testing purposes)
   */
  async uploadRecording(roomId: string, participantIdentity: string, file: File): Promise<string | null> {
    try {
      const path = this.generateRecordingPath(roomId, participantIdentity)
      
      const { data, error } = await this.supabase.storage
        .from('calls')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        throw error
      }

      return data.path
    } catch (error) {
      console.error('Error uploading recording:', error)
      return null
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from('calls')
        .remove([path])

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting recording:', error)
      return false
    }
  }

  /**
   * Subscribe to recording updates for a room
   */
  subscribeToRecordings(roomId: string, callback: (recordings: Recording[]) => void) {
    return this.supabase
      .channel(`recordings:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recordings',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Refresh recordings when changes occur
          this.listRecordings(roomId).then(callback)
        }
      )
      .subscribe()
  }
}

// Export a singleton instance
export const storageManager = new StorageManager()
