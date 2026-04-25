import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/google', '/api/auth/google/callback']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isApi = pathname.startsWith('/api/')

  if (!isPublic && !isApi) {
    // Optimistic check: look for any Supabase session cookie
    const hasSession = request.cookies.getAll().some(c => c.name.includes('auth-token'))
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
