import { View, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function PillTag({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF'
  },
  text: { fontSize: tokens.typography.caption, fontWeight: '500' }
})

