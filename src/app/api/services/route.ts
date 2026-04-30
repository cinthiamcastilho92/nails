import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getCurrentUserId } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase.from('services').select('*').eq('user_id', userId).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { name, price, color, active } = await request.json()
  const supabase = createServerClient()
  const { data, error } = await supabase.from('services').insert({ name, price, color, active, user_id: userId }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase.from('services').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id, name, price, color, active } = await request.json()
  const supabase = createServerClient()
  const { data, error } = await supabase.from('services').update({ name, price, color, active }).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
