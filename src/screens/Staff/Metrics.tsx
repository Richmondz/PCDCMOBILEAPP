import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'

function unique<T>(arr: T[]) { return Array.from(new Set(arr)) }

export default function Metrics() {
  const [data, setData] = useState<any>({ dau: 0, wau: 0, checkinPct: 0, promptPct: 0, mentorMsgRate: 0, escOpen: 0, repOpen: 0, medianResponseMins: 0 })
  useEffect(() => { (async () => {
    const now = new Date()
    const dayAgo = new Date(now); dayAgo.setDate(dayAgo.getDate() - 1)
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: actsDay } = await supabase.from('check_ins').select('user_id,created_at').gte('created_at', dayAgo.toISOString())
    const { data: msgsDay } = await supabase.from('messages').select('sender_id,created_at').gte('created_at', dayAgo.toISOString())
    const dau = unique([ ...(actsDay||[]).map((a:any)=>a.user_id), ...(msgsDay||[]).map((m:any)=>m.sender_id) ]).length

    const { data: actsWeek } = await supabase.from('check_ins').select('user_id,created_at').gte('created_at', weekAgo.toISOString())
    const { data: msgsWeek } = await supabase.from('messages').select('sender_id,created_at').gte('created_at', weekAgo.toISOString())
    const wau = unique([ ...(actsWeek||[]).map((a:any)=>a.user_id), ...(msgsWeek||[]).map((m:any)=>m.sender_id) ]).length

    const { data: teens } = await supabase.from('profiles').select('id').eq('role','teen')
    const today = new Date().toISOString().slice(0,10)
    const { data: todaysCheckins } = await supabase.from('check_ins').select('user_id').gte('created_at', `${today}T00:00:00Z`).lte('created_at', `${today}T23:59:59Z`)
    const checkinPct = Math.round(((unique((todaysCheckins||[]).map((c:any)=>c.user_id)).length) / ((teens||[]).length || 1)) * 100)

    const { data: prompt } = await supabase.from('daily_prompts').select('*').eq('active_date', today)
    const { data: posts } = await supabase.from('channel_posts').select('id,created_at')
    const promptPct = prompt && prompt.length ? Math.round(((posts||[]).filter((p:any)=>p.created_at.startsWith(today)).length / ((teens||[]).length || 1)) * 100) : 0

    const { data: profs } = await supabase.from('profiles').select('id,role')
    const mentorIds = new Set((profs||[]).filter((p:any)=>p.role==='mentor'||p.role==='staff').map((p:any)=>p.id))
    const mentorMsgRate = Math.round(((msgsWeek||[]).filter((m:any)=>mentorIds.has(m.sender_id)).length / (((msgsWeek||[]).length)||1)) * 100)

    const { data: esc } = await supabase.from('escalations').select('id,created_at,status')
    const escOpen = (esc||[]).filter((e:any)=>e.status!=='resolved').length
    const { data: rep } = await supabase.from('reports').select('id,status')
    const repOpen = (rep||[]).filter((r:any)=>r.status!=='resolved').length

    const { data: notes } = await supabase.from('escalation_notes').select('escalation_id,created_at')
    const times: number[] = []
    (esc||[]).forEach((e:any)=>{
      const n = (notes||[]).filter((x:any)=>x.escalation_id===e.id)
      if (n.length) times.push((new Date(n[0].created_at).getTime() - new Date(e.created_at).getTime())/60000)
    })
    times.sort((a,b)=>a-b)
    const mid = times.length ? times[Math.floor(times.length/2)] : 0

    setData({ dau, wau, checkinPct, promptPct, mentorMsgRate, escOpen, repOpen, medianResponseMins: Math.round(mid) })
  })() }, [])
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Staff Metrics</Text>
      <Text>DAU: {data.dau}</Text>
      <Text>WAU: {data.wau}</Text>
      <Text>Check-in completion: {data.checkinPct}%</Text>
      <Text>Prompt response: {data.promptPct}%</Text>
      <Text>Mentor message rate: {data.mentorMsgRate}%</Text>
      <Text>Open escalations: {data.escOpen}</Text>
      <Text>Open reports: {data.repOpen}</Text>
      <Text>Median staff response: {data.medianResponseMins} min</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s8 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' }
})

