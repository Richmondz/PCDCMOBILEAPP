import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function QuickToolChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.9}>
      <Text style={styles.txt}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: { backgroundColor: tokens.colors.light.surface, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  txt: { fontSize: tokens.typography.body }
})

