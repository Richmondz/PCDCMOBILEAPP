import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { supabase } from '../lib/supabase'

export default function ActivityTracker() {
  const appState = useRef(AppState.currentState)
  const interval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Start tracking on mount
    startTracking()

    // Listen for state changes (background vs active)
    const sub = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        startTracking()
      } else if (nextAppState.match(/inactive|background/)) {
        stopTracking()
      }
      appState.current = nextAppState
    })

    return () => {
      stopTracking()
      sub.remove()
    }
  }, [])

  function startTracking() {
    if (interval.current) return
    // Ping immediately on start
    ping()
    // Then every 60 seconds
    interval.current = setInterval(ping, 60 * 1000)
  }

  function stopTracking() {
    if (interval.current) {
      clearInterval(interval.current)
      interval.current = null
    }
  }

  async function ping() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Call the RPC function to increment time
    await supabase.rpc('increment_activity', { p_user_id: user.id })
  }

  return null // This component is invisible
}
