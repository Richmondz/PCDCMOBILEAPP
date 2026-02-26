import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const moods = [
  { emoji: '😞', label: 'Low' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😊', label: 'Good' },
  { emoji: '🙂', label: 'Great' },
  { emoji: '😄', label: 'Amazing' }
]

export default function MoodPicker({ value, onChange }: { value: number | null; onChange: (m: number) => void }) {
  return (
    <View style={styles.row}>
      {moods.map((m, i) => (
        <MoodButton
          key={i}
          emoji={m.emoji}
          label={m.label}
          active={value === i + 1}
          onPress={() => onChange(i + 1)}
        />
      ))}
    </View>
  )
}

function MoodButton({ emoji, label, active, onPress }: { emoji: string; label: string; active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  return (
    <TouchableOpacity
      onPressIn={() => { scale.value = withSpring(0.92) }}
      onPressOut={() => { scale.value = withSpring(1) }}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View style={[styles.btn, active && styles.active, animatedStyle]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: tokens.spacing.s8, flexWrap: 'wrap' },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: tokens.radii.button,
    backgroundColor: tokens.colors.light.surfaceHighlight,
    alignItems: 'center',
    minWidth: 56,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  active: {
    backgroundColor: '#E0E7FF',
    borderColor: tokens.colors.light.primary
  },
  emoji: { fontSize: 24, marginBottom: 4 },
  label: { fontSize: 10, fontWeight: '600', color: tokens.colors.light.textSecondary },
  activeLabel: { color: tokens.colors.light.primary }
})
