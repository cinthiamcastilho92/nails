import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createServerClient, getCurrentUserId } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { month, year } = await request.json()
  const supabase = createServerClient()

  const { data: config, error: configError } = await supabase
    .from('calendar_config')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (configError || !config) {
    return NextResponse.json({ error: 'Google Calendar não conectado' }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: config.access_token,
    refresh_token: config.refresh_token,
  })

  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token || tokens.access_token) {
      await supabase.from('calendar_config').update({
        access_token: tokens.access_token || config.access_token,
        refresh_token: tokens.refresh_token || config.refresh_token,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : config.token_expiry,
      }).eq('id', config.id)
    }
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const eventsRes = await calendar.events.list({
    calendarId: config.calendar_id,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500,
  })

  const events = eventsRes.data.items || []

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .eq('user_id', userId)

  const serviceMap = new Map(services?.map(s => [s.name.toLowerCase(), s]) || [])

  let synced = 0
  let skipped = 0

  for (const event of events) {
    if (!event.id || !event.summary) continue

    const eventTitle = event.summary.trim()
    const service = serviceMap.get(eventTitle.toLowerCase())

    if (!service) {
      skipped++
      continue
    }

    const eventDate = event.start?.date || event.start?.dateTime?.split('T')[0]
    if (!eventDate) continue

    const incomeRecord = {
      user_id: userId,
      calendar_event_id: event.id,
      service_name: eventTitle,
      service_id: service.id,
      amount: service.price,
      date: eventDate,
      client_name: null,
    }

    const { error } = await supabase
      .from('income')
      .upsert(incomeRecord, { onConflict: 'user_id,calendar_event_id' })

    if (!error) synced++
  }

  await supabase.from('calendar_config').update({ last_sync: new Date().toISOString() }).eq('id', config.id)

  return NextResponse.json({ synced, skipped, total: events.length })
}
