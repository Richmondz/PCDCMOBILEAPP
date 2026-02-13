import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'

export default function AdminRequests() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('membership_requests').select('id, cohort_id, user_id, status, created_at')
    setItems(data || [])
  }
  async function approve(id: string, cohort_id: string, user_id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('cohort_memberships').insert({ cohort_id, user_id, status: 'active' })
    await supabase.from('membership_requests').update({ status: 'approved' }).eq('id', id)
    await supabase.from('audit_logs').insert({ actor_id: user?.id, action: 'approve_membership', target_type: 'membership_request', target_id: id, meta: { cohort_id, user_id } })
    load()
  }
  async function deny(id: string, cohort_id: string, user_id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('membership_requests').update({ status: 'rejected' }).eq('id', id)
    await supabase.from('audit_logs').insert({ actor_id: user?.id, action: 'deny_membership', target_type: 'membership_request', target_id: id, meta: { cohort_id, user_id } })
    load()
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Membership Requests</Text>
      {items.map(r => (
        <View key={r.id} style={styles.card}>
          <Text>Request {r.id}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={() => approve(r.id, r.cohort_id, r.user_id)}><Text>Approve</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => deny(r.id, r.cohort_id, r.user_id)}><Text>Deny</Text></TouchableOpacity>
          </View>
          <Text>Status: {r.status}</Text>
        </View>
      ))}
      {!items.length && <Text style={{ color: tokens.colors.light.muted }}>No requests</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  card: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.card, padding: tokens.spacing.s12, gap: tokens.spacing.s8 },
  row: { flexDirection: 'row', gap: tokens.spacing.s8 },
  btn: { backgroundColor: '#EEF2FF', borderRadius: tokens.radii.button, paddingVertical: 6, paddingHorizontal: 10 }
})

