import { getSupabaseClient } from './supabase/client'

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const supabase = getSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
