import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getCurrentUserId } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/auth/google/callback`

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  )

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent',
    state: userId,
  })

  return NextResponse.json({ url })
}
