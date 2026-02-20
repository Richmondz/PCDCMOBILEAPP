import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Alert } from 'react-native'

import { useNotifications } from './notifications';

type DailyState = {
  mood: number | null;
  tags: string[];
  note: string;
  prompt: { id: string, text: string } | null;
  saved: { tool_key: string }[];
  hasCheckedInToday: boolean;
  setMood: (m: number | null) => void;
  toggleTag: (t: string) => void;
  setNote: (n: string) => void;
  loadPrompt: () => Promise<void>;
  saveCheckIn: () => Promise<void>;
  loadSaved: () => Promise<void>;
  checkIfUserHasCheckedIn: () => Promise<void>;
  bookmarkTool: (key: string) => Promise<void>;
  removeBookmark: (key: string) => Promise<void>;
  logToolUsage: (key: string, duration?: number, meta?: any) => Promise<void>;
}

export const useDailyPulse = create<DailyState>((set, get) => ({
  mood: null,
  tags: [],
  note: '',
  prompt: null,
  saved: [],
  hasCheckedInToday: false,
  setMood: (m) => set({ mood: m }),
  toggleTag: (t) => {
    const tags = get().tags;
    if (tags.includes(t)) set({ tags: tags.filter(x => x !== t) });
    else set({ tags: [...tags, t] });
  },
  setNote: (n) => set({ note: n }),
  loadPrompt: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from('daily_prompts').select('id, prompt').eq('active_date', today).limit(1);
    set({ prompt: data && data.length ? { id: data[0].id, text: data[0].prompt } : null });
  },
  checkIfUserHasCheckedIn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase.from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today);

    set({ hasCheckedInToday: !!(count && count > 0) });
  },
  saveCheckIn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (get().hasCheckedInToday) {
      useNotifications.getState().setBanner({ message: 'You have already checked in today. Come back tomorrow!', type: 'info' });
      return;
    }

    const s = get();
    const { error } = await supabase.from('check_ins').insert({ user_id: user.id, mood: s.mood, tags: s.tags, note: s.note });
    if (error) {
      useNotifications.getState().setBanner({ message: `Error: ${error.message}`, type: 'error' });
    } else {
      useNotifications.getState().setBanner({ message: 'Your daily pulse has been recorded!', type: 'success' });
      set({ hasCheckedInToday: true });
    }
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

