import { View, StyleSheet, ViewStyle } from 'react-native'
import { tokens } from '../theme/tokens'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
}

export default function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radii.card,
    padding: tokens.spacing.s16,
    backgroundColor: tokens.colors.light.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...tokens.shadows.md
  }
})
