import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import * as Offline from '../lib/offline_storage'

type Thread = { 
  id: string; 
  otherId: string; 
  otherRole: 'teen'|'mentor'|'staff'; 
  otherName: string 
}

type Message = { 
  id: string; 
  sender_id: string; 
  content: string; // Mapped from 'body'
  created_at: string 
}

type InboxState = {
  threads: Thread[]
  messages: Record<string, Message[]>
  messagePages: Record<string, number>
  loading: boolean
  loadThreads: () => Promise<void>
  loadMessages: (chatId: string) => Promise<void>
  loadMoreMessages: (chatId: string) => Promise<void>
  sendMessage: (chatId: string, content: string) => Promise<string | null>
  createDM: (targetId: string) => Promise<string | null>
  markRead: (chatId: string) => Promise<void>
  subscribe: (chatId: string) => { unsubscribe: () => void }
}

export const useInbox = create<InboxState>((set, get) => ({
  threads: [],
  messages: {},
  messagePages: {},
  loading: false,

  loadThreads: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return set({ threads: [], loading: false })

    // 1. Get all chat IDs I am part of
    const { data: myChats, error: myChatsError } = await supabase.from('chat_members')
      .select('chat_id')
      .eq('user_id', user.id)
    
    if (myChatsError) {
      console.error('Error fetching my chats:', myChatsError)
      return set({ threads: [], loading: false })
    }

    if (!myChats?.length) return set({ threads: [], loading: false })
    const chatIds = myChats.map(c => c.chat_id)

    // Parallelize requests to avoid "severe delay"
    const promises = chatIds.map(async (chatId) => {
       try {
         const { data: members } = await supabase.rpc('get_chat_members', { target_chat_id: chatId })
         if (members) {
           // Find the "other" person
           const other = (members as any[]).find((m: any) => m.user_id !== user.id)
           if (other) {
              // Need to fetch profile for this user
              const { data: profile } = await supabase.from('profiles').select('nickname, role').eq('id', other.user_id).single()
              if (profile) {
                return {
                  id: chatId,
                  otherId: other.user_id,
                  otherName: profile.nickname,
                  otherRole: profile.role
                } as Thread
              }
           }
         }
       } catch (e) {
         console.warn('Failed to load thread details for', chatId, e)
       }
       return null
    })

    const results = await Promise.all(promises)
    const threads = results.filter(t => t !== null) as Thread[]

    set({ threads, loading: false })
  },

  loadMessages: async (chatId) => {
    const pageSize = 30
    // Query 'chat_messages' table, mapping 'body' to 'content'
    let { data, error } = await supabase
      .from('chat_messages')
      .select('id, sender_id, body, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .range(0, pageSize - 1)

    if (error) {
       console.error('Error loading messages:', error)
       return
    }

    let msgs = (data as any[])?.map(m => ({ ...m, content: m.body })) || []
    
    if (!msgs.length) {
      try {
        if (Offline.cacheGet) {
          const cached = await Offline.cacheGet<any[]>(`messages:${chatId}`)
          if (cached) msgs = cached
        }
      } catch (e) { console.error('Cache get error', e) }
    } else {
      try {
        if (Offline.cacheSet) {
          await Offline.cacheSet(`messages:${chatId}`, msgs)
        }
      } catch (e) { console.error('Cache set error', e) }
    }
    
    set(state => ({ 
      messages: { ...state.messages, [chatId]: msgs }, 
      messagePages: { ...state.messagePages, [chatId]: 1 } 
    }))
  },

  loadMoreMessages: async (chatId) => {
    const pageSize = 30
    const page = (get().messagePages[chatId] || 1)
    const start = page * pageSize
    const end = start + pageSize - 1
    
    const { data } = await supabase
      .from('chat_messages')
      .select('id, sender_id, body, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .range(start, end)

    const more = (data as any[])?.map(m => ({ ...m, content: m.body })) || []
    
    if (more.length) {
      set(s => ({ 
        messages: { ...s.messages, [chatId]: [ ...(s.messages[chatId] || []), ...more ] }, 
        messagePages: { ...s.messagePages, [chatId]: page + 1 } 
      }))
    }
  },

  sendMessage: async (chatId, content) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    // Optimistically update UI immediately
    const optimistic = { 
      id: `${Date.now()}`, 
      sender_id: user.id, 
      content, 
      created_at: new Date().toISOString() 
    }
    
    set(state => ({ 
      messages: { ...state.messages, [chatId]: [ ...(state.messages[chatId] || []), optimistic ] } 
    }))

    try {
      // Insert into 'chat_messages' using 'body'
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ chat_id: chatId, sender_id: user.id, body: content })
        .select('id')
        .single()
      
      if (error) {
        console.error('Error sending message:', error)
        throw error
      }
      
      const messageId = (data as any)?.id || null
      // Optional: Invoke push notification function if exists
      if (messageId) {
        try { await supabase.functions.invoke('message-push', { body: { chatId, messageId } }) } catch {}
      }
      
      return messageId
    } catch {
      try {
        if (Offline.enqueue) {
          await Offline.enqueue({ type: 'message', payload: { chat_id: chatId, sender_id: user.id, body: content } })
        }
      } catch (e) { console.error('Enqueue error', e) }
      return optimistic.id
    }
  },

  createDM: async (targetId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Calls the updated 'create_dm' RPC
    const { data, error } = await supabase.rpc('create_dm', { target: targetId })
    if (error) {
      console.error('Create DM error:', error)
      return null
    }
    
    // Force reload threads to ensure the new conversation appears in the list
    await get().loadThreads()
    
    return data as string
  },

  markRead: async (chatId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('chat_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
  },

  subscribe: (chatId) => {
    const channel = supabase.channel(`chat_${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages', 
        filter: `chat_id=eq.${chatId}` 
      }, payload => {
        const raw = payload.new as any
        const msg: Message = { 
          id: raw.id, 
          sender_id: raw.sender_id, 
          content: raw.body, 
          created_at: raw.created_at 
        }
        set(state => ({ 
          messages: { ...state.messages, [chatId]: [ ...(state.messages[chatId] || []), msg ] } 
        }))
      })
      .subscribe()
    return { unsubscribe: () => { supabase.removeChannel(channel) } }
  }
}))