import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

const url = Deno.env.get('SUPABASE_URL')!
const anon = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(url, anon)

export default async function handler(req: Request): Promise<Response> {
  const { teenId, startAt, title, body } = await req.json()
  const { data: prof } = await supabase.from('profiles').select('push_enabled,quiet_hours_start,quiet_hours_end').eq('id', teenId).single()
  if (!prof?.push_enabled) return new Response(JSON.stringify({ ok: true }))
  const { data: tokens } = await supabase.from('device_tokens').select('token').eq('user_id', teenId)
  const messages = (tokens||[]).map((t:any)=>({ to: t.token, sound: 'default', title, body }))
  if (messages.length) await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(messages) })
  return new Response(JSON.stringify({ ok: true }))
}

serve(handler)

