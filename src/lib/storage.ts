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
      console.log('Generating signed URL for path:', path)
      
      // Direct Supabase storage call (bypassing Edge Function for now)
      const { data, error } = await this.supabase.storage
        .from('calls')
        .createSignedUrl(path, expiresIn)

      if (error) {
        console.error('Signed URL error:', error)
        throw new Error(`Failed to create signed URL: ${error.message}`)
      }

      console.log('Generated signed URL successfully')
      return data?.signedUrl || null
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
      console.log('Listing recordings for room:', roomId)
      
      // Direct database query (bypassing Edge Function for now)
      const { data: recordings, error } = await this.supabase
        .from('recordings')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database query error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('Found recordings:', recordings?.length || 0, recordings)
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
      console.log('Starting upload:', { roomId, participantIdentity, fileName: file.name, fileSize: file.size, fileType: file.type })
      
      const path = this.generateRecordingPath(roomId, participantIdentity)
      console.log('Generated path:', path)
      
      const { data, error } = await this.supabase.storage
        .from('calls')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        console.error('Supabase storage error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log('Upload successful:', data)
      return data.path
    } catch (error) {
      console.error('Error uploading recording:', error)
      throw error // Re-throw to get the actual error message
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
