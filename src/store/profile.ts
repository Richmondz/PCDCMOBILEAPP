import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type Profile = {
  id: string
  role: 'teen' | 'mentor' | 'staff' | 'admin'
  nickname: string
  avatar_url?: string
  grade?: string
  tags?: string[]
  language_pref?: string
  onboarding_complete?: boolean
  guardian_consented?: boolean
  push_enabled?: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
}

type ProfileState = {
  profile: Profile | null
  setProfile: (p: Profile | null) => void
  loadProfile: () => Promise<void>
}

export const useProfile = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (p) => set({ profile: p }),
  loadProfile: async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError?.message?.includes('Refresh Token')) {
        await supabase.auth.signOut()
        return set({ profile: null })
      }
      if (!user) return set({ profile: null })
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      set({ profile: (data as Profile) || null })
    } catch (e) {
      set({ profile: null })
    }
  }
}))
