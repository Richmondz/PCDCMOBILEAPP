import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import DailyPulse from './DailyPulse'
import TodaysPrompt from './TodaysPrompt'
import QuickTools from './QuickTools'
import StreakBanner from './StreakBanner'
import WeeklyRecap from './WeeklyRecap'
import { useState } from 'react'

export default function Home() {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    // Add reload logic here if needed
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Daily Pulse" />
        
        <ScrollView 
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <StreakBanner />
          <WeeklyRecap />
          <DailyPulse />
          <TodaysPrompt />
          <QuickTools />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 }
})
