import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

const preset = ['stressed','tired','excited','anxious','motivated']

export default function TagChips({ value, onToggle }: { value: string[]; onToggle: (t: string) => void }) {
  return (
    <View style={styles.row}>
      {preset.map(t => (
        <TouchableOpacity key={t} style={[styles.chip, value.includes(t) && styles.active]} onPress={() => onToggle(t)}>
          <Text style={styles.txt}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.s8 },
  chip: { backgroundColor: '#EEF2FF', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  active: { backgroundColor: '#DBEAFE' },
  txt: { fontSize: tokens.typography.caption }
})

