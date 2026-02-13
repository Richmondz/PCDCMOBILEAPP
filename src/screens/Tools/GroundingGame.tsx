import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { tokens } from '../../theme/tokens'
import { PrimaryButton } from '../../components/Buttons'
import { useDailyPulse } from '../../store/dailyPulse'
import AppHeader from '../../components/AppHeader'
import { Ionicons } from '@expo/vector-icons'

export default function GroundingGame() {
  const steps = [
    { count: 5, label: 'things you see', icon: 'eye-outline', color: '#60A5FA' },
    { count: 4, label: 'things you feel', icon: 'hand-left-outline', color: '#34D399' },
    { count: 3, label: 'things you hear', icon: 'ear-outline', color: '#A78BFA' },
    { count: 2, label: 'things you smell', icon: 'rose-outline', color: '#F472B6' },
    { count: 1, label: 'thing you taste', icon: 'cafe-outline', color: '#FBBF24' }
  ]
  const [idx, setIdx] = useState(0)
  const { logToolUsage } = useDailyPulse()

  const currentStep = steps[idx]
  const isLast = idx === steps.length - 1

  function next() { 
    if (!isLast) setIdx(idx + 1) 
    else logToolUsage('grounding', 60) // Estimate 1 min
  }

  return (
    <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="5-4-3-2-1 Grounding" showBack />
        
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: currentStep.color + '20' }]}>
              <Ionicons name={currentStep.icon as any} size={64} color={currentStep.color} />
            </View>
            <Text style={[styles.count, { color: currentStep.color }]}>{currentStep.count}</Text>
            <Text style={styles.label}>{currentStep.label}</Text>
          </View>

          <View style={styles.progress}>
            {steps.map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  i === idx && styles.activeDot,
                  i < idx && styles.completedDot
                ]} 
              />
            ))}
          </View>

          <View style={styles.actions}>
            <PrimaryButton 
              title={isLast ? "Finish & Save" : "Next Step"} 
              onPress={next} 
              style={{ backgroundColor: currentStep.color }}
            />
            {!isLast && (
              <TouchableOpacity style={styles.skipBtn} onPress={() => logToolUsage('grounding', 10)}>
                <Text style={styles.skipText}>Quit & Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    gap: 16
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  count: { fontSize: 80, fontWeight: '800' },
  label: { fontSize: 24, fontWeight: '600', color: '#4B5563', textTransform: 'capitalize' },

  progress: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 32 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' },
  activeDot: { backgroundColor: '#374151', transform: [{ scale: 1.2 }] },
  completedDot: { backgroundColor: '#10B981' },

  actions: { gap: 16 },
  skipBtn: { alignItems: 'center', padding: 12 },
  skipText: { color: '#6B7280', fontWeight: '600' }
})

