import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

const url = Deno.env.get('SUPABASE_URL')!
const key = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(url, key)

function inQuietHours(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const s = new Date(now); s.setHours(sh||0, sm||0, 0, 0)
  const e = new Date(now); e.setHours(eh||0, em||0, 0, 0)
  if (e <= s) return now >= s || now <= e
  return now >= s && now <= e
}

export default async function handler(req: Request): Promise<Response> {
  const body = await req.json()
  const { conversationId, messageId } = body
  const { data: msg } = await supabase.from('messages').select('sender_id').eq('id', messageId).single()
  const { data: members } = await supabase.from('conversation_members').select('user_id').eq('conversation_id', conversationId)
  const recipients = (members||[]).map((m:any)=>m.user_id).filter((id:string)=>id!==msg?.sender_id)
  if (!recipients.length) return new Response(JSON.stringify({ ok: true }))
  const { data: profs } = await supabase.from('profiles').select('id,push_enabled,quiet_hours_start,quiet_hours_end').in('id', recipients)
  const allowed = (profs||[]).filter((p:any)=>p.push_enabled && !inQuietHours(p.quiet_hours_start||null, p.quiet_hours_end||null)).map((p:any)=>p.id)
  if (!allowed.length) return new Response(JSON.stringify({ ok: true }))
  const { data: tokens } = await supabase.from('device_tokens').select('user_id,token').in('user_id', allowed)
  const messages = (tokens||[]).map((t:any)=>({ to: t.token, sound: 'default', title: 'Mentor replied', body: 'Open Inbox to view' }))
  if (!messages.length) return new Response(JSON.stringify({ ok: true }))
  await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(messages) })
  return new Response(JSON.stringify({ ok: true }))
}

serve(handler)
