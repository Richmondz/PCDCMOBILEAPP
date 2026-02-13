import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { tokens } from '../../theme/tokens'
import Composer from '../../components/Composer'
import { supabase } from '../../lib/supabase'

export default function EscalateForm({ route }: any) {
  const { type, conversationId, postId } = route.params || {}
  const [severity, setSeverity] = useState<'low'|'medium'|'high'>('medium')
  const [reason, setReason] = useState('')
  async function submit() {
    const { data: { user } } = await supabase.auth.getUser()
    const payload: any = { mentor_id: user?.id, reason, severity }
    if (type === 'message') payload.conversation_id = conversationId
    if (type === 'post') payload.post_id = postId
    await supabase.from('escalations').insert(payload)
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Escalate</Text>
      <View style={styles.row}>
        {['low','medium','high'].map(s => (
          <TouchableOpacity key={s} style={[styles.btn, severity===s && styles.active]} onPress={() => setSeverity(s as any)}><Text>{s}</Text></TouchableOpacity>
        ))}
      </View>
      <Composer value={reason} onChange={setReason} limit={200} />
      <TouchableOpacity style={styles.btn} onPress={submit}><Text>Submit</Text></TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: tokens.spacing.s16, gap: tokens.spacing.s12 },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  row: { flexDirection: 'row', gap: tokens.spacing.s8 },
  btn: { backgroundColor: tokens.colors.light.surface, borderRadius: tokens.radii.button, padding: tokens.spacing.s12 },
  active: { backgroundColor: '#DBEAFE' }
})

