import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSpaces } from '../../store/spaces'
import { tokens } from '../../theme/tokens'
import ChallengeBanner from './ChallengeBanner'
import AppHeader from '../../components/AppHeader'
import GeneralChat from './GeneralChat'
import CommunityBoard from './CommunityBoard'

const TABS = [
  { label: 'General Chat', type: 'chat' },
  { label: 'Community Posts', type: 'posts' }
]

export default function Channels({ route }: any) {
  const { cohortId } = route.params
  const { channels, loadChannels } = useSpaces()
  const [activeType, setActiveType] = useState<'chat' | 'posts'>('chat')
  const [channelMap, setChannelMap] = useState<Record<string, string>>({})

  useEffect(() => {
    loadChannels(cohortId)
  }, [cohortId])

  useEffect(() => {
    const map: Record<string, string> = {}
    channels.forEach(c => {
      if (c.type) map[c.type] = c.id
      // Fallback for old channels or if type is missing?
      // Assuming migration added types 'chat' and 'posts' correctly.
      // If legacy channels exist without type, we might ignore them or default.
    })
    setChannelMap(map)
  }, [channels])

  const activeChannelId = channelMap[activeType]

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Space" showBack />
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <ChallengeBanner cohortId={cohortId} />
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {TABS.map(t => {
              const isActive = activeType === t.type
              return (
                <TouchableOpacity 
                  key={t.type} 
                  style={[styles.tab, isActive && styles.active]} 
                  onPress={() => setActiveType(t.type as any)}
                >
                  <Text style={[styles.tabText, isActive && styles.activeText]}>{t.label}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {activeChannelId ? (
          <View style={{ flex: 1 }}>
            {activeType === 'chat' ? (
              <GeneralChat channelId={activeChannelId} />
            ) : (
              <CommunityBoard channelId={activeChannelId} />
            )}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Loading channel...</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  tabsContainer: { marginBottom: 8, height: 48 },
  tabsContent: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  tab: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  active: { 
    backgroundColor: tokens.colors.light.primary, 
    borderColor: tokens.colors.light.primary 
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#6B7280' 
  },
  activeText: { color: '#FFFFFF' },
  empty: { alignItems: 'center', marginTop: 32 },
  emptyText: { color: '#9CA3AF', fontSize: 16 }
})
