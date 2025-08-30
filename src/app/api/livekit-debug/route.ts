import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    const { roomId, identity, participantName } = await request.json()

    if (!roomId || !identity) {
      return NextResponse.json(
        { error: 'Missing required parameters: roomId, identity' },
        { status: 400 }
      )
    }

    console.log('Debug: Calling livekit-token Edge Function with:', {
      roomId,
      identity,
      participantName,
      userId: user.id
    })

    // Call the Edge Function with correct parameters
    const { data, error } = await supabase.functions.invoke('livekit-token', {
      body: {
        roomId,
        identity,
        participantName: participantName || identity
      }
    })

    if (error) {
      console.error('Edge Function error:', error)
      return NextResponse.json(
        { 
          error: 'Edge Function failed', 
          details: error.message,
          context: error.context || {},
          requestBody: { roomId, identity, participantName }
        },
        { status: 400 }
      )
    }

    if (!data?.token) {
      return NextResponse.json(
        { error: 'No token returned from Edge Function', data },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      token: data.token,
      room: data.room,
      identity: data.identity,
      participantName: data.participantName
    })

  } catch (error) {
    console.error('LiveKit debug API error:', error)
    return NextResponse.json(
      { 
        error: 'API route failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'LiveKit Debug API',
    instructions: 'Use POST with { roomId, identity, participantName } to test token generation'
  })
}
