import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'

export default function EscalationInbox() {
  const [items, setItems] = useState<any[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  useEffect(() => { load() }, [])
  async function load() { const { data } = await supabase.from('escalations').select('*').order('created_at', { ascending: false }); setItems(data || []) }
  async function setStatus(id: string, status: string) { await supabase.from('escalations').update({ status }).eq('id', id); load() }
  async function addNote(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('escalation_notes').insert({ escalation_id: id, staff_id: user?.id, note: notes[id] })
    setNotes(n => ({ ...n, [id]: '' }))
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Escalations</Text>
      {items.map(it => (
        <View key={it.id} style={styles.card}>
          <Text>Reason: {it.reason}</Text>
          <Text>Severity: {it.severity}</Text>
          <Text>Status: {it.status}</Text>
          <View style={styles.row}>
            {['open','in_review','resolved'].map(s => (
              <TouchableOpacity key={s} style={styles.btn} onPress={() => setStatus(it.id, s)}><Text>{s}</Text></TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={() => addNote(it.id)}><Text>Add Note</Text></TouchableOpacity>
          </View>
        </View>
      ))}
      {!items.length && <Text style={{ color: tokens.colors.light.muted }}>No escalations</Text>}
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

