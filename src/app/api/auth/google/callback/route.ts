import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createServerClient, getCurrentUserId } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(new URL('/calendario?error=no_code', request.url))
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url))
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
    const { data: existing } = await supabase
      .from('calendar_config')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single()

    const config = {
      user_id: userId,
      calendar_id: primaryCalendar?.id || 'primary',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      await supabase.from('calendar_config').update(config).eq('id', existing.id)
    } else {
      await supabase.from('calendar_config').insert(config)
    }

    return NextResponse.redirect(new URL('/calendario?connected=true', request.url))
  } catch (err) {
    console.error('Google callback error:', err)
    return NextResponse.redirect(new URL('/calendario?error=auth_failed', request.url))
  }
}
