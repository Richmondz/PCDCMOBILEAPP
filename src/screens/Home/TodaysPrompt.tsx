import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native'
import { useDailyPulse } from '../../store/dailyPulse'
import { useEffect, useState } from 'react'
import { PrimaryButton } from '../../components/Buttons'
import { tokens } from '../../theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../store/profile'

export default function TodaysPrompt() {
  const { prompt, loadPrompt } = useDailyPulse()
  const { profile } = useProfile()
  const [response, setResponse] = useState<string | null>(null) // null = not checked, '' = empty input
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { 
    loadPrompt()
  }, [])

  useEffect(() => {
    if (prompt?.id && profile?.id) {
      checkResponse()
    }
  }, [prompt, profile])

  async function checkResponse() {
    // TEMPORARILY DISABLED COOLDOWN CHECK FOR TESTING
    // const { data } = await supabase.from('daily_prompt_responses')
    //   .select('content')
    //   .eq('prompt_id', prompt!.id)
    //   .eq('user_id', profile!.id)
    //   .maybeSingle()
    
    // if (data) setResponse(data.content)
    // else setResponse('') // Enable input mode
    
    // Always enable input mode for testing
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
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={20} color={tokens.colors.light.accent} />
        <Text style={styles.title}>Today’s Prompt</Text>
      </View>
      <Text style={styles.body}>{prompt.text}</Text>

      {response === null ? (
        <Text style={{ color: '#9CA3AF' }}>Loading...</Text>
      ) : response !== '' ? (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Your Answer:</Text>
          <Text style={styles.responseText}>{response}</Text>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={16} color={tokens.colors.light.primary} />
            <Text style={styles.checkText}>Saved</Text>
          </View>
        </View>
      ) : (
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer here..."
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
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  body: { fontSize: 16, lineHeight: 24, color: '#374151', marginBottom: 8 },
  
  inputBox: { gap: 12 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16
  },
  
  responseBox: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 8
  },
  responseLabel: { fontSize: 12, fontWeight: '700', color: '#0284C7', textTransform: 'uppercase' },
  responseText: { fontSize: 16, color: '#0C4A6E' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  checkText: { fontSize: 12, fontWeight: '600', color: tokens.colors.light.primary }
})

