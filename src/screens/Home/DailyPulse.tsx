import { View, StyleSheet, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import MoodPicker from '../../components/MoodPicker'
import TagChips from '../../components/TagChips'
import Composer from '../../components/Composer'
import { PrimaryButton } from '../../components/Buttons'
import { useDailyPulse } from '../../store/dailyPulse'
import { tokens } from '../../theme/tokens'
import { useEffect } from 'react'
import FadeInView from '../../components/FadeInView'
import { Ionicons } from '@expo/vector-icons'

export default function DailyPulse() {
  const { mood, setMood, tags, toggleTag, note, setNote, saveCheckIn, hasCheckedInToday, checkIfUserHasCheckedIn } = useDailyPulse()

  useEffect(() => {
    checkIfUserHasCheckedIn()
  }, [])

  if (hasCheckedInToday) {
    return (
      <FadeInView delay={100}>
        <LinearGradient
          colors={['#ECFDF5', '#D1FAE5']}
          style={styles.successCard}
        >
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={tokens.colors.light.success} />
          </View>
          <Text style={styles.successTitle}>You've checked in today!</Text>
          <Text style={styles.successSubtitle}>
            Great job on tracking your mood. Come back tomorrow to keep your streak going.
          </Text>
        </LinearGradient>
      </FadeInView>
    )
  }

  return (
    <FadeInView delay={50}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>How are you feeling?</Text>
          <Text style={styles.hint}>+25 XP per check-in</Text>
        </View>
        <View style={styles.wrap}>
          <MoodPicker value={mood} onChange={setMood} />
          <TagChips value={tags} onToggle={toggleTag} />
          <Composer value={note} onChange={setNote} limit={280} placeholder="Add a note (optional)..." />
          <PrimaryButton title="Save Check-in" onPress={saveCheckIn} />
        </View>
      </View>
    </FadeInView>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.light.surface,
    borderRadius: tokens.radii.card,
    padding: 20,
    ...tokens.shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.light.text
  },
  hint: { fontSize: 12, fontWeight: '600', color: tokens.colors.light.xpGold },
  wrap: { gap: 16 },
  successCard: {
    borderRadius: tokens.radii.card,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    ...tokens.shadows.sm
  },
  successIcon: { marginBottom: 12 },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.light.text,
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 15,
    color: tokens.colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22
  }
})
