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
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <LinearGradient 
      colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} 
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Daily Pulse" />
        
        <ScrollView 
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
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
  scroll: { padding: 20, paddingBottom: 48, gap: 20 }
})
