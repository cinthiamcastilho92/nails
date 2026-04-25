import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getCurrentUserId } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) return NextResponse.json({ connected: false, last_sync: null })

  const supabase = createServerClient()
  const { data } = await supabase
    .from('calendar_config')
    .select('id, last_sync')
    .eq('user_id', userId)
    .limit(1)
    .single()

  return NextResponse.json({ connected: !!data, last_sync: data?.last_sync || null })
}
