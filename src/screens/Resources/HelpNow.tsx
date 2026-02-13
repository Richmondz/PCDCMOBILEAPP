import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { Ionicons } from '@expo/vector-icons'

export default function HelpNow() {
  const contacts = [
    { title: 'Emergency Services', number: '911', desc: 'For immediate danger or medical emergencies', color: '#EF4444' },
    { title: 'Crisis Text Line', number: '741741', desc: 'Text HOME to connect with a Crisis Counselor', color: '#8B5CF6' },
    { title: 'Suicide & Crisis Lifeline', number: '988', desc: 'Call or text for confidential support 24/7', color: '#F59E0B' }
  ]

  return (
    <LinearGradient colors={['#FEF2F2', '#FFF1F2']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Get Help Now" showBack />
        
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.alertBox}>
            <Ionicons name="warning" size={32} color="#DC2626" />
            <Text style={styles.alertText}>
              If you or someone else is in immediate danger, please call 911 immediately.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          
          {contacts.map((c, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.card}
              onPress={() => Linking.openURL(`tel:${c.number}`)}
            >
              <View style={[styles.iconBox, { backgroundColor: c.color + '20' }]}>
                <Ionicons name="call" size={24} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactTitle}>{c.title}</Text>
                <Text style={styles.contactDesc}>{c.desc}</Text>
              </View>
              <View style={styles.actionBox}>
                <Text style={[styles.actionText, { color: c.color }]}>{c.number}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Talk to Someone</Text>
          
          <View style={styles.scriptCard}>
            <Text style={styles.scriptTitle}>Not sure what to say?</Text>
            <Text style={styles.scriptBody}>
              Try this script when talking to a trusted adult:
            </Text>
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                "I’ve been feeling overwhelmed lately and I think I need some help. Can we talk about it?"
              </Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16, gap: 24 },
  
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#FECACA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  alertText: { flex: 1, color: '#991B1B', fontWeight: '600', fontSize: 14, lineHeight: 20 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: -8 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  contactTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  contactDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  actionBox: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionText: { fontWeight: '700', fontSize: 14 },

  scriptCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    gap: 12
  },
  scriptTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  scriptBody: { fontSize: 14, color: '#4B5563' },
  quoteBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.light.primary
  },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#1E3A8A', lineHeight: 24 }
})

