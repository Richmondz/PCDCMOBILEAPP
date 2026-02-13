
import { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Image } from 'react-native'
import { useSpaces } from '../../store/spaces'
import { supabase } from '../../lib/supabase'
import Composer from '../../components/Composer'
import { PrimaryButton } from '../../components/Buttons'
import { tokens } from '../../theme/tokens'
import { useNavigation } from '@react-navigation/native'
import { useProfile } from '../../store/profile'

export default function GeneralChat({ channelId }: { channelId: string }) {
  const { messages, loadMessages, loadMoreMessages, insertMessage, checkMessageCooldown, deleteMessage, authors } = useSpaces()
  const { profile } = useProfile()
  const [text, setText] = useState('')
  const nav = useNavigation<any>()
  const [loading, setLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const channelRef = useRef<any>(null)
  const lastTyped = useRef<number>(0)

  useEffect(() => {
    loadMessages(channelId)
    
    // Subscribe to DB changes AND Presence/Broadcast
    const channel = supabase.channel(`chat:${channelId}`)
    
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${channelId}` }, 
        (payload) => {
          loadMessages(channelId)
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
         if (payload.userId !== profile?.id) {
            setTypingUsers(prev => ({ ...prev, [payload.userId]: payload.name }))
            // Clear after 3s
            setTimeout(() => {
               setTypingUsers(prev => {
                  const next = { ...prev }
                  delete next[payload.userId]
                  return next
               })
            }, 3000)
         }
      })
      .subscribe()
      
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [channelId])

  const handleTextChange = (val: string) => {
    setText(val)
    const now = Date.now()
    if (val.length > 0 && now - lastTyped.current > 2000) {
      lastTyped.current = now
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: profile?.id, name: profile?.nickname || 'Someone' }
      })
    }
  }

  async function onSend() {
    if (!text.trim()) return
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    // 1. Check Slow Mode
    const canSend = await checkMessageCooldown(user.id)
    if (!canSend) {
      Alert.alert('Slow Mode', 'To prevent spam, please wait 1 minute between messages.')
      return
    }

    // 2. Send
    await insertMessage(channelId, text.trim())
    setText('')
  }

  const renderItem = ({ item }: { item: any }) => {
    const isMine = item.user_id === profile?.id
    const author = authors[item.user_id]
    
    // For now, assume avatar is missing from authors cache (store only fetches nickname). 
    // Ideally we should fetch avatars too. 
    // We can fetch profile on click anyway.
    
    return (
      <View style={[styles.row, isMine ? styles.right : styles.left]}>
        {!isMine && (
          <TouchableOpacity onPress={() => nav.navigate('Profile', { userId: item.user_id })}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{author?.nickname?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          </TouchableOpacity>
        )}
        
        <View style={{ maxWidth: '75%' }}>
          {!isMine && <Text style={styles.name}>{author?.nickname || 'User'}</Text>}
          <TouchableOpacity 
            onLongPress={() => {
              if (profile?.role === 'staff' || profile?.role === 'admin') {
                Alert.alert('Admin Actions', 'Manage this message', [
                  { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(item.id) },
                  { text: 'Cancel', style: 'cancel' }
                ])
              }
            }}
            activeOpacity={0.9}
          >
            <View style={[styles.bubble, isMine ? styles.mine : styles.other]}>
              <Text style={[styles.text, isMine ? styles.textMine : styles.textOther]}>{item.content}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={messages[channelId] || []}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.list}
        onEndReached={() => loadMoreMessages(channelId)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Welcome to General Chat!</Text>
            <Text style={styles.emptySub}>Messages are limited to 1 per minute.</Text>
          </View>
        }
      />
      <View style={styles.inputArea}>
        {Object.keys(typingUsers).length > 0 && (
          <Text style={styles.typingIndicator}>
            {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
          </Text>
        )}
        <Composer value={text} onChange={handleTextChange} placeholder="Type a message..." limit={500} />
        <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
          <PrimaryButton title="Send" onPress={onSend} disabled={!text.trim()} style={{ height: 36, paddingHorizontal: 16 }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 24 },
  row: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  
  name: { fontSize: 12, color: '#6B7280', marginBottom: 2, marginLeft: 4 },
  
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%'
  },
  mine: {
    backgroundColor: tokens.colors.light.primary,
    borderBottomRightRadius: 4
  },
  other: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  text: { fontSize: 15, lineHeight: 20 },
  textMine: { color: '#FFFFFF' },
  textOther: { color: '#1F2937' },
  
  inputArea: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  empty: { alignItems: 'center', marginTop: 40, transform: [{ scaleY: -1 }] }, // Un-invert for empty
  emptyText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  typingIndicator: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
    marginLeft: 4
  }
})
