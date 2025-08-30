import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/storage-manager`

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Forward the request to the Supabase Edge Function
    const edgeUrl = new URL(EDGE_FUNCTION_URL)
    searchParams.forEach((value, key) => {
      edgeUrl.searchParams.set(key, value)
    })

    const response = await fetch(edgeUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Edge function error' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Storage manager API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
