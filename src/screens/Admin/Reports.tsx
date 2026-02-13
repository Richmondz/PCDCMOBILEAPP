import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'

export default function AdminReports() {
  const nav = useNavigation()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    // 1. Get all teens
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, role')
      .eq('role', 'teen')
      .order('nickname')

    if (!profiles) {
      setUsers([])
      setLoading(false)
      return
    }

    // 2. Get data for last 7 days for ALL users (simplified query)
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 7)

    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('user_id, mood')
      .gte('created_at', start.toISOString())

    const { data: tools } = await supabase
      .from('tool_usage_logs')
      .select('user_id')
      .gte('created_at', start.toISOString())

    const { data: activity } = await supabase
      .from('daily_activity')
      .select('user_id, minutes_active')
      .gte('date', start.toISOString())

    // 3. Aggregate
    const aggregated = profiles.map(p => {
      const pCheckIns = checkIns?.filter((c: any) => c.user_id === p.id) || []
      const pTools = tools?.filter((t: any) => t.user_id === p.id) || []
      const pActivity = activity?.filter((a: any) => a.user_id === p.id) || []
      
      const totalMinutes = pActivity.reduce((acc: number, a: any) => acc + a.minutes_active, 0)
      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      const timeString = `${hours}h ${mins}m`

      const avgMood = pCheckIns.length 
        ? (pCheckIns.reduce((acc: number, c: any) => acc + c.mood, 0) / pCheckIns.length).toFixed(1) 
        : '-'

      return {
        ...p,
        checkInCount: pCheckIns.length,
        toolCount: pTools.length,
        timeString,
        avgMood
      }
    })

    setUsers(aggregated)
    setLoading(false)
  }

  const renderRow = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.colName}>
        <Text style={styles.name}>{item.nickname}</Text>
        <Text style={styles.role}>{item.role}</Text>
      </View>
      <View style={styles.colStat}>
        <Text style={styles.statValue}>{item.checkInCount}</Text>
        <Text style={styles.statLabel}>Pulse</Text>
      </View>
      <View style={styles.colStat}>
        <Text style={styles.statValue}>{item.toolCount}</Text>
        <Text style={styles.statLabel}>Tools</Text>
      </View>
      <View style={styles.colStat}>
        <Text style={styles.statValue}>{item.timeString}</Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
      <View style={styles.colStat}>
        <Text style={[styles.statValue, { color: item.avgMood === '-' ? '#9CA3AF' : tokens.colors.light.primary }]}>
          {item.avgMood}
        </Text>
        <Text style={styles.statLabel}>Avg Mood</Text>
      </View>
    </View>
  )

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly User Reports</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>User</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Pulse</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Tools</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Time</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Mood</Text>
        </View>

        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
          ListEmptyComponent={<Text style={styles.empty}>No teen users found.</Text>}
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  list: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB'
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  colName: { flex: 2 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  role: { fontSize: 12, color: '#9CA3AF', textTransform: 'capitalize' },
  colStat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 32, color: '#9CA3AF' }
})