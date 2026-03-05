import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const XP_PER_LEVEL = 100

export function getLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export type LeaderboardEntry = {
  user_id: string
  nickname: string
  weekly_xp: number
  rank: number
}

type LeaderboardState = {
  entries: LeaderboardEntry[]
  loading: boolean
  loadLeaderboard: () => Promise<void>
}

export const useLeaderboard = create<LeaderboardState>((set) => ({
  entries: [],
  loading: false,
  loadLeaderboard: async () => {
    set({ loading: true })
    const { data, error } = await supabase.rpc('get_weekly_leaderboard')
    if (error) {
      console.error('Leaderboard error:', error)
      set({ entries: [], loading: false })
      return
    }
    set({
      entries: (data || []).map((r: any) => ({
        user_id: r.user_id,
        nickname: r.nickname || 'Anonymous',
        weekly_xp: Number(r.weekly_xp) || 0,
        rank: Number(r.rank) || 0
      })),
      loading: false
    })
  }
}))
