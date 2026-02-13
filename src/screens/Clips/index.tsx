import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { useEffect, useState } from 'react'
import { useClips } from '../../store/clips'
import ClipCard from '../../components/ClipCard'
import { useNavigation } from '@react-navigation/native'
import { useProfile } from '../../store/profile'
import { Ionicons } from '@expo/vector-icons'

export default function Clips() {
  const { today, loadToday, bookmark, unbookmark, isBookmarked } = useClips()
  const nav = useNavigation<any>()
  const { profile } = useProfile()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { 
    if (__DEV__) console.log("loadToday ready", typeof loadToday)
    loadToday() 
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadToday()
    setRefreshing(false)
  }

  function tryNow(title: string) {
    const t = title.toLowerCase()
    if (t.includes('breath')) nav.navigate('BreathingTimer')
    else if (t.includes('ground')) nav.navigate('GroundingGame')
    else if (t.includes('reframe')) nav.navigate('ReframeCard')
    else alert('This clip does not have a specific tool attached.')
  }

  function toggleSave(id: string) {
    if (isBookmarked(id)) {
      unbookmark(id)
      alert('Removed from saved clips')
    } else {
      bookmark(id)
      alert('Saved! You can find this in your Profile > Saved Tools')
    }
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader 
          title="Daily Clips" 
          action={profile?.role !== 'teen' ? (
            <TouchableOpacity onPress={() => nav.navigate('UploadClip')} style={styles.uploadBtn}>
              <Ionicons name="add-circle" size={24} color={tokens.colors.light.primary} />
            </TouchableOpacity>
          ) : undefined} 
        />
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(Math.min(today.length, 10) / 10) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Today’s 10 clips ({today.length}/10)</Text>
        </View>

        <FlatList
          data={today}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClipCard
              title={item.title}
              description={item.description}
              videoUrl={item.video_url}
              onSave={() => toggleSave(item.id)}
              onTry={() => tryNow(item.title)}
              onAsk={() => nav.navigate('Inbox')}
              bookmarked={isBookmarked(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="videocam-off-outline" size={48} color={tokens.colors.light.textTertiary} />
              <Text style={styles.emptyText}>No clips for today yet</Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  uploadBtn: { padding: 4 },
  progressContainer: { paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  progressBar: { 
    height: 6, 
    backgroundColor: '#E5E7EB', 
    borderRadius: 3, 
    overflow: 'hidden' 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: tokens.colors.light.primary, 
    borderRadius: 3 
  },
  progressText: { 
    fontSize: tokens.typography.caption, 
    color: tokens.colors.light.textSecondary,
    fontWeight: '600'
  },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 64, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF' }
})
