import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()
  const { data } = await supabase.from('calendar_config').select('id, last_sync').limit(1).single()
  return NextResponse.json({ connected: !!data, last_sync: data?.last_sync || null })
}
