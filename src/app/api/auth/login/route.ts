import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookieName, getSessionCookieValue } from '@/lib/auth'
import { verifyPassword } from '@/lib/crypto'
import { createServerClient } from '@/lib/supabase/server'

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const supabase = createServerClient()

  // Verifica rate limit
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('attempted_at', windowStart)

  if ((count || 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: `Demasiadas tentativas. Aguarda ${WINDOW_MINUTES} minutos.` },
      { status: 429 }
    )
  }

  const { password } = await request.json()
  const storedHash = process.env.APP_PASSWORD_HASH

  // Fallback para APP_PASSWORD em texto simples (compatibilidade)
  let isValid = false
  if (storedHash) {
    isValid = await verifyPassword(password, storedHash)
  } else {
    isValid = password === process.env.APP_PASSWORD
  }

  if (!isValid) {
    await supabase.from('login_attempts').insert({ ip })
    const remaining = MAX_ATTEMPTS - ((count || 0) + 1)
    return NextResponse.json(
      { error: remaining > 0 ? `Password incorreta. ${remaining} tentativa(s) restante(s).` : 'Demasiadas tentativas.' },
      { status: 401 }
    )
  }

  // Sucesso — limpa tentativas desta IP
  await supabase.from('login_attempts').delete().eq('ip', ip)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(getSessionCookieName(), getSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return response
}
