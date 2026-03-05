import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import { useProfile } from '../../store/profile'
import AppHeader from '../../components/AppHeader'

type Row = { user_id: string; nickname: string; role: string; total_minutes: number; total_seconds?: number }

export default function PresenceReport() {
  const nav = useNavigation<any>()
  const { profile } = useProfile()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!profile || !['staff', 'mentor', 'admin'].includes(profile.role)) { nav.goBack(); return }
      setLoading(true)
      setError(null)
      try {
        // Use weekly_activity_totals - populated by ActivityTracker every 60s (daily_activity)
        // Falls back to presence_sessions if that RPC exists and returns data
        const { data: activityData, error: activityErr } = await supabase.rpc('weekly_activity_totals')
        if (activityErr) {
          setError(activityErr.message)
          setRows([])
        } else {
          const items = ((activityData as Row[]) || []).filter(r => r.total_minutes > 0)
          setRows(items.sort((a, b) => (b.total_minutes || 0) - (a.total_minutes || 0)))
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
        setRows([])
      }
      setLoading(false)
    })()
  }, [profile])

  return (
    <View style={styles.wrap}>
      <AppHeader title="Weekly Time on App" showBack />
      <Text style={styles.title}>Last 7 days (minutes active per user)</Text>
      <Text style={styles.subtitle}>From activity pings while app is open</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text>Loading…</Text> : (
        <FlatList
          data={rows}
          keyExtractor={(item)=>item.user_id}
          contentContainerStyle={rows.length === 0 ? styles.empty : undefined}
          ListEmptyComponent={!loading && !error ? <Text style={styles.emptyText}>No activity data yet. Users need to have the app open; activity is recorded every minute.</Text> : null}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.nickname}</Text>
              <Text style={styles.val}>{formatMinutes(item.total_minutes)}</Text>
            </View>
          )}
        />
      )}
      <TouchableOpacity style={styles.btn} onPress={()=>nav.goBack()}><Text>Back</Text></TouchableOpacity>
    </View>
  )
}

function formatMinutes(m: number) {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const mins = m % 60
  return mins ? `${h}h ${mins}m` : `${h}h`
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: -4, marginBottom: 8 },
  error: { color: '#DC2626', fontSize: 14, marginBottom: 8 },
  empty: { paddingVertical: 24 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: tokens.spacing.s8, borderBottomWidth: 1, borderColor: tokens.colors.light.border },
  name: { fontSize: tokens.typography.body },
  val: { fontSize: tokens.typography.body, fontWeight: '500' },
  btn: { marginTop: tokens.spacing.s12, backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.card, padding: tokens.spacing.s16 }
})

