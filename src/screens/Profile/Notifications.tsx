import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../store/profile'
import { PrimaryButton } from '../../components/Buttons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import * as ExpoNotifications from 'expo-notifications'
import Constants from 'expo-constants'

export default function Notifications() {
  const { profile } = useProfile()
  const [enabled, setEnabled] = useState<boolean>(true)
  const [start, setStart] = useState(new Date())
  const [end, setEnd] = useState(new Date())
  const [showStart, setShowStart] = useState(false)
  const [showEnd, setShowEnd] = useState(false)

  useEffect(() => { 
    if (profile) { 
      setEnabled(!!profile.push_enabled)
      
      if (profile.quiet_hours_start) {
        const [h, m] = profile.quiet_hours_start.split(':')
        const d = new Date()
        d.setHours(parseInt(h), parseInt(m))
        setStart(d)
      }
      
      if (profile.quiet_hours_end) {
        const [h, m] = profile.quiet_hours_end.split(':')
        const d = new Date()
        d.setHours(parseInt(h), parseInt(m))
        setEnd(d)
      }
    } 
  }, [profile])

async function save() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  
  await supabase.from('profiles').update({ 
    push_enabled: enabled, 
    quiet_hours_start: fmt(start), 
    quiet_hours_end: fmt(end) 
  }).eq('id', user.id)
}

async function registerForPush() {
  if (Platform.OS === 'web') {
    alert('Push notifications work best in the mobile app (iOS/Android). On web, enable notifications in your browser settings for this site.')
    return
  }
  const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await ExpoNotifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') {
    alert('Notification permission denied. Please enable it in your device settings.')
    return
  }
  try {
    const projId = Constants?.expoConfig?.extra?.eas?.projectId
    const token = (await ExpoNotifications.getExpoPushTokenAsync({ projectId: projId })).data
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (!token) {
      alert('Could not get push token. Try again or use the Expo Go app.')
      return
    }
    const { error } = await supabase.from('device_tokens').upsert(
      { user_id: user.id, token },
      { onConflict: ['user_id', 'token'] }
    )
    if (error) throw error
    alert('Notifications enabled!')
  } catch (e: any) {
    alert(`Failed to register: ${e?.message || String(e)}. Try again or use the Expo Go app.`)
  }
}

  const TimeRow = ({ label, date, onPress }: any) => (
    <TouchableOpacity style={styles.timeRow} onPress={onPress}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.timeValueBox}>
        <Text style={styles.timeValue}>
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Notifications" showBack />
        
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.labelGroup}>
                <Text style={styles.label}>Push Notifications</Text>
                <Text style={styles.desc}>Receive alerts for messages and updates</Text>
              </View>
              <Switch 
                value={enabled} 
                onValueChange={setEnabled}
                trackColor={{ false: '#E5E7EB', true: tokens.colors.light.primary }}
              />
            </View>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.registerBtn} onPress={registerForPush}>
                <Ionicons name="notifications-outline" size={18} color={tokens.colors.light.primary} />
                <Text style={styles.registerBtnText}>Register for push (retry if failed)</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Ionicons name="moon" size={20} color="#6B7280" />
              <Text style={styles.sectionTitle}>Quiet Hours</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Mute notifications during specific times (e.g. while sleeping or studying).
            </Text>
            
            <View style={styles.divider} />

            <TimeRow 
              label="Start Time" 
              date={start} 
              onPress={() => setShowStart(true)} 
            />
            
            <View style={styles.divider} />
            
            <TimeRow 
              label="End Time" 
              date={end} 
              onPress={() => setShowEnd(true)} 
            />
          </View>

          <PrimaryButton title="Save Changes" onPress={save} />

          {showStart && (
            <DateTimePicker
              value={start}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { setShowStart(false); if (d) setStart(d) }}
            />
          )}
          
          {showEnd && (
            <DateTimePicker
              value={end}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { setShowEnd(false); if (d) setEnd(d) }}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16, gap: 24 },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelGroup: { flex: 1, paddingRight: 16 },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 10
  },
  registerBtnText: { fontSize: 14, fontWeight: '600', color: tokens.colors.light.primary },
  label: { fontSize: 16, fontWeight: '700', color: '#111827' },
  desc: { fontSize: 14, color: '#6B7280', marginTop: 2 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionDesc: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  
  timeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8 
  },
  timeLabel: { fontSize: 16, color: '#374151' },
  timeValueBox: { 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  timeValue: { fontSize: 16, fontWeight: '600', color: tokens.colors.light.primary }
})

