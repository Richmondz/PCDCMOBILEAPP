import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'

export default function ChallengeBanner({ cohortId }: { cohortId: string }) {
  const [title, setTitle] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [target, setTarget] = useState<number>(0)
  useEffect(() => { (async () => {
    const today = new Date().toISOString().slice(0,10)
    const { data: ch } = await supabase.from('cohort_challenges').select('*').eq('cohort_id', cohortId).lte('start_date', today).gte('end_date', today).limit(1)
    const c = ch && ch[0]
    if (!c) return
    setTitle(c.title)
    setTarget(c.target)
    if (c.type === 'checkins') {
      const { data: members } = await supabase.from('cohort_memberships').select('user_id').eq('cohort_id', cohortId)
      const ids = (members || []).map((m: any) => m.user_id)
      if (!ids.length) return
      const { data: cis } = await supabase.from('check_ins').select('id').in('user_id', ids).gte('created_at', c.start_date).lte('created_at', c.end_date)
      setProgress((cis || []).length)
    }
  })() }, [cohortId])
  if (!title) return null
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{title} — {progress}/{target}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.card, padding: tokens.spacing.s12 },
  text: { fontSize: tokens.typography.body }
})

