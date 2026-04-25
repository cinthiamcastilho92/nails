import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getCurrentUserId } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const supabase = createServerClient()
  let query = supabase.from('income').select('*').eq('user_id', userId).order('date', { ascending: false })

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(Number(year), Number(month), 0).getDate()
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('date', start).lte('date', end)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
