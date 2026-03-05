import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { tokens } from '../../theme/tokens'
import { useNavigation } from '@react-navigation/native'
import AppHeader from '../../components/AppHeader'

export default function Admin() {
  const nav = useNavigation<any>()
  return (
    <View style={styles.wrap}>
      <AppHeader title="Admin Tools" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>User Data & Metrics</Text>
        <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('StaffDashboard')}><Text style={styles.btnText}>Admin Dashboard</Text><Text style={styles.btnSub}>Pending requests, escalations, reports, unassigned teens</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('StaffMetrics')}><Text style={styles.btnText}>Staff Metrics</Text><Text style={styles.btnSub}>DAU, WAU, check-in %, prompt response, mentor rate</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('PresenceReport')}><Text style={styles.btnText}>Weekly Time on App</Text><Text style={styles.btnSub}>Time spent per user (last week)</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('AdminReports')}><Text style={styles.btnText}>Weekly User Reports</Text><Text style={styles.btnSub}>Per-user Pulse, tools, active time, mood</Text></TouchableOpacity>

        <Text style={styles.sectionTitle}>Management</Text>
        <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('AdminCohorts')}><Text style={styles.btnText}>Cohort Management</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('AdminPrompts')}><Text style={styles.btnText}>Daily Prompt Scheduler</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('DataExport')}><Text style={styles.btnText}>Export All Data (Email)</Text></TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { padding: tokens.spacing.s16, paddingBottom: 40, gap: tokens.spacing.s8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginTop: 16, marginBottom: 4 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  btn: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.card, padding: tokens.spacing.s16, marginBottom: 8 },
  btnText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  btnSub: { fontSize: 12, color: '#6B7280', marginTop: 4 }
})
