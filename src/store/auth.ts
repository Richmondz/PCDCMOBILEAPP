import { create } from 'zustand'
import { supabase } from '../lib/supabase'

type SessionState = {
  session: any | null
  setSession: (s: any | null) => void
}

export const useAuth = create<SessionState>((set) => ({
  session: null,
  setSession: (s) => set({ session: s })
}))

export async function initAuth(onChange: (s: any | null) => void) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error?.message?.includes('Refresh Token')) {
      await supabase.auth.signOut()
      onChange(null)
    } else {
      onChange(session)
    }
  } catch (e) {
    await supabase.auth.signOut().catch(() => {})
    onChange(null)
  }
  supabase.auth.onAuthStateChange((_event, s) => onChange(s))
}

