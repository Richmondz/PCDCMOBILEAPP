import { create } from 'zustand'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'

type NotificationState = {
  banner: string | null
  setBanner: (m: string | null) => void
  init: () => Promise<void>
}

export const useNotifications = create<NotificationState>((set) => ({
  banner: null,
  setBanner: (m) => set({ banner: m }),
  init: async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return

    let token
    try {
      // In Expo Go, projectId is not required. If using EAS, it should be in app.json extra.eas.projectId
      // Since we are in development, we can try calling it without projectId first.
      try {
        const projId = Constants?.expoConfig?.extra?.eas?.projectId || undefined
        token = (await Notifications.getExpoPushTokenAsync({ projectId: projId })).data
      } catch (inner) {
        console.log('Failed to get token with/without projectId', inner)
      }
    } catch (e) {
      console.log('Push token error', e)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user && token) {
      // Upsert token to avoid duplicates or errors
      await supabase.from('device_tokens').upsert({ user_id: user.id, token }, { onConflict: 'token' })
    }

    // ... subscriptions ...
    supabase.channel('notify_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const msg = payload.new as any
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || msg.sender_id === user.id) return
        
        // In-app banner only (Push handled by Edge Function)
        set({ banner: 'New message received' })
      })
      .subscribe()

    supabase.channel('notify_prompt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'daily_prompts' }, (payload) => {
        const dp = payload.new as any
        const today = new Date().toISOString().slice(0,10)
        if (dp.active_date === today) set({ banner: 'New daily prompt' })
      })
      .subscribe()

    supabase.channel('notify_ann')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channel_posts' }, async (payload) => {
        const post = payload.new as any
        const { data: ch } = await supabase.from('channels').select('name, cohort_id').eq('id', post.channel_id).single()
        if (ch?.name !== 'Announcements') return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: mem } = await supabase.from('cohort_memberships').select('*').eq('cohort_id', ch.cohort_id).eq('user_id', user.id)
        if (mem && mem.length) set({ banner: 'New cohort announcement' })
      })
      .subscribe()

    supabase.channel('notify_office')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'office_hours' }, async (payload) => {
        const row = payload.new as any
        if (row.status !== 'approved') return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        if (user.id === row.teen_id || user.id === row.mentor_id) set({ banner: 'Office hours approved' })
      })
      .subscribe()
  }
}))

