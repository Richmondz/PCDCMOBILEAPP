import { useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useDailyPulse } from '../../store/dailyPulse'
import { tokens } from '../../theme/tokens'

export default function SavedTools() {
  const { saved, loadSaved, removeBookmark } = useDailyPulse()
  useEffect(() => { loadSaved() }, [])
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Saved Tools</Text>
      {saved.map(s => (
        <View key={s.tool_key} style={styles.row}>
          <Text>{s.tool_key}</Text>
          <TouchableOpacity onPress={() => removeBookmark(s.tool_key)}><Text style={{ color: tokens.colors.light.danger }}>Remove</Text></TouchableOpacity>
        </View>
      ))}
      {!saved.length && <Text style={styles.empty}>No saved tools</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: tokens.spacing.s8 },
  empty: { color: tokens.colors.light.muted }
})

