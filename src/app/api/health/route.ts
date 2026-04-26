import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || new URL(request.url).host
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || 'https'
  const origin = `${proto}://${host}`
  return NextResponse.json({
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    googleClientId: !!process.env.GOOGLE_CLIENT_ID,
    googleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${origin}/api/auth/google/callback`,
    rawUrl: request.url,
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
  })
}
