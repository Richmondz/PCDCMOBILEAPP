import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'

export default function RequestSlot() {
  const [slots, setSlots] = useState<any[]>([])
  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: assign } = await supabase.from('mentor_assignments').select('mentor_id').eq('teen_id', user.id)
    const mentorId = assign?.[0]?.mentor_id
    if (!mentorId) return
    const { data } = await supabase.from('office_slots').select('*').eq('mentor_id', mentorId).eq('available', true).order('start_at', { ascending: true })
    setSlots(data || [])
  })() }, [])
  async function request(slotId: string, start_at: string, end_at: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: assign } = await supabase.from('mentor_assignments').select('mentor_id').eq('teen_id', user!.id)
    const mentorId = assign?.[0]?.mentor_id
    await supabase.from('office_hours').insert({ mentor_id: mentorId, teen_id: user!.id, start_at, end_at, status: 'requested', slot_id: slotId })
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Request Office Hours</Text>
      {slots.map(s => (
        <View key={s.id} style={styles.row}>
          <Text>{s.start_at} - {s.end_at}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => request(s.id, s.start_at, s.end_at)}><Text>Request</Text></TouchableOpacity>
        </View>
      ))}
      {!slots.length && <Text style={{ color: tokens.colors.light.muted }}>No available slots</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: tokens.spacing.s8 },
  btn: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.button, padding: tokens.spacing.s12 }
})

