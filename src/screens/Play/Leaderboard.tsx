import { useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { useLeaderboard, getLevel, LeaderboardEntry } from '../../store/leaderboard'
import { useProfile } from '../../store/profile'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

export default function Leaderboard() {
  const { entries, loading, loadLeaderboard } = useLeaderboard()
  const { profile } = useProfile()
  const trophyScale = useSharedValue(1)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  useEffect(() => {
    trophyScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    )
  }, [])

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }]
  }))

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', color: '#FFD700', bg: 'rgba(255,215,0,0.2)' }
    if (rank === 2) return { emoji: '🥈', color: '#C0C0C0', bg: 'rgba(192,192,192,0.2)' }
    if (rank === 3) return { emoji: '🥉', color: '#CD7F32', bg: 'rgba(205,127,50,0.2)' }
    return { emoji: `#${rank}`, color: tokens.colors.light.textSecondary, bg: 'transparent' }
  }

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rankStyle = getRankStyle(item.rank)
    const level = getLevel(item.weekly_xp)
    const isMe = profile?.id === item.user_id

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <View style={[styles.row, isMe && styles.myRow]}>
          <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
            <Text style={[styles.rankText, { color: rankStyle.color }]}>{rankStyle.emoji}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.nickname} {isMe && ' (You)'}</Text>
            <View style={styles.meta}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lvl {level}</Text>
              </View>
              <Text style={styles.xpText}>{item.weekly_xp} XP</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    )
  }

  const weekEnd = new Date()
  const day = weekEnd.getDay()
  const diff = day === 0 ? 1 : 8 - day
  weekEnd.setDate(weekEnd.getDate() + diff)

  return (
    <LinearGradient colors={['#F8FAFC', '#EEF2FF']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Crossy Road Leaderboard" showBack />
        
        <View style={styles.header}>
          <Animated.View style={[styles.trophyWrap, trophyStyle]}>
            <Text style={styles.trophy}>🏆</Text>
          </Animated.View>
          <Text style={styles.subtitle}>Top Crossy Road XP earners • Resets every Sunday</Text>
          <Text style={styles.weekEnd}>Next reset: {weekEnd.toLocaleDateString()}</Text>
        </View>

        <FlatList
          data={entries}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLeaderboard} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons name="trophy-outline" size={48} color={tokens.colors.light.textTertiary} />
                <Text style={styles.emptyText}>No XP yet this week. Play Crossy Trivia while signed in to earn XP and climb the leaderboard!</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  trophyWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.4)'
  },
  trophy: { fontSize: 36 },
  subtitle: { fontSize: 14, fontWeight: '600', color: tokens.colors.light.textSecondary },
  weekEnd: { fontSize: 12, color: tokens.colors.light.textTertiary },
  list: { padding: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.light.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
    ...tokens.shadows.sm
  },
  myRow: { borderWidth: 2, borderColor: tokens.colors.light.primary },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rankText: { fontSize: 16, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: tokens.colors.light.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  levelBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  levelText: { fontSize: 12, fontWeight: '800', color: tokens.colors.light.levelPurple },
  xpText: { fontSize: 13, fontWeight: '600', color: tokens.colors.light.xpGold },
  empty: { alignItems: 'center', marginTop: 48, gap: 16 },
  emptyText: { fontSize: 16, color: tokens.colors.light.textSecondary, textAlign: 'center' }
})
