import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getCurrentUserId } from '@/lib/supabase/server'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent',
    state: userId,
  })

  return NextResponse.redirect(url)
}
