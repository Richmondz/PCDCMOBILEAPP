import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export default async function handler(req: Request): Promise<Response> {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(url, key)
  const timeout = 180
  const { data, error } = await supabase.rpc('close_stale_sessions', { timeout_seconds: timeout })
  if (error) return new Response(error.message, { status: 500 })
  return new Response(JSON.stringify({ closed: data || 0 }), { headers: { 'Content-Type': 'application/json' } })
}

