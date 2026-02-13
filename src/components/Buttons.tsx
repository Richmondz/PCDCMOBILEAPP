import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.primary} onPress={onPress} activeOpacity={0.9}>
      <Text style={styles.primaryText}>{title}</Text>
    </TouchableOpacity>
  )
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.secondary} onPress={onPress} activeOpacity={0.9}>
      <Text style={styles.secondaryText}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: tokens.colors.light.primary,
    borderRadius: tokens.radii.button,
    paddingVertical: tokens.spacing.s12,
    paddingHorizontal: tokens.spacing.s16
  },
  primaryText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  secondary: {
    backgroundColor: tokens.colors.light.surface,
    borderRadius: tokens.radii.button,
    paddingVertical: tokens.spacing.s12,
    paddingHorizontal: tokens.spacing.s16
  },
  secondaryText: { color: tokens.colors.light.text, textAlign: 'center' }
})

