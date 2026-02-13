import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import { Ionicons } from '@expo/vector-icons'

export default function WeeklyReport() {
  const [recap, setRecap] = useState({ checkins: 0, tools: 0, mentorMsgs: 0, loaded: false })
  const [expanded, setExpanded] = useState(false)

  const { useFocusEffect } = require('@react-navigation/native')
  const { useCallback } = require('react')

  useFocusEffect(useCallback(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const d = new Date()
      // If it's Sunday (0), treat as end of week. Monday (1) is start.
      const day = d.getDay()
      const diffToMonday = (day + 6) % 7
      d.setDate(d.getDate() - diffToMonday)
      d.setHours(0, 0, 0, 0)
      const weekStart = d.toISOString()

      // Fetch live counts for THIS week
      const { count: checkins } = await supabase.from('check_ins').select('id', { count: 'exact' }).eq('user_id', user.id).gte('created_at', weekStart)
      const { count: tools } = await supabase.from('saved_tools').select('id', { count: 'exact' }).eq('user_id', user.id)
      
      // For mentor messages, we'll implement this later once the chat system stats are needed
      // const { data: msgs } = await supabase.from('chat_messages').select('sender_id').eq('chat_id', 'TODO').gte('created_at', weekStart)
      
      setRecap({ 
        checkins: checkins || 0, 
        tools: tools || 0, 
        mentorMsgs: 0, // Keep 0 or fetch if critical
        loaded: true 
      })
    })()
  }, []))

  if (!recap.loaded) return null

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => setExpanded(!expanded)} style={[styles.card, expanded && styles.expanded]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBg}><Ionicons name="stats-chart" size={20} color="#4F46E5" /></View>
          <Text style={styles.title}>Your Weekly Report</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={tokens.colors.light.muted} />
      </View>
      
      {!expanded ? (
        <Text style={styles.summary}>
          You did <Text style={styles.highlight}>{recap.checkins} check-ins</Text> and saved <Text style={styles.highlight}>{recap.tools} tools</Text> last week.
        </Text>
      ) : (
        <View style={styles.details}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{recap.checkins}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{recap.tools}</Text>
              <Text style={styles.statLabel}>Tools Saved</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{recap.mentorMsgs}</Text>
              <Text style={styles.statLabel}>Mentor Msgs</Text>
            </View>
          </View>
          <Text style={styles.insight}>
            {recap.checkins >= 3 ? "Great consistency! Keeping a rhythm helps build resilience." : "Try to check in a few more times this week to track your mood."}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  expanded: {
    backgroundColor: '#EEF2FF',
    borderColor: '#E0E7FF'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  summary: { fontSize: 14, color: '#4B5563', marginLeft: 44 },
  highlight: { fontWeight: '600', color: '#4F46E5' },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#4F46E5' },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  insight: { fontSize: 14, color: '#4B5563', fontStyle: 'italic', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: 8 }
})
