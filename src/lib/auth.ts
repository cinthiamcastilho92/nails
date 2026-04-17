import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SESSION_COOKIE = 'nails_session'
const SESSION_VALUE = 'authenticated'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

export function isAuthenticatedFromRequest(request: NextRequest): boolean {
  return request.cookies.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

export function getSessionCookieName() {
  return SESSION_COOKIE
}

export function getSessionCookieValue() {
  return SESSION_VALUE
}
