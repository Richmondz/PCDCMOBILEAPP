import { View, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function Banner({ message }: { message: string }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: tokens.colors.light.surface,
    borderRadius: tokens.radii.card,
    padding: tokens.spacing.s12,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2
  },
  text: { fontSize: tokens.typography.body, textAlign: 'center' }
})

