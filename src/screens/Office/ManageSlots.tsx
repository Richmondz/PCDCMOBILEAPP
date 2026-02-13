import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import Composer from '../../components/Composer'

export default function ManageSlots() {
  const [slots, setSlots] = useState<any[]>([])
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  useEffect(() => { load() }, [])
  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('office_slots').select('*').eq('mentor_id', user.id).order('start_at', { ascending: true })
    setSlots(data || [])
  }
  async function add() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('office_slots').insert({ mentor_id: user.id, start_at: start, end_at: end })
    setStart(''); setEnd(''); load()
  }
  async function toggle(id: string, available: boolean) {
    await supabase.from('office_slots').update({ available: !available }).eq('id', id)
    load()
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Office Hours Slots</Text>
      <Text>Start (ISO)</Text>
      <Composer value={start} onChange={setStart} limit={30} />
      <Text>End (ISO)</Text>
      <Composer value={end} onChange={setEnd} limit={30} />
      <TouchableOpacity style={styles.btn} onPress={add}><Text>Add Slot</Text></TouchableOpacity>
      {slots.map(s => (
        <View key={s.id} style={styles.row}>
          <Text>{s.start_at} - {s.end_at}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => toggle(s.id, s.available)}><Text>{s.available ? 'Disable' : 'Enable'}</Text></TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  btn: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.button, padding: tokens.spacing.s12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: tokens.spacing.s8 }
})

