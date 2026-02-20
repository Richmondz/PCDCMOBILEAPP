import { supabase } from '../lib/supabase'

function getLastWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diffToMonday = (day + 6) % 7
  d.setDate(d.getDate() - diffToMonday - 7)
  return d.toISOString().slice(0,10)
}

export async function ensureWeeklyRecap() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const weekStart = getLastWeekStart()
  const { data: existing } = await supabase.from('weekly_recaps').select('user_id').eq('user_id', user.id).eq('week_start', weekStart).limit(1)
  if (existing && existing.length) return
  const start = new Date(weekStart)
  const end = new Date(start); end.setDate(start.getDate() + 7)
  const { data: cis } = await supabase.from('check_ins').select('id').eq('user_id', user.id).gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
  const { data: tools } = await supabase.from('tool_usage_logs').select('id').eq('user_id', user.id).gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
  const { data: msgs } = await supabase.from('messages').select('sender_id,created_at').eq('receiver_id', user.id).gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
  const { data: profs } = await supabase.from('profiles').select('id,role').in('id', (msgs||[]).map((m:any)=>m.sender_id))
  const mentorSenders = new Set((profs||[]).filter((p:any)=>p.role==='mentor'||p.role==='staff').map((p:any)=>p.id))
  const mentorMsgs = (msgs||[]).filter((m:any)=>mentorSenders.has(m.sender_id)).length
  await supabase.from('weekly_recaps').insert({ user_id: user.id, week_start: weekStart, checkins_count: (cis||[]).length, tools_count: (tools||[]).length, mentor_msgs_count: mentorMsgs })
}

