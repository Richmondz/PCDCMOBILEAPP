import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import { Ionicons } from '@expo/vector-icons'

export default function AdminMentors() {
  const nav = useNavigation()
  const [teens, setTeens] = useState<any[]>([])
  const [mentors, setMentors] = useState<any[]>([])
  const [loads, setLoads] = useState<Record<string, number>>({})
  const [assignments, setAssignments] = useState<Record<string, string>>({}) // teenId -> mentorId

  useEffect(() => { load() }, [])

  async function load() {
    // 1. Fetch Users
    const { data: t } = await supabase.from('profiles').select('id,nickname,role').eq('role','teen').order('nickname')
    const { data: m } = await supabase.from('profiles').select('id,nickname,role,mentor_capacity').eq('role','mentor')
    
    // 2. Fetch Assignments
    const { data: a } = await supabase.from('mentor_assignments').select('teen_id, mentor_id')
    
    // 3. Map Loads & Assignments
    const counts: Record<string, number> = {}
    const map: Record<string, string> = {}
    
    (a || []).forEach((x: any) => {
      counts[x.mentor_id] = (counts[x.mentor_id] || 0) + 1
      map[x.teen_id] = x.mentor_id
    })

    setLoads(counts)
    setAssignments(map)
    setTeens(t || [])
    setMentors(m || [])
  }

  async function assign(teenId: string, mentorId: string) {
    // Upsert assignment (requires unique constraint on teen_id in DB, or we delete first)
    // For safety, let's delete any existing first then insert
    await supabase.from('mentor_assignments').delete().eq('teen_id', teenId)
    const { error } = await supabase.from('mentor_assignments').insert({ teen_id: teenId, mentor_id: mentorId })
    
    if (error) Alert.alert('Error', error.message)
    else load()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentor Assignments</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList 
        data={teens}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: t }) => {
          const assignedMentorId = assignments[t.id]
          const assignedMentor = mentors.find(m => m.id === assignedMentorId)

          return (
            <View style={styles.card}>
              <View style={styles.teenRow}>
                <Text style={styles.teenName}>{t.nickname}</Text>
                {assignedMentor ? (
                  <View style={styles.assignedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.assignedText}>{assignedMentor.nickname}</Text>
                  </View>
                ) : (
                  <Text style={styles.unassignedText}>Unassigned</Text>
                )}
              </View>

              <Text style={styles.label}>Assign to:</Text>
              <View style={styles.mentorGrid}>
                {mentors.map(m => {
                  const load = loads[m.id] || 0
                  const cap = m.mentor_capacity || 5 // Default cap 5
                  const isFull = load >= cap
                  const isSelected = assignedMentorId === m.id

                  return (
                    <TouchableOpacity 
                      key={m.id} 
                      style={[
                        styles.chip, 
                        isSelected && styles.chipSelected,
                        isFull && !isSelected && styles.chipDisabled
                      ]} 
                      disabled={isFull && !isSelected}
                      onPress={() => assign(t.id, m.id)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {m.nickname} ({load}/{cap})
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  list: { padding: 16, gap: 16 },
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  teenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  teenName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  assignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  assignedText: { fontSize: 12, fontWeight: '600', color: '#059669' },
  unassignedText: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
  mentorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  chipSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipDisabled: { opacity: 0.5 },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextSelected: { color: '#fff', fontWeight: '600' }
})
