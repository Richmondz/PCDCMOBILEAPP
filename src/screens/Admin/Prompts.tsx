import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import AppHeader from '../../components/AppHeader'
import { PrimaryButton } from '../../components/Buttons'

export default function AdminPrompts() {
  const nav = useNavigation()
  const [prompts, setPrompts] = useState<Record<string, any>>({})
  const [dates, setDates] = useState<Date[]>([])
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    // Generate next 14 days
    const d = []
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      d.push(date)
    }
    setDates(d)
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from('daily_prompts').select('*')
    const map: Record<string, any> = {}
    data?.forEach(p => map[p.active_date] = p)
    setPrompts(map)
  }

  function getISODate(d: Date) {
    return d.toISOString().split('T')[0]
  }

  function startEdit(d: Date) {
    const iso = getISODate(d)
    setEditingDate(iso)
    setText(prompts[iso]?.prompt || '')
  }

  async function save() {
    if (!editingDate) return
    
    if (!text.trim()) {
      // Delete if empty
      await supabase.from('daily_prompts').delete().eq('active_date', editingDate)
    } else {
      // Upsert
      const { error } = await supabase.from('daily_prompts').upsert({
        active_date: editingDate,
        prompt: text.trim()
      }, { onConflict: 'active_date' })
      
      if (error) Alert.alert('Error', error.message)
    }
    
    setEditingDate(null)
    setText('')
    load()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <AppHeader title="Prompt Scheduler" showBack />
      
      <FlatList
        data={dates}
        keyExtractor={d => getISODate(d)}
        contentContainerStyle={styles.list}
        renderItem={({ item: date }) => {
          const iso = getISODate(date)
          const p = prompts[iso]
          const isEditing = editingDate === iso
          const isToday = getISODate(new Date()) === iso

          return (
            <View style={[styles.card, isToday && styles.todayCard]}>
              <View style={styles.dateRow}>
                <Text style={[styles.dateText, isToday && styles.todayText]}>
                  {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  {isToday && ' (Today)'}
                </Text>
                {!isEditing && (
                  <TouchableOpacity onPress={() => startEdit(date)}>
                    <Ionicons name="pencil" size={20} color={tokens.colors.light.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {isEditing ? (
                <View style={styles.editBox}>
                  <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Enter prompt question..."
                    multiline
                    autoFocus
                  />
                  <View style={styles.btnRow}>
                    <TouchableOpacity onPress={() => setEditingDate(null)} style={styles.cancelBtn}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={save} style={styles.saveBtn}>
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={[styles.promptText, !p && styles.emptyText]}>
                  {p?.prompt || 'No prompt scheduled'}
                </Text>
              )}
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  todayCard: { borderColor: tokens.colors.light.primary, backgroundColor: '#F0F9FF' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateText: { fontSize: 14, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  todayText: { color: tokens.colors.light.primary },
  promptText: { fontSize: 16, color: '#111827', lineHeight: 22 },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic' },
  
  editBox: { gap: 12 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { padding: 8 },
  cancelText: { color: '#6B7280', fontWeight: '600' },
  saveBtn: { backgroundColor: tokens.colors.light.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveText: { color: '#fff', fontWeight: '600' }
})

