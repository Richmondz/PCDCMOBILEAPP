
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Platform } from 'react-native'
import { useSpaces } from '../../store/spaces'
import PostCard from '../../components/PostCard'
import PostComposer from '../../components/PostComposer'
import { supabase } from '../../lib/supabase'
import { useNotifications } from '../../store/notifications'
import { useNavigation } from '@react-navigation/native'
import { useProfile } from '../../store/profile'
import UserProfileModal from '../../components/UserProfileModal'
import OptionsModal, { OptionItem } from '../../components/OptionsModal'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'

export default function CommunityBoard({ channelId }: { channelId: string }) {
  const { posts, loadPosts, loadMorePosts, insertPost, toggleReaction, reportPost, blockUser, authors, deletePost, checkPostCooldown } = useSpaces()
  const { profile } = useProfile()
  const { setBanner } = useNotifications()
  const nav = useNavigation<any>()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  // Options Modal State
  const [optionsVisible, setOptionsVisible] = useState(false)
  const [optionsTitle, setOptionsTitle] = useState('')
  const [currentOptions, setCurrentOptions] = useState<OptionItem[]>([])

  useEffect(() => {
    loadPosts(channelId)
  }, [channelId])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadPosts(channelId)
    setRefreshing(false)
  }

  async function onSubmit(text: string, mediaUri?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Check Cooldown
    const canPost = await checkPostCooldown(user.id)
    if (!canPost) {
      Alert.alert('Cooldown Active', 'You can only post once per week in the Community Board.')
      return
    }

    let mediaUrl: string | undefined = undefined
    if (mediaUri) {
      try {
        const ext = mediaUri.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `posts/${user.id}/${Date.now()}.${ext}`
        
        let arrayBuffer: ArrayBuffer
        
        if (Platform.OS === 'web') {
          const response = await fetch(mediaUri)
          arrayBuffer = await response.arrayBuffer()
        } else {
          const base64 = await FileSystem.readAsStringAsync(mediaUri, { encoding: 'base64' })
          arrayBuffer = decode(base64)
        }
        
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'
        
        const { error } = await supabase.storage.from('post_media').upload(path, arrayBuffer, { contentType, upsert: true })
        if (error) throw error
        
        mediaUrl = supabase.storage.from('post_media').getPublicUrl(path).data.publicUrl
      } catch (e) {
        console.error('Image upload failed:', e)
        Alert.alert('Upload Error', 'Failed to upload image. Please try again.')
        return
      }
    }
    console.log('Submitting post:', text, mediaUrl)
    const result = await insertPost(channelId, text, mediaUrl)
    console.log('Insert result:', result)
    if (!result) {
      Alert.alert('Error', 'Failed to post. Please try again.')
    } else {
      Alert.alert('Success', 'Post created!')
    }
  }

  return (
    <>
    <FlatList
      data={posts[channelId] || []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.disclaimer}>
            Share your wins or ask for advice! Note: To keep quality high, you can only create 1 post per week.
          </Text>
          <PostComposer onSubmit={onSubmit} placeholder="Share something with the community..." />
        </View>
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => loadMorePosts(channelId)}
      renderItem={({ item }) => (
        <PostCard
          author={authors[item.author_id]?.nickname || 'User'}
          content={item.content}
          mediaUrl={item.media_url}
          createdAt={item.created_at}
          reactions={useSpaces.getState().reactions[item.id] || {}}
          onReact={(type) => toggleReaction(item.id, type)}
          onPressAuthor={() => setSelectedUserId(item.author_id)}
          onLongPress={() => {
            if (profile?.role === 'staff' || profile?.role === 'admin') {
               Alert.alert('Admin Actions', 'Manage this post', [
                 { text: 'Delete', style: 'destructive', onPress: () => deletePost(item.id) },
                 { text: 'Cancel', style: 'cancel' }
               ])
            } else {
               reportPost(item.id, 'inappropriate')
               blockUser(item.author_id)
               Alert.alert('Reported', 'Post flagged for review.')
            }
          }}
          onEscalate={() => {
            const isAuthor = profile?.id === item.author_id
            const isStaff = profile?.role === 'staff' || profile?.role === 'mentor' || profile?.role === 'admin'
            
            console.log('Post Options:', { 
              authorId: item.author_id, 
              myId: profile?.id, 
              isAuthor, 
              role: profile?.role 
            })

            const opts: OptionItem[] = []
            
            if (isAuthor || isStaff) {
              opts.push({ 
                label: 'Delete Post', 
                isDestructive: true, 
                onPress: () => {
                  if (Platform.OS === 'web') {
                    if (confirm('Delete this post?')) deletePost(item.id)
                  } else {
                    Alert.alert('Delete Post', 'Are you sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deletePost(item.id) }
                    ])
                  }
                }
              })
            }
            
            if (isStaff) {
              opts.push({
                label: 'Escalate to Admin',
                onPress: () => nav.navigate('EscalateForm', { type: 'post', postId: item.id })
              })
            }
            
            if (!isAuthor) {
              opts.push({
                label: 'Report Post',
                onPress: () => {
                  reportPost(item.id, 'inappropriate')
                  blockUser(item.author_id)
                  Alert.alert('Reported', 'Post flagged for review.')
                }
              })
            }
            
            setOptionsTitle(isAuthor ? 'Post Options (Author)' : 'Post Options')
            setCurrentOptions(opts)
            setOptionsVisible(true)
          }}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
        </View>
      }
    />
    <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    <OptionsModal visible={optionsVisible} title={optionsTitle} options={currentOptions} onClose={() => setOptionsVisible(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 16 },
  disclaimer: { 
    fontSize: 13, 
    color: '#6B7280', 
    marginBottom: 12, 
    fontStyle: 'italic', 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  empty: { alignItems: 'center', marginTop: 32 },
  emptyText: { color: '#9CA3AF', fontSize: 16 }
})
