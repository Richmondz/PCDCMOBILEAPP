import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function WeeklyReport() {
  const [moods, setMoods] = useState<any[]>([])
  const [tools, setTools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6) // Last 7 days

    // Load Check-ins
    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('mood, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true })

    // Load Tool Usage
    const { data: toolLogs } = await supabase
      .from('tool_usage_logs')
      .select('tool_key, created_at, duration_seconds')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false })

    setMoods(checkIns || [])
    setTools(toolLogs || [])
    setLoading(false)
  }

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  }

  // Aggregate mood by day (take average or last)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayStr = d.toISOString().slice(0, 10)
    const dayMoods = moods.filter(m => m.created_at.startsWith(dayStr))
    const avgMood = dayMoods.length 
      ? dayMoods.reduce((acc, c) => acc + c.mood, 0) / dayMoods.length 
      : 0
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), value: avgMood }
  })

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Weekly Report" showBack />
        
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Mood Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mood History</Text>
            <View style={styles.chartContainer}>
              {chartData.map((d, i) => (
                <View key={i} style={styles.barGroup}>
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={[tokens.colors.light.primaryGradientStart, tokens.colors.light.primaryGradientEnd]}
                      style={[styles.bar, { height: `${(d.value / 5) * 100}%` }]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{d.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              <Text style={styles.legendText}>1 = Low</Text>
              <Text style={styles.legendText}>5 = Great</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{moods.length}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{tools.length}</Text>
              <Text style={styles.statLabel}>Tools Used</Text>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Exercises</Text>
            {tools.length === 0 ? (
              <Text style={styles.emptyText}>No exercises completed this week.</Text>
            ) : (
              tools.map((t, i) => (
                <View key={i} style={styles.toolRow}>
                  <View style={styles.toolIcon}>
                    <Ionicons 
                      name={t.tool_key === 'breathing' ? 'leaf' : t.tool_key === 'grounding' ? 'body' : 'swap-horizontal'} 
                      size={20} 
                      color={tokens.colors.light.primary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toolName}>{t.tool_key.charAt(0).toUpperCase() + t.tool_key.slice(1)}</Text>
                    <Text style={styles.toolDate}>
                      {new Date(t.created_at).toLocaleDateString()} • {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {t.duration_seconds && (
                    <Text style={styles.duration}>{Math.round(t.duration_seconds)}s</Text>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 8
  },
  barGroup: { alignItems: 'center', gap: 8, flex: 1 },
  barTrack: { 
    width: 8, 
    height: '100%', 
    backgroundColor: '#F3F4F6', 
    borderRadius: 4, 
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },
  bar: { width: '100%', borderRadius: 4 },
  dayLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendText: { fontSize: 12, color: '#9CA3AF' },

  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  statValue: { fontSize: 24, fontWeight: '800', color: tokens.colors.light.primary },
  statLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },

  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  toolIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#EFF6FF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  toolName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  toolDate: { fontSize: 12, color: '#9CA3AF' },
  duration: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: 16 }
})