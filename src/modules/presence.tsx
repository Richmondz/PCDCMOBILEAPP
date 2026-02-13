import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { supabase } from '../lib/supabase'

export default function PresenceTracker() {
  const sessionIdRef = useRef<string | null>(null)
  const heartbeatRef = useRef<NodeJS.Timer | null>(null)
  const appStateRef = useRef<string>('active')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      const { data } = await supabase.from('presence_sessions').insert({ user_id: user.id }).select('id').single()
      sessionIdRef.current = (data as any)?.id || null
      if (sessionIdRef.current) {
        heartbeatRef.current = setInterval(async () => {
          const id = sessionIdRef.current
          if (!id) return
          await supabase.from('presence_sessions').update({ last_heartbeat_at: new Date().toISOString() }).eq('id', id)
        }, 30000)
      }
    })()

    const sub = AppState.addEventListener('change', async (state) => {
      const prev = appStateRef.current
      appStateRef.current = state
      if (prev === 'active' && state !== 'active') {
        const id = sessionIdRef.current
        if (id) await supabase.from('presence_sessions').update({ ended_at: new Date().toISOString() }).eq('id', id)
        if (heartbeatRef.current) { clearInterval(heartbeatRef.current as any); heartbeatRef.current = null }
      } else if (prev !== 'active' && state === 'active') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('presence_sessions').insert({ user_id: user.id }).select('id').single()
        sessionIdRef.current = (data as any)?.id || null
        if (sessionIdRef.current) {
          heartbeatRef.current = setInterval(async () => {
            const id = sessionIdRef.current
            if (!id) return
            await supabase.from('presence_sessions').update({ last_heartbeat_at: new Date().toISOString() }).eq('id', id)
          }, 30000)
        }
      }
    })

    return () => {
      mounted = false
      const id = sessionIdRef.current
      if (id) supabase.from('presence_sessions').update({ ended_at: new Date().toISOString() }).eq('id', id)
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current as any); heartbeatRef.current = null }
      sub.remove()
    }
  }, [])

  return null
}

