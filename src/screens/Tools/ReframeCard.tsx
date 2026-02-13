import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Composer from '../../components/Composer'
import { PrimaryButton } from '../../components/Buttons'
import { tokens } from '../../theme/tokens'
import { useDailyPulse } from '../../store/dailyPulse'
import AppHeader from '../../components/AppHeader'
import { Ionicons } from '@expo/vector-icons'

export default function ReframeCard() {
  const [thought, setThought] = useState('')
  const [reframe, setReframe] = useState('')
  const { logToolUsage } = useDailyPulse()

  async function save() {
    await logToolUsage('reframe', undefined, { thought, reframe })
    setThought('')
    setReframe('')
  }

  return (
    <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Thought Reframing" showBack />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.intro}>
              <Ionicons name="swap-horizontal" size={48} color={tokens.colors.light.accent} />
              <Text style={styles.introText}>
                Turn a negative thought into something more balanced and helpful.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.label}>Negative Thought</Text>
                <Composer 
                  value={thought} 
                  onChange={setThought} 
                  limit={200} 
                  placeholder="e.g. I'm going to fail this test..."
                  multiline
                />
              </View>

              <View style={styles.divider}>
                <Ionicons name="arrow-down" size={24} color="#D1D5DB" />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Balanced Reframe</Text>
                <Composer 
                  value={reframe} 
                  onChange={setReframe} 
                  limit={200} 
                  placeholder="e.g. I've studied hard and I'll do my best."
                  multiline
                />
              </View>

              <View style={styles.footer}>
                <PrimaryButton 
                  title="Save to Daily Pulse" 
                  onPress={save} 
                  disabled={!thought || !reframe}
                  style={{ backgroundColor: tokens.colors.light.accent }}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  
  intro: { alignItems: 'center', marginBottom: 24, gap: 12 },
  introText: { 
    textAlign: 'center', 
    fontSize: 16, 
    color: '#4B5563', 
    paddingHorizontal: 32,
    lineHeight: 24
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    gap: 16
  },
  
  section: { gap: 8 },
  label: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#6B7280', 
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  
  divider: { alignItems: 'center', height: 24, justifyContent: 'center' },
  
  footer: { marginTop: 16 }
})

