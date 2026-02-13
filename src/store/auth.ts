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
  const { data: { session } } = await supabase.auth.getSession()
  onChange(session)
  supabase.auth.onAuthStateChange((_event, s) => onChange(s))
}

