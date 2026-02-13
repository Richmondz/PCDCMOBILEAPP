import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function MoodPicker({ value, onChange }: { value: number | null; onChange: (m: number) => void }) {
  const moods = ['😞','😐','😊','🙂','😄']
  return (
    <View style={styles.row}>
      {moods.map((m, i) => (
        <TouchableOpacity key={i} style={[styles.btn, value === i+1 && styles.active]} onPress={() => onChange(i+1)}>
          <Text style={styles.txt}>{m}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: tokens.spacing.s8 },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: tokens.radii.button,
    backgroundColor: tokens.colors.light.surface
  },
  active: { backgroundColor: '#DBEAFE' },
  txt: { fontSize: 20 }
})

