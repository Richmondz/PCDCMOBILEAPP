import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { tokens } from '../../theme/tokens'
import { useNavigation } from '@react-navigation/native'

export default function Admin() {
  const nav = useNavigation<any>()
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Admin Tools</Text>
      <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('AdminCohorts')}><Text>Cohort Management</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('AdminPrompts')}><Text>Daily Prompt Scheduler</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('AdminReports')}><Text>Weekly User Reports</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('DataExport')}><Text>Export All Data (Email)</Text></TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  btn: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.card, padding: tokens.spacing.s16 }
})
