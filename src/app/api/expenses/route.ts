import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getCurrentUserId } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const supabase = createServerClient()
  let query = supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false })

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(Number(year), Number(month), 0)
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    query = query.gte('date', start).lte('date', endStr)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const formData = await request.formData()
  const supabase = createServerClient()

  let receipt_url: string | null = null
  const file = formData.get('receipt') as File | null
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `receipts/${userId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('nails')
      .upload(filename, buffer, { contentType: file.type })
    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage.from('nails').getPublicUrl(filename)
      receipt_url = urlData.publicUrl
    }
  }

  const { data, error } = await supabase.from('expenses').insert({
    user_id: userId,
    date: formData.get('date') as string,
    amount: parseFloat(formData.get('amount') as string),
    category: formData.get('category') as string,
    description: formData.get('description') as string || null,
    receipt_url,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const userId = await getCurrentUserId(request)
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await request.json()
  const supabase = createServerClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
