import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'

export default function StreakBanner() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const start = new Date()
      start.setDate(start.getDate() - 6)
      const { data } = await supabase
        .from('check_ins')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
      setCount((data || []).length)
    })()
  }, [])
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You checked in {count} days this week</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { padding: tokens.spacing.s12 },
  text: { fontSize: tokens.typography.body }
})

