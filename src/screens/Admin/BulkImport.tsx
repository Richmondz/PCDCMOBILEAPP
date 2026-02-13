import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import Composer from '../../components/Composer'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'

export default function BulkImport() {
  const [csv, setCsv] = useState('email,nickname,role,cohort,mentor_email\n')
  const [logs, setLogs] = useState<any[]>([])
  const [cohort, setCohort] = useState('')
  const [exportText, setExportText] = useState('')
  async function runImport() {
    try {
      const { data } = await supabase.functions.invoke('bulk-import', { body: { csv } })
      setLogs(data?.logs || [])
    } catch (e) {
      setLogs([{ email: 'ERROR', ok: false, message: 'Edge function bulk-import not deployed' }])
    }
  }
  async function approveAll() {
    const { data: reqs } = await supabase.from('membership_requests').select('*').eq('cohort_id', cohort).eq('status','pending')
    const { data: { user } } = await supabase.auth.getUser()
    for (const r of (reqs||[])) {
      await supabase.from('cohort_memberships').upsert({ cohort_id: r.cohort_id, user_id: r.user_id, status: 'active' })
      await supabase.from('membership_requests').update({ status: 'approved' }).eq('id', r.id)
      await supabase.from('audit_logs').insert({ actor_id: user?.id, action: 'approve_membership', target_type: 'membership_request', target_id: r.id, meta: { cohort_id: r.cohort_id, user_id: r.user_id } })
    }
  }
  async function roundRobinAssign() {
    const { data: teens } = await supabase.from('cohort_memberships').select('user_id').eq('cohort_id', cohort)
    const { data: mentors } = await supabase.from('cohort_memberships').select('user_id').eq('cohort_id', cohort)
    const { data: profs } = await supabase.from('profiles').select('id,role').in('id', (mentors||[]).map((m:any)=>m.user_id))
    const mentorIds = (profs||[]).filter((p:any)=>p.role==='mentor').map((p:any)=>p.id)
    let i = 0
    for (const t of (teens||[])) {
      const teenId = t.user_id
      const already = await supabase.from('mentor_assignments').select('*').eq('teen_id', teenId)
      if (already?.length) continue
      const mId = mentorIds[i % mentorIds.length]
      if (mId) await supabase.from('mentor_assignments').insert({ teen_id: teenId, mentor_id: mId })
      i++
    }
  }
  async function exportUsers() {
    const { data } = await supabase.from('profiles').select('id,nickname,role')
    const { data: mems } = await supabase.from('cohort_memberships').select('cohort_id,user_id')
    const rows = (data||[]).map((p:any)=>{
      const m = (mems||[]).find((x:any)=>x.user_id===p.id)
      return `${p.id},${p.nickname},${p.role},${m?.cohort_id||''}`
    })
    setExportText(['id,nickname,role,cohort_id',...rows].join('\n'))
  }
  return (
    <ScrollView style={styles.wrap}>
      <Text style={styles.title}>Bulk Import</Text>
      <Composer value={csv} onChange={setCsv} limit={100000} />
      <TouchableOpacity style={styles.btn} onPress={runImport}><Text>Run Import</Text></TouchableOpacity>
      {logs.map((l,i)=>(<Text key={i}>{l.email}: {l.ok?'OK':'ERR'}</Text>))}
      <Text style={styles.title}>Batch Actions</Text>
      <Composer value={cohort} onChange={setCohort} limit={200} />
      <TouchableOpacity style={styles.btn} onPress={approveAll}><Text>Approve All Pending</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={roundRobinAssign}><Text>Assign Mentors Round-Robin</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={exportUsers}><Text>Export Users</Text></TouchableOpacity>
      {exportText ? <Composer value={exportText} onChange={()=>{}} limit={100000} /> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { padding: tokens.spacing.s16 },
  title: { fontSize: tokens.typography.header, fontWeight: '600', marginBottom: tokens.spacing.s8 },
  btn: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.button, padding: tokens.spacing.s12, marginTop: tokens.spacing.s8 }
})
