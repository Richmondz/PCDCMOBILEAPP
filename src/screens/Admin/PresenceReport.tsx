import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import { useProfile } from '../../store/profile'

type Row = { user_id: string; nickname: string; role: 'teen'|'mentor'|'staff'; total_seconds: number }

export default function PresenceReport() {
  const nav = useNavigation<any>()
  const { profile } = useProfile()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!profile || profile.role !== 'staff') { nav.goBack(); return }
      setLoading(true)
      const { data } = await supabase.rpc('weekly_presence_totals', { tz: 'America/New_York' })
      setRows((data as Row[]) || [])
      setLoading(false)
    })()
  }, [profile])

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Weekly Presence (last week)</Text>
      {loading ? <Text>Loading…</Text> : (
        <FlatList
          data={rows.sort((a,b)=>b.total_seconds-a.total_seconds)}
          keyExtractor={(item)=>item.user_id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.nickname}</Text>
              <Text style={styles.val}>{formatDuration(item.total_seconds)}</Text>
            </View>
          )}
        />
      )}
      <TouchableOpacity style={styles.btn} onPress={()=>nav.goBack()}><Text>Back</Text></TouchableOpacity>
    </View>
  )
}

function formatDuration(s: number) {
  const h = Math.floor(s/3600)
  const m = Math.floor((s%3600)/60)
  return `${h}h ${m}m`
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: tokens.spacing.s8, borderBottomWidth: 1, borderColor: tokens.colors.light.border },
  name: { fontSize: tokens.typography.body },
  val: { fontSize: tokens.typography.body, fontWeight: '500' },
  btn: { marginTop: tokens.spacing.s12, backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.card, padding: tokens.spacing.s16 }
})

