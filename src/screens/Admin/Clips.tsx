import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'

export default function AdminClips() {
  const [clips, setClips] = useState<any[]>([])
  const [today, setToday] = useState<string>('')
  useEffect(() => { load() }, [])
  async function load() { const { data } = await supabase.from('clips').select('*').order('created_at', { ascending: false }); setClips(data || []) }
  async function setAsToday(id: string) {
    const date = today || new Date().toISOString().slice(0,10)
    await supabase.from('clips').update({ active_date: date }).eq('id', id)
    load()
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Clips Scheduler</Text>
      <View style={styles.row}><Text>Set date (YYYY-MM-DD):</Text></View>
      {clips.map(c => (
        <View key={c.id} style={styles.card}>
          <Text>{c.title}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => setAsToday(c.id)}><Text>Pin to Today</Text></TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  card: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.card, padding: tokens.spacing.s12 },
  btn: { backgroundColor: '#EEF2FF', borderRadius: tokens.radii.button, paddingVertical: 6, paddingHorizontal: 10 },
  row: { paddingVertical: tokens.spacing.s8 }
})

