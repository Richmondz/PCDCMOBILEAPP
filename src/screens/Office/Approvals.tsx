import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'

export default function Approvals() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => { load() }, [])
  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: list } = await supabase.from('office_hours').select('*').or(`mentor_id.eq.${user.id},teen_id.eq.${user.id}`).eq('status','requested').order('start_at', { ascending: true })
    setItems(list || [])
  }
  async function setStatus(id: string, status: string) {
    await supabase.from('office_hours').update({ status }).eq('id', id)
    const row = (await supabase.from('office_hours').select('teen_id,start_at').eq('id', id).single()).data
    try {
      await supabase.functions.invoke('office-push', { body: { teenId: row?.teen_id, startAt: row?.start_at, title: status==='approved'?'Office hours approved':'Office hours update', body: status } })
    } catch {}
    load()
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Office Hours Approvals</Text>
      {items.map(it => (
        <View key={it.id} style={styles.card}>
          <Text>{it.start_at} - {it.end_at}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={() => setStatus(it.id, 'approved')}><Text>Approve</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => setStatus(it.id, 'declined')}><Text>Deny</Text></TouchableOpacity>
          </View>
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
  btn: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.button, padding: tokens.spacing.s12 }
})
