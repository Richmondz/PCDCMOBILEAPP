import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import FadeInView from '../../components/FadeInView'

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
      const day = d.getDay()
      const diffToMonday = (day + 6) % 7
      d.setDate(d.getDate() - diffToMonday)
      d.setHours(0, 0, 0, 0)
      const weekStart = d.toISOString()

      const { count: checkins } = await supabase.from('check_ins').select('id', { count: 'exact' }).eq('user_id', user.id).gte('created_at', weekStart)
      const { count: tools } = await supabase.from('saved_tools').select('id', { count: 'exact' }).eq('user_id', user.id)
      
      setRecap({ 
        checkins: checkins || 0, 
        tools: tools || 0, 
        mentorMsgs: 0,
        loaded: true 
      })
    })()
  }, []))

  if (!recap.loaded) return null

  const checkinProgress = Math.min(recap.checkins / 7, 1)
  const insight = recap.checkins >= 3 
    ? "Great consistency! Keeping a rhythm helps build resilience." 
    : "Try to check in a few more times this week to track your mood."

  return (
    <FadeInView delay={80}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setExpanded(!expanded)} 
        style={[styles.card, expanded && styles.expanded]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconBg}>
              <Ionicons name="stats-chart" size={22} color={tokens.colors.light.primary} />
            </View>
            <Text style={styles.title}>Your Weekly Report</Text>
          </View>
          <View style={[styles.expandBtn, expanded && styles.expandBtnActive]}>
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={expanded ? tokens.colors.light.primary : tokens.colors.light.muted} />
          </View>
        </View>
        
        {!expanded ? (
          <View style={styles.summaryRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${checkinProgress * 100}%` }]} />
            </View>
            <Text style={styles.summary}>
              <Text style={styles.highlight}>{recap.checkins}/7</Text> check-ins · <Text style={styles.highlight}>{recap.tools}</Text> tools saved
            </Text>
          </View>
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
            <View style={styles.insightBox}>
              <Ionicons name="bulb-outline" size={18} color={tokens.colors.light.accent} />
              <Text style={styles.insight}>{insight}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </FadeInView>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.light.surface,
    borderRadius: tokens.radii.card,
    padding: tokens.spacing.s16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...tokens.shadows.md
  },
  expanded: {
    backgroundColor: '#F8FAFF',
    borderColor: 'rgba(99, 102, 241, 0.15)'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: '#EEF2FF', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: { fontSize: 17, fontWeight: '700', color: tokens.colors.light.text },
  expandBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.light.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  expandBtnActive: { backgroundColor: '#E0E7FF' },
  summaryRow: { gap: 8 },
  progressBar: {
    height: 6,
    backgroundColor: tokens.colors.light.surfaceHighlight,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.light.primary,
    borderRadius: 3
  },
  summary: { fontSize: 14, color: tokens.colors.light.textSecondary },
  highlight: { fontWeight: '700', color: tokens.colors.light.primary },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: tokens.colors.light.primary },
  statLabel: { fontSize: 12, color: tokens.colors.light.textSecondary, fontWeight: '600', marginTop: 4 },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)'
  },
  insight: { fontSize: 14, color: tokens.colors.light.textSecondary, flex: 1, fontStyle: 'italic' }
})
