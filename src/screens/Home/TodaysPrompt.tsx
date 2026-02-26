import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native'
import { useDailyPulse } from '../../store/dailyPulse'
import { useEffect, useState } from 'react'
import { PrimaryButton } from '../../components/Buttons'
import { tokens } from '../../theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../store/profile'
import FadeInView from '../../components/FadeInView'

export default function TodaysPrompt() {
  const { prompt, loadPrompt } = useDailyPulse()
  const { profile } = useProfile()
  const [response, setResponse] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadPrompt() }, [])

  useEffect(() => {
    if (prompt?.id && profile?.id) {
      checkResponse()
    }
  }, [prompt, profile])

  async function checkResponse() {
    setResponse('')
  }

  async function submit() {
    if (!input.trim()) return
    setLoading(true)
    const { error } = await supabase.from('daily_prompt_responses').insert({
      prompt_id: prompt!.id,
      user_id: profile!.id,
      content: input.trim()
    })

    if (error) Alert.alert('Error', error.message)
    else {
      setResponse(input.trim())
      Alert.alert('Success', 'Response saved!')
    }
    setLoading(false)
  }

  if (!prompt) return null

  return (
    <FadeInView delay={150}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={22} color={tokens.colors.light.accent} />
          </View>
          <Text style={styles.title}>Today's Prompt</Text>
        </View>
        <Text style={styles.body}>{prompt.text}</Text>

        {response === null ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : response !== '' ? (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>Your Answer</Text>
            <Text style={styles.responseText}>{response}</Text>
            <View style={styles.checkRow}>
              <Ionicons name="checkmark-circle" size={18} color={tokens.colors.light.success} />
              <Text style={styles.checkText}>Saved</Text>
            </View>
          </View>
        ) : (
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Type your answer here..."
              placeholderTextColor={tokens.colors.light.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <PrimaryButton 
              title={loading ? "Saving..." : "Submit Answer"} 
              onPress={submit} 
              disabled={loading || !input.trim()}
            />
          </View>
        )}
      </View>
    </FadeInView>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.light.surface,
    borderRadius: tokens.radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    ...tokens.shadows.md,
    gap: 12
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: { fontSize: 18, fontWeight: '700', color: tokens.colors.light.text },
  body: { fontSize: 16, lineHeight: 24, color: tokens.colors.light.textSecondary, marginBottom: 4 },
  loading: { color: tokens.colors.light.textTertiary },
  
  inputBox: { gap: 12 },
  input: {
    backgroundColor: tokens.colors.light.inputBackground,
    borderWidth: 1,
    borderColor: tokens.colors.light.border,
    borderRadius: tokens.radii.button,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    color: tokens.colors.light.text
  },
  
  responseBox: {
    backgroundColor: tokens.colors.light.successLight,
    padding: 16,
    borderRadius: tokens.radii.button,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 8
  },
  responseLabel: { fontSize: 12, fontWeight: '700', color: '#047857', textTransform: 'uppercase' },
  responseText: { fontSize: 16, color: tokens.colors.light.text },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  checkText: { fontSize: 13, fontWeight: '600', color: tokens.colors.light.success }
})
