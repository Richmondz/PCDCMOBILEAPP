import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Alert } from 'react-native'

type DailyState = {
  mood: number | null
  tags: string[]
  note: string
  prompt: { id: string, text: string } | null
  saved: { tool_key: string }[]
  setMood: (m: number | null) => void
  toggleTag: (t: string) => void
  setNote: (n: string) => void
  loadPrompt: () => Promise<void>
  saveCheckIn: () => Promise<void>
  loadSaved: () => Promise<void>
  bookmarkTool: (key: string) => Promise<void>
  removeBookmark: (key: string) => Promise<void>
  logToolUsage: (key: string, duration?: number, meta?: any) => Promise<void>
}

export const useDailyPulse = create<DailyState>((set, get) => ({
  mood: null,
  tags: [],
  note: '',
  prompt: null,
  saved: [],
  setMood: (m) => set({ mood: m }),
  toggleTag: (t) => {
    const tags = get().tags
    if (tags.includes(t)) set({ tags: tags.filter(x => x !== t) })
    else set({ tags: [...tags, t] })
  },
  setNote: (n) => set({ note: n }),
  loadPrompt: async () => {
    const today = new Date().toISOString().slice(0,10)
    const { data } = await supabase.from('daily_prompts').select('id, prompt').eq('active_date', today).limit(1)
    set({ prompt: data && data.length ? { id: data[0].id, text: data[0].prompt } : null })
  },
  saveCheckIn: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Check if already submitted today - TEMPORARILY DISABLED FOR TESTING
    // const today = new Date().toISOString().slice(0,10)
    // const { count } = await supabase.from('check_ins')
    //   .select('id', { count: 'exact', head: true })
    //   .eq('user_id', user.id)
    //   .gte('created_at', today)
    
    // if (count && count > 0) {
    //   Alert.alert('Already Checked In', 'You have already recorded your mood for today. Come back tomorrow!')
    //   return
    // }

    const s = get()
    const { error } = await supabase.from('check_ins').insert({ user_id: user.id, mood: s.mood, tags: s.tags, note: s.note })
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Saved', 'Your daily pulse has been recorded!')
  },
  loadSaved: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return set({ saved: [] })
    const { data } = await supabase.from('saved_tools').select('tool_key').eq('user_id', user.id)
    set({ saved: (data as any[]) || [] })
  },
  bookmarkTool: async (key) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('saved_tools').insert({ user_id: user.id, tool_key: key })
    await get().loadSaved()
  },
  removeBookmark: async (key) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('saved_tools').delete().eq('user_id', user.id).eq('tool_key', key)
    await get().loadSaved()
  },
  logToolUsage: async (key, duration, meta) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('tool_usage_logs').insert({ 
      user_id: user.id, 
      tool_key: key,
      duration_seconds: duration,
      meta: meta
    })
    if (error) console.error('Log error', error)
    else Alert.alert('Great Job!', 'Activity saved to your history.')
  }
}))

