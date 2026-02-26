import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const TOOL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Breathing: 'water-outline',
  Grounding: 'leaf-outline',
  Reframe: 'swap-horizontal-outline'
}

export default function QuickToolChip({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const icon = TOOL_ICONS[label] || 'sparkles-outline'

  return (
    <TouchableOpacity
      onPressIn={() => { scale.value = withSpring(0.95) }}
      onPressOut={() => { scale.value = withSpring(1) }}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View style={[styles.chip, animatedStyle]}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={tokens.colors.light.primary} />
        </View>
        <Text style={styles.txt}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: tokens.colors.light.surface,
    borderRadius: tokens.radii.full,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    ...tokens.shadows.sm
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  txt: { fontSize: tokens.typography.body, fontWeight: '600', color: tokens.colors.light.text }
})
