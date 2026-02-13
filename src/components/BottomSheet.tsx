import { View, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function BottomSheet({ children }: { children: React.ReactNode }) {
  return <View style={styles.sheet}>{children}</View>
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.light.surface,
    borderTopLeftRadius: tokens.radii.card,
    borderTopRightRadius: tokens.radii.card,
    padding: tokens.spacing.s16,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, elevation: 6
  }
})

