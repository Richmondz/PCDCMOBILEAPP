import { useEffect, useRef, useState } from 'react'
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useInbox } from '../../store/inbox'
import { supabase } from '../../lib/supabase'
import MessageBubble from '../../components/MessageBubble'
import Composer from '../../components/Composer'
import { PrimaryButton } from '../../components/Buttons'
import { tokens } from '../../theme/tokens'
import { detectSensitive } from '../../utils/safety'
import { useNotifications } from '../../store/notifications'
import { useNavigation } from '@react-navigation/native'

export default function Thread({ route }: any) {
  const { id, otherName, otherRole } = route.params
  const { messages, loadMessages, loadMoreMessages, sendMessage, subscribe, markRead, loading } = useInbox()
  const [text, setText] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const subRef = useRef<{ unsubscribe: () => void } | null>(null)
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
  }, [])
  
  useEffect(() => { 
    if (!messages[id]) {
       loadMessages(id)
    }
    markRead(id)
    subRef.current = subscribe(id)
    return () => subRef.current?.unsubscribe() 
  }, [id])

  // Removed redundant polling useEffect

  const { setBanner } = useNotifications()
  const nav = useNavigation<any>()

  async function onSend() {
    if (!text.trim()) return
    const newId = await sendMessage(id, text.trim())
    const hits = detectSensitive(text)
    if (newId && hits.length) {
      const { data: { user } } = await supabase.auth.getUser()
      for (const k of hits) { 
        await supabase.from('sensitive_flags').insert({ user_id: user?.id, context: 'message', context_id: newId, keyword: k }) 
      }
      setBanner('Sensitive content detected. See Help Now')
    }
    setText('')
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
            onPress={() => nav.navigate('Profile', { userId: route.params.otherId })}
          >
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{otherName?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>{otherName}</Text>
              <View style={[styles.badge, otherRole === 'mentor' ? styles.badgeMentor : styles.badgeStaff]}>
                <Text style={styles.badgeText}>{otherRole}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <PrimaryButton 
            title="Escalate" 
            onPress={() => nav.navigate('EscalateForm', { type: 'message', conversationId: id })}
            style={{ paddingVertical: 6, paddingHorizontal: 12, height: 'auto' }}
            textStyle={{ fontSize: 12 }}
          />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={{ flex: 1 }}
        >
          <FlatList
            data={messages[id] || []}
            keyExtractor={(item) => item.id}
            onEndReachedThreshold={0.4}
            onEndReached={() => loadMoreMessages(id)}
            renderItem={({ item }) => (
              <MessageBubble 
                content={item.content || ''} 
                mine={!!currentUserId && item.sender_id === currentUserId} 
              />
            )}
            contentContainerStyle={styles.list}
            inverted={false}
            ListEmptyComponent={
              loading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>Loading messages...</Text>
                </View>
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>No messages yet. Say hello!</Text>
                </View>
              )
            }
          />
          <View style={styles.inputArea}>
            <Composer value={text} onChange={setText} limit={500} placeholder="Type a message..." />
            <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
              <PrimaryButton title="Send" onPress={onSend} disabled={!text.trim()} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    gap: 8
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerAvatarText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  badge: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 12, 
    backgroundColor: '#E5E7EB' 
  },
  badgeMentor: { backgroundColor: '#DBEAFE' },
  badgeStaff: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  list: { padding: 16, paddingBottom: 24 },
  inputArea: { 
    padding: 16, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 0 : 16
  }
})
