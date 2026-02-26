import { Text, StyleSheet, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { tokens } from '../theme/tokens'
import AnimatedPressable from './AnimatedPressable'

interface ButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
  style?: ViewStyle
  color?: string
}

export function PrimaryButton({ title, onPress, disabled, style, color }: ButtonProps) {
  const gradientColors = disabled 
    ? ['#94A3B8', '#94A3B8'] 
    : color 
      ? [color, color] 
      : [tokens.colors.light.primaryGradientStart, tokens.colors.light.primaryGradientEnd]
  return (
    <AnimatedPressable onPress={onPress} disabled={disabled}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primary, style]}
      >
        <Text style={styles.primaryText}>{title}</Text>
      </LinearGradient>
    </AnimatedPressable>
  )
}

export function SecondaryButton({ title, onPress, disabled, style }: ButtonProps) {
  return (
    <AnimatedPressable onPress={onPress} disabled={disabled}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={[styles.secondary, style]}
      >
        <Text style={styles.secondaryText}>{title}</Text>
      </LinearGradient>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  primary: {
    borderRadius: tokens.radii.button,
    paddingVertical: tokens.spacing.s12,
    paddingHorizontal: tokens.spacing.s16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  secondary: {
    borderRadius: tokens.radii.button,
    paddingVertical: tokens.spacing.s12,
    paddingHorizontal: tokens.spacing.s16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.light.border
  },
  secondaryText: { color: tokens.colors.light.text, fontWeight: '600', textAlign: 'center' }
})