import { View, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function Toast({ message }: { message: string }) {
  return (
    <View style={styles.toast}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: tokens.spacing.s24,
    left: tokens.spacing.s16,
    right: tokens.spacing.s16,
    backgroundColor: tokens.colors.light.surface,
    borderRadius: tokens.radii.button,
    padding: tokens.spacing.s12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3
  },
  text: { textAlign: 'center' }
})

