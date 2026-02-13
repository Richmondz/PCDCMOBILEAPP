import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import { useNavigation } from '@react-navigation/native'

export default function Dashboard() {
  const nav = useNavigation<any>()
  const [counts, setCounts] = useState<any>({ reqs: 0, escOpen: 0, escHigh: 0, reportsOpen: 0, unassigned: 0, promptToday: false, clipsToday: 0 })
  useEffect(() => { (async () => {
    const today = new Date().toISOString().slice(0,10)
    const { data: reqs } = await supabase.from('membership_requests').select('id').eq('status','pending')
    const { data: esc } = await supabase.from('escalations').select('severity,status')
    const escOpen = (esc||[]).filter((e:any)=>e.status==='open').length
    const escHigh = (esc||[]).filter((e:any)=>e.status!=='resolved' && e.severity==='high').length
    const { data: reps } = await supabase.from('reports').select('id,status')
    const reportsOpen = (reps||[]).filter((r:any)=>r.status!=='resolved').length
    const { data: teens } = await supabase.from('profiles').select('id').eq('role','teen')
    const { data: assigned } = await supabase.from('mentor_assignments').select('teen_id')
    const assignedSet = new Set((assigned||[]).map((a:any)=>a.teen_id))
    const unassigned = (teens||[]).filter((t:any)=>!assignedSet.has(t.id)).length
    const { data: prompt } = await supabase.from('daily_prompts').select('active_date').eq('active_date', today)
    const promptToday = !!(prompt&&prompt.length)
    const { data: clips } = await supabase.from('clips').select('id').eq('active_date', today)
    const clipsToday = (clips||[]).length
    setCounts({ reqs: (reqs||[]).length, escOpen, escHigh, reportsOpen, unassigned, promptToday, clipsToday })
  })() }, [])
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Staff Dashboard</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => nav.navigate('AdminRequests')}><Text>Pending Requests: {counts.reqs}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => nav.navigate('EscalationInbox')}><Text>Open Escalations: {counts.escOpen}</Text><Text>High: {counts.escHigh}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => nav.navigate('ModerationQueue')}><Text>Open Reports: {counts.reportsOpen}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => nav.navigate('AdminMentors')}><Text>Unassigned Teens: {counts.unassigned}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => nav.navigate('AdminPrompts')}><Text>Prompt Today: {counts.promptToday ? 'Yes' : 'No'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => nav.navigate('AdminClips')}><Text>Clips Today: {counts.clipsToday}</Text></TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.s12 },
  card: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.card, padding: tokens.spacing.s12, width: '48%' }
})

