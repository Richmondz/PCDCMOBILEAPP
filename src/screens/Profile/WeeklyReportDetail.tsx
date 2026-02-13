import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'

export default function WeeklyReportDetail() {
  const [data, setData] = useState({ 
    checkins: 0, 
    tools: 0, 
    msgs: 0, 
    moods: [] as number[],
    avgMood: 0 
  })

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const d = new Date()
    const day = d.getDay()
    const diffToMonday = (day + 6) % 7
    d.setDate(d.getDate() - diffToMonday)
    d.setHours(0, 0, 0, 0)
    const weekStart = d.toISOString()

    // 1. Live Check-ins
    const { data: cis } = await supabase.from('check_ins').select('mood').eq('user_id', user.id).gte('created_at', weekStart)
    const checkins = cis?.length || 0
    
    // 2. Mood Trends
    const moods = (cis || []).map((c: any) => c.mood).filter(Boolean)
    const avgMood = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : 0

    // 3. Live Tools
    const { count: tools } = await supabase.from('saved_tools').select('id', { count: 'exact' }).eq('user_id', user.id)

    // 4. Messages (simplified)
    const { count: msgs } = await supabase.from('messages').select('id', { count: 'exact' }).eq('sender_id', user.id).gte('created_at', weekStart)

    setData({ checkins, tools: tools || 0, msgs: msgs || 0, moods, avgMood: Number(avgMood) })
  })() }, [])

  const StatCard = ({ label, value, icon, color, sub }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
      </View>
    </View>
  )

  return (
    <LinearGradient colors={['#F9FAFB', '#EEF2FF']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Weekly Report" showBack />
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <Text style={styles.intro}>Here is your activity for this week (since Monday).</Text>

          <View style={styles.grid}>
            <StatCard label="Check-ins" value={data.checkins} icon="pulse" color="#EF4444" sub="Daily Pulse" />
            <StatCard label="Avg Mood" value={data.avgMood || '-'} icon="happy" color="#F59E0B" sub="Out of 5" />
            <StatCard label="Tools Saved" value={data.tools} icon="build" color="#10B981" sub="Resources" />
            <StatCard label="Messages" value={data.msgs} icon="chatbubbles" color="#3B82F6" sub="Sent" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood Trend</Text>
            <View style={styles.chart}>
              {data.moods.length ? (
                <View style={styles.bars}>
                  {data.moods.map((m, i) => (
                    <View key={i} style={styles.barCol}>
                      <View style={[styles.bar, { height: m * 20, backgroundColor: m >= 3 ? '#10B981' : '#F59E0B' }]} />
                      <Text style={styles.barLabel}>{i + 1}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.empty}>No mood data yet this week.</Text>
              )}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 20, gap: 24 },
  intro: { fontSize: 16, color: '#6B7280', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { 
    width: '48%', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 16, 
    gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  statSub: { fontSize: 12, color: '#9CA3AF' },
  section: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  chart: { height: 150, justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: '100%' },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 12, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' }
})
