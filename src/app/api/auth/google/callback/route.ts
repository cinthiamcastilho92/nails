import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const userId = searchParams.get('state')

    if (!code || !userId) {
      return NextResponse.redirect(new URL('/calendario?error=no_code', request.url))
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const calendarList = await calendar.calendarList.list({ minAccessRole: 'owner' })
    const primaryCalendar = calendarList.data.items?.find(c => c.primary) || calendarList.data.items?.[0]

    const supabase = createServerClient()
    const { error } = await supabase.from('calendar_config').upsert({
      user_id: userId,
      calendar_id: primaryCalendar?.id || 'primary',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) {
      console.error('Upsert error:', error)
      return NextResponse.redirect(new URL(`/calendario?error=${encodeURIComponent(error.message)}`, request.url))
    }

    return NextResponse.redirect(new URL('/calendario?connected=true', request.url))
  } catch (err) {
    console.error('Google callback error:', err)
    const msg = err instanceof Error ? err.message : 'auth_failed'
    return NextResponse.redirect(new URL(`/calendario?error=${encodeURIComponent(msg)}`, request.url))
  }
}
