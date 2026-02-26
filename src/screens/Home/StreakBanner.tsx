import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import FadeInView from '../../components/FadeInView'

const XP_PER_CHECKIN = 25
const XP_PER_LEVEL = 100

function getLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

function getProgressInLevel(xp: number) {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL
}

export default function StreakBanner() {
  const [count, setCount] = useState(0)
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const start = new Date()
      start.setDate(start.getDate() - 6)
      const { data } = await supabase
        .from('check_ins')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
      setCount((data || []).length)
    })()
  }, [])

  const xp = count * XP_PER_CHECKIN
  const level = getLevel(xp)
  const progress = getProgressInLevel(xp)

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }))

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    )
  }, [])

  return (
    <FadeInView delay={0} direction="up">
      <LinearGradient
        colors={['#FFF7ED', '#FFEDD5', '#FEF3C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.content}>
          <View style={styles.left}>
            <Animated.View style={[styles.fireBadge, fireStyle]}>
              <Text style={styles.fireEmoji}>🔥</Text>
            </Animated.View>
            <View style={styles.textBlock}>
              <Text style={styles.streakCount}>{count}</Text>
              <Text style={styles.streakLabel}>check-ins this week</Text>
            </View>
          </View>
          <View style={styles.right}>
            <View style={styles.xpBadge}>
              <Ionicons name="star" size={14} color={tokens.colors.light.xpGold} />
              <Text style={styles.xpText}>{xp} XP</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lvl {level}</Text>
            </View>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[tokens.colors.light.streakFire, tokens.colors.light.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]}
          />
        </View>
      </LinearGradient>
    </FadeInView>
  )
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: tokens.radii.card,
    padding: tokens.spacing.s16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    overflow: 'hidden',
    ...tokens.shadows.md
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.s12
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.s12 },
  fireBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fireEmoji: { fontSize: 28 },
  textBlock: { gap: 2 },
  streakCount: {
    fontSize: 28,
    fontWeight: '800',
    color: tokens.colors.light.text,
    letterSpacing: -0.5
  },
  streakLabel: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.light.textSecondary,
    fontWeight: '600'
  },
  right: { alignItems: 'flex-end', gap: 6 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radii.full
  },
  xpText: { fontSize: 12, fontWeight: '800', color: tokens.colors.light.xpGold },
  levelBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radii.full
  },
  levelText: { fontSize: 12, fontWeight: '800', color: tokens.colors.light.levelPurple },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  }
})
