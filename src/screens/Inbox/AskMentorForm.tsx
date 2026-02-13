import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Composer from '../../components/Composer'
import { PrimaryButton } from '../../components/Buttons'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import { useInbox } from '../../store/inbox'
import AppHeader from '../../components/AppHeader'
import { Ionicons } from '@expo/vector-icons'

export default function AskMentorForm() {
  const [topic, setTopic] = useState('')
  const [pref, setPref] = useState<'private'|'cohort'>('private')
  const [urgent, setUrgent] = useState(false)
  const { createDM } = useInbox()

  async function submit() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get assigned mentor to include in email body if needed, though email goes to central staff
    const { data } = await supabase.from('mentor_assignments').select('mentor:profiles(nickname, email)').eq('teen_id', user.id).single()
    const mentorName = data?.mentor?.nickname || 'Unassigned'

    // Call Edge Function to send email
    try {
      await supabase.functions.invoke('send-mentor-email', {
        body: {
          teenEmail: user.email,
          teenId: user.id,
          topic,
          urgency: urgent ? 'URGENT' : 'Normal',
          preference: pref,
          mentorName
        }
      })
      alert('Request sent successfully!')
      // Optionally navigate back
    } catch (e) {
      alert('Failed to send email. Please try again.')
    }
  }

  const OptionCard = ({ title, desc, icon, selected, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.optionCard, selected && styles.activeCard]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, selected && styles.activeIconBox]}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={selected ? tokens.colors.light.primary : '#6B7280'} 
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionTitle, selected && styles.activeText]}>{title}</Text>
        <Text style={[styles.optionDesc, selected && styles.activeText]}>{desc}</Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={24} color={tokens.colors.light.primary} />
      )}
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Ask a Mentor" showBack />
        
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
          <Composer 
            value={topic} 
            onChange={setTopic} 
            limit={300} 
            placeholder="Type your question or topic here..."
            multiline
          />

          <Text style={styles.sectionTitle}>How should we respond?</Text>
          
          <View style={styles.options}>
            <OptionCard 
              title="Private Message" 
              desc="Mentor will reply to your Inbox."
              icon="chatbubble-ellipses-outline"
              selected={pref === 'private'}
              onPress={() => setPref('private')}
            />
            <OptionCard 
              title="Cohort Channel" 
              desc="Mentor will post in the group channel."
              icon="people-outline"
              selected={pref === 'cohort'}
              onPress={() => setPref('cohort')}
            />
          </View>

          <View style={styles.urgentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.urgentLabel}>Mark as Urgent</Text>
              <Text style={styles.urgentDesc}>Use this for time-sensitive matters only.</Text>
            </View>
            <Switch 
              value={urgent} 
              onValueChange={setUrgent}
              trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
            />
          </View>

          <PrimaryButton title="Submit Request" onPress={submit} disabled={!topic.trim()} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16, gap: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: -8 },
  
  options: { gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 16
  },
  activeCard: {
    borderColor: tokens.colors.light.primary,
    backgroundColor: '#EFF6FF'
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeIconBox: { backgroundColor: '#FFFFFF' },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  optionDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  activeText: { color: tokens.colors.light.primary },

  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5'
  },
  urgentLabel: { fontSize: 16, fontWeight: '700', color: '#991B1B' },
  urgentDesc: { fontSize: 12, color: '#B91C1C' }
})

