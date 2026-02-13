import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { useInbox } from '../../store/inbox'
import { useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../store/profile'
import { Ionicons } from '@expo/vector-icons'

import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'

export default function Inbox() {
  const { threads, loadThreads, createDM, loading } = useInbox()
  const nav = useNavigation<any>()
  const { profile } = useProfile()
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadThreads()
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await loadThreads()
    setRefreshing(false)
  }

  async function askMentor() {
    nav.navigate('AskMentorForm')
  }

  async function startDM() {
    nav.navigate('NewMessage')
  }

  const renderThread = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => nav.navigate('Thread', { id: item.id, otherName: item.otherName, otherRole: item.otherRole, otherId: item.otherId })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.otherName?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.otherName}</Text>
          <View style={[styles.badge, item.otherRole === 'mentor' ? styles.badgeMentor : styles.badgeStaff]}>
            <Text style={styles.badgeText}>{item.otherRole}</Text>
          </View>
        </View>
        <Text style={styles.preview} numberOfLines={1}>Tap to view messages</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={tokens.colors.light.textTertiary} />
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Messages" />
        
        <FlatList
          data={threads}
          keyExtractor={item => item.id}
          renderItem={renderThread}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View style={styles.actions}>
              {profile?.role === 'teen' && (
                <TouchableOpacity style={styles.actionCard} onPress={askMentor}>
                  <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="mail-outline" size={24} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.actionTitle}>Ask a Mentor</Text>
                    <Text style={styles.actionSubtitle}>Request help via email</Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionCard} onPress={startDM}>
                <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="create-outline" size={24} color="#9333EA" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>New Message</Text>
                  <Text style={styles.actionSubtitle}>Start a chat with someone</Text>
                </View>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons name="chatbox-ellipses-outline" size={48} color={tokens.colors.light.textTertiary} />
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  actions: { marginBottom: 24, gap: 12 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  actionSubtitle: { fontSize: 14, color: '#6B7280' },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 12
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#374151' },
  info: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: '#F3F4F6' },
  badgeMentor: { backgroundColor: '#DBEAFE' },
  badgeStaff: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#374151', textTransform: 'uppercase' },
  preview: { fontSize: 14, color: '#9CA3AF' },
  
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 48, gap: 16 },
  emptyText: { fontSize: 16, color: '#9CA3AF' }
})
