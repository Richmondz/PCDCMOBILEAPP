import { create } from 'zustand'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import * as Offline from '../lib/offline_storage'

export type Cohort = { id: string; name: string; active: boolean }
export type Channel = { id: string; cohort_id: string; name: string; type: 'chat' | 'posts' }
export type Post = { id: string; channel_id: string; author_id: string; content: string; media_url?: string; created_at: string }
export type ChannelMessage = { id: string; channel_id: string; user_id: string; content: string; created_at: string; is_hidden: boolean }
export type Reaction = { post_id: string; user_id: string; reaction_type: string }

type SpacesState = {
  cohorts: Cohort[]
  channels: Channel[]
  posts: Record<string, Post[]>
  messages: Record<string, ChannelMessage[]>
  authors: Record<string, { nickname: string }>
  reactions: Record<string, Record<string, boolean>>
  postPages: Record<string, number>
  messagePages: Record<string, number>
  loadCohorts: () => Promise<void>
  loadChannels: (cohortId: string) => Promise<void>
  loadPosts: (channelId: string) => Promise<void>
  loadMorePosts: (channelId: string) => Promise<void>
  loadMessages: (channelId: string) => Promise<void>
  loadMoreMessages: (channelId: string) => Promise<void>
  insertPost: (channelId: string, content: string, mediaUrl?: string) => Promise<string | null>
  insertMessage: (channelId: string, content: string) => Promise<string | null>
  checkPostCooldown: (userId: string) => Promise<boolean>
  checkMessageCooldown: (userId: string) => Promise<boolean>
  deletePost: (postId: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  toggleReaction: (postId: string, type: string) => Promise<void>
  reportPost: (postId: string, reason: string, details?: string) => Promise<void>
  blockUser: (userId: string) => Promise<void>
  joinCohort: (cohortId: string) => Promise<void>
  fetchAllCohorts: () => Promise<Cohort[]>
}

export const useSpaces = create<SpacesState>((set, get) => ({
  cohorts: [],
  channels: [],
  posts: {},
  messages: {},
  authors: {},
  reactions: {},
  postPages: {},
  messagePages: {},
  fetchAllCohorts: async () => {
    const { data, error } = await supabase.from('cohorts').select('*')
    if (error) {
      console.error('Fetch cohorts error:', error)
    }
    console.log('Fetch cohorts data:', data)
    return (data as any[]) || []
  },
  joinCohort: async (cohortId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Update profile
    await supabase.from('profiles').update({ cohort_id: cohortId }).eq('id', user.id)
    
    // Add membership
    const { error } = await supabase.from('cohort_memberships').insert({ cohort_id: cohortId, user_id: user.id })
    if (error && error.code !== '23505') { // Ignore unique violation
       console.error('Join cohort error:', error)
       Alert.alert('Error', 'Failed to join space: ' + error.message)
    }
    
    await get().loadCohorts()
  },
  loadCohorts: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return set({ cohorts: [] })
    
    // 1. Try fetching from memberships
    let { data } = await supabase
      .from('cohort_memberships')
      .select('cohorts:cohort_id(id,name,active)')
      .eq('user_id', user.id)
      
    let cohorts = (data || []).map((r: any) => r.cohorts).filter(Boolean)

    // 2. If empty, fallback to profile's cohort_id
    if (cohorts.length === 0) {
       const { data: profile } = await supabase.from('profiles').select('cohort_id').eq('id', user.id).single()
       if (profile?.cohort_id) {
          const { data: cohort } = await supabase.from('cohorts').select('id,name,active').eq('id', profile.cohort_id).single()
          if (cohort) cohorts = [cohort]
       }
    }
    
    set({ cohorts })
  },
  loadChannels: async (cohortId) => {
    const { data } = await supabase.from('channels').select('*').eq('cohort_id', cohortId)
    set({ channels: (data as any[]) || [] })
  },
  loadPosts: async (channelId) => {
    const pageSize = 20
    let { data } = await supabase.from('channel_posts').select('*').eq('channel_id', channelId).order('created_at', { ascending: false }).range(0, pageSize - 1)
    let posts = (data as any[]) || []
    if (!posts.length) {
      try {
        if (Offline.cacheGet) {
          const cached = await Offline.cacheGet<any[]>(`posts:${channelId}`)
          if (cached) posts = cached
        }
      } catch (e) { console.error('Cache get error', e) }
    } else {
      try {
        if (Offline.cacheSet) {
          await Offline.cacheSet(`posts:${channelId}`, posts)
        }
      } catch (e) { console.error('Cache set error', e) }
    }
    const authorIds = Array.from(new Set(posts.map((p: any) => p.author_id)))
    if (authorIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id,nickname').in('id', authorIds)
      const map: Record<string, { nickname: string }> = {};
      (profs || []).forEach((p: any) => { map[p.id] = { nickname: p.nickname } })
      set({ authors: { ...get().authors, ...map } })
    }
    set({ posts: { ...get().posts, [channelId]: posts }, postPages: { ...get().postPages, [channelId]: 1 } })
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: reacts } = await supabase.from('reactions').select('*').in('post_id', posts.map((p: any) => p.id)).eq('user_id', user.id)
      const rmap: Record<string, Record<string, boolean>> = {}
      (reacts || []).forEach((r: any) => {
        if (!rmap[r.post_id]) rmap[r.post_id] = {}
        rmap[r.post_id][r.reaction_type] = true
      })
      set({ reactions: { ...get().reactions, ...rmap } })
    }
  },
  loadMorePosts: async (channelId) => {
    const pageSize = 20
    const page = (get().postPages[channelId] || 1)
    const start = page * pageSize
    const end = start + pageSize - 1
    const { data } = await supabase.from('channel_posts').select('*').eq('channel_id', channelId).order('created_at', { ascending: false }).range(start, end)
    const more = (data as any[]) || []
    if (more.length) set(s => ({ posts: { ...s.posts, [channelId]: [ ...(s.posts[channelId] || []), ...more ] }, postPages: { ...s.postPages, [channelId]: page + 1 } }))
  },
  loadMessages: async (channelId) => {
    const pageSize = 50
    const { data } = await supabase.from('channel_messages').select('*').eq('channel_id', channelId).order('created_at', { ascending: false }).range(0, pageSize - 1)
    let messages = (data as any[]) || []
    
    // Fetch authors
    const userIds = Array.from(new Set(messages.map((m: any) => m.user_id)))
    if (userIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id,nickname').in('id', userIds)
      const map: Record<string, { nickname: string }> = {};
      (profs || []).forEach((p: any) => { map[p.id] = { nickname: p.nickname } })
      set({ authors: { ...get().authors, ...map } })
    }
    
    set({ messages: { ...get().messages, [channelId]: messages }, messagePages: { ...get().messagePages, [channelId]: 1 } })
  },
  loadMoreMessages: async (channelId) => {
    const pageSize = 50
    const page = (get().messagePages[channelId] || 1)
    const start = page * pageSize
    const end = start + pageSize - 1
    const { data } = await supabase.from('channel_messages').select('*').eq('channel_id', channelId).order('created_at', { ascending: false }).range(start, end)
    const more = (data as any[]) || []
    
    // Fetch authors for new messages too if needed (omitted for brevity, usually cached)
    
    if (more.length) set(s => ({ messages: { ...s.messages, [channelId]: [ ...(s.messages[channelId] || []), ...more ] }, messagePages: { ...s.messagePages, [channelId]: page + 1 } }))
  },
  insertPost: async (channelId, content, mediaUrl) => {
    const { data: { user } } = await supabase.auth.getUser()
    // Allow empty content if mediaUrl is present (image-only post)
    if (!user || (!content.trim() && !mediaUrl)) return null
    try {
      console.log('Inserting post to:', channelId)
      const { data, error } = await supabase.from('channel_posts').insert({ channel_id: channelId, author_id: user.id, content, media_url: mediaUrl }).select('*').single()
      if (error) {
        console.error('Insert post error:', error)
        throw error
      }
      
      // Update local state immediately with the real data
      const newPost = data as any
      set(s => ({ posts: { ...s.posts, [channelId]: [newPost, ...(s.posts[channelId] || [])] } }))
      
      // Also reload to be safe, but in background
      get().loadPosts(channelId)
      
      return newPost.id || null
    } catch (e) {
      console.error('Optimistic post error:', e)
      try {
        if (Offline.enqueue) {
          await Offline.enqueue({ type: 'post', payload: { channel_id: channelId, author_id: user.id, content, media_url: mediaUrl } })
        } else {
          console.warn('Offline.enqueue is not available')
        }
      } catch (err) { console.error('Enqueue error:', err) }
      
      const optimistic = { id: `${Date.now()}`, channel_id: channelId, author_id: user.id, content, media_url: mediaUrl, created_at: new Date().toISOString() }
      set(s => ({ posts: { ...s.posts, [channelId]: [optimistic, ...(s.posts[channelId] || [])] } }))
      return optimistic.id
    }
  },
  insertMessage: async (channelId, content) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !content.trim()) return null
    
    // Optimistic
    const optimistic = { id: `${Date.now()}`, channel_id: channelId, user_id: user.id, content, created_at: new Date().toISOString(), is_hidden: false }
    set(s => ({ messages: { ...s.messages, [channelId]: [optimistic, ...(s.messages[channelId] || [])] } }))

    try {
      const { data, error } = await supabase.from('channel_messages').insert({ channel_id: channelId, user_id: user.id, content }).select('id').single()
      if (error) throw error
      return (data as any)?.id
    } catch (e) {
      console.error('Insert message error:', e)
      // Enqueue offline?
      return optimistic.id
    }
  },
  checkPostCooldown: async (userId) => {
    // TEMPORARILY DISABLED FOR TESTING
    return true
    
    // 1 week = 7 * 24 * 60 * 60 * 1000 ms
    // const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
    // const { data } = await supabase.rpc('get_last_post_time', { u_id: userId })
    // if (!data) return true // No previous post
    // const last = new Date(data).getTime()
    // const now = Date.now()
    // return (now - last) > ONE_WEEK
  },
  checkMessageCooldown: async (userId) => {
    // 1 minute = 60 * 1000 ms
    const ONE_MINUTE = 60 * 1000
    const { data } = await supabase.rpc('get_last_message_time', { u_id: userId })
    if (!data) return true // No previous message
    const last = new Date(data).getTime()
    const now = Date.now()
    return (now - last) > ONE_MINUTE
  },
  deletePost: async (postId) => {
    await supabase.from('channel_posts').delete().eq('id', postId)
    // Update local state to remove it
    set(s => {
      const newPosts = { ...s.posts }
      for (const key in newPosts) {
        newPosts[key] = newPosts[key].filter(p => p.id !== postId)
      }
      return { posts: newPosts }
    })
  },
  deleteMessage: async (messageId) => {
    await supabase.from('channel_messages').delete().eq('id', messageId)
    // Update local state
    set(s => {
      const newMessages = { ...s.messages }
      for (const key in newMessages) {
        newMessages[key] = newMessages[key].filter(m => m.id !== messageId)
      }
      return { messages: newMessages }
    })
  },
  toggleReaction: async (postId, type) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const current = !!get().reactions[postId]?.[type]
    if (current) {
      await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', user.id).eq('reaction_type', type)
    } else {
      await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, reaction_type: type })
    }
    const after = { ...(get().reactions[postId] || {}) }
    if (current) delete after[type]; else after[type] = true
    set({ reactions: { ...get().reactions, [postId]: after } })
  },
  reportPost: async (postId, reason, details) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('reports').insert({ reporter_id: user.id, target_type: 'post', target_id: postId, reason, details })
  },
  blockUser: async (userId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: userId })
  }
}))