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
  chip: { 
    backgroundColor: tokens.colors.light.surfaceHighlight, 
    borderRadius: tokens.radii.full, 
    paddingVertical: 8, 
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  active: { 
    backgroundColor: '#E0E7FF', 
    borderColor: tokens.colors.light.primary 
  },
  txt: { fontSize: tokens.typography.caption, fontWeight: '600', color: tokens.colors.light.text }
})

