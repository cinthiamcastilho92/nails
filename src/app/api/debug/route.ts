import { NextResponse } from 'next/server'
import { getCurrentUserId, createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll().map(c => c.name)
  const userId = await getCurrentUserId()

  let calendarConfig = null
  if (userId) {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('calendar_config')
      .select('id, calendar_id, last_sync')
      .eq('user_id', userId)
      .limit(1)
      .single()
    calendarConfig = data
  }

  return NextResponse.json({ userId, cookieNames: allCookies, calendarConfig })
}
