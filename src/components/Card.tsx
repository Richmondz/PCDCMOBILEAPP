import { View, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radii.card,
    padding: tokens.spacing.s16,
    backgroundColor: tokens.colors.light.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  }
})

