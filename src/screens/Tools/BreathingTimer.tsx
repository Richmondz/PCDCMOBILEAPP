import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { tokens } from '../../theme/tokens'
import { PrimaryButton } from '../../components/Buttons'
import { useDailyPulse } from '../../store/dailyPulse'
import AppHeader from '../../components/AppHeader'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')
const CIRCLE_SIZE = width * 0.7

export default function BreathingTimer() {
  const [phase, setPhase] = useState<'inhale'|'hold'|'exhale'|'idle'>('idle')
  const [count, setCount] = useState(0)
  const { logToolUsage } = useDailyPulse()

  useEffect(() => {
    let t: any
    if (phase !== 'idle') t = setInterval(() => setCount(c => c + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'inhale' && count >= 4) { setPhase('hold'); setCount(0) }
    if (phase === 'hold' && count >= 7) { setPhase('exhale'); setCount(0) }
    if (phase === 'exhale' && count >= 8) { 
      setPhase('idle')
      setCount(0)
      logToolUsage('breathing', 19) // One full cycle is ~19 seconds
    }
  }, [count, phase])

  function start() { setPhase('inhale'); setCount(0) }

  const getPhaseText = () => {
    switch(phase) {
      case 'inhale': return 'Breathe In'
      case 'hold': return 'Hold'
      case 'exhale': return 'Breathe Out'
      default: return 'Ready?'
    }
  }

  const getPhaseColor = () => {
    switch(phase) {
      case 'inhale': return '#60A5FA'
      case 'hold': return '#A78BFA'
      case 'exhale': return '#34D399'
      default: return '#9CA3AF'
    }
  }

  return (
    <LinearGradient colors={['#F0F9FF', '#E0F2FE']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="4-7-8 Breathing" showBack />
        
        <View style={styles.content}>
          <View style={[styles.circleContainer, { borderColor: getPhaseColor() }]}>
            <View style={[styles.circle, { backgroundColor: getPhaseColor() + '20' }]}>
              <Text style={[styles.countText, { color: getPhaseColor() }]}>
                {phase === 'idle' ? 'Start' : count}
              </Text>
              <Text style={styles.phaseText}>{getPhaseText()}</Text>
            </View>
          </View>

          <View style={styles.instructions}>
            <InstructionRow label="Inhale" value="4s" active={phase === 'inhale'} />
            <InstructionRow label="Hold" value="7s" active={phase === 'hold'} />
            <InstructionRow label="Exhale" value="8s" active={phase === 'exhale'} />
          </View>

          <View style={styles.actions}>
            {phase === 'idle' ? (
              <PrimaryButton title="Start Exercise" onPress={start} />
            ) : (
              <PrimaryButton title="Stop" onPress={() => setPhase('idle')} style={{ backgroundColor: '#EF4444' }} />
            )}
            {/* Removed save button as it auto-saves on completion */}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const InstructionRow = ({ label, value, active }: any) => (
  <View style={[styles.row, active && styles.activeRow]}>
    <Text style={[styles.rowLabel, active && styles.activeText]}>{label}</Text>
    <Text style={[styles.rowValue, active && styles.activeText]}>{value}</Text>
  </View>
)

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 24 },
  
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  circle: {
    width: CIRCLE_SIZE - 20,
    height: CIRCLE_SIZE - 20,
    borderRadius: (CIRCLE_SIZE - 20) / 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  countText: { fontSize: 64, fontWeight: '800' },
  phaseText: { fontSize: 24, fontWeight: '600', color: '#4B5563', marginTop: 8 },

  instructions: { width: '100%', gap: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  activeRow: {
    borderColor: tokens.colors.light.primary,
    backgroundColor: '#EFF6FF'
  },
  rowLabel: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  rowValue: { fontSize: 16, color: '#111827', fontWeight: '700' },
  activeText: { color: tokens.colors.light.primary },

  actions: { width: '100%', gap: 16 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  saveText: { color: tokens.colors.light.primary, fontWeight: '600' }
})

