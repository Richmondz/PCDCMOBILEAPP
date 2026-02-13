import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import Composer from '../../components/Composer'
import AppHeader from '../../components/AppHeader'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

export default function AdminCohorts() {
  const nav = useNavigation<any>()
  const [cohorts, setCohorts] = useState<any[]>([])
  const [name, setName] = useState('')

  useEffect(() => { load() }, [])

  async function load() { 
    const { data } = await supabase.from('cohorts').select('*').order('created_at', { ascending: false })
    setCohorts(data || []) 
  }

  async function create() {
    if (!name.trim()) return Alert.alert('Error', 'Please enter a cohort name')
    
    // 1. Create Cohort
    const { data, error } = await supabase.from('cohorts').insert({ name: name.trim(), active: true }).select('id').single()
    
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    
    const cohortId = (data as any).id
    
    // 2. Create Default Channels
    const { error: chError } = await supabase.from('channels').insert([
      { cohort_id: cohortId, name: 'General Chat', type: 'chat', slug: `general-${cohortId}` },
      { cohort_id: cohortId, name: 'Community Board', type: 'posts', slug: `community-${cohortId}` }
    ])

    if (chError) {
      console.error('Channel creation error:', chError)
      Alert.alert('Warning', 'Cohort created but channels failed: ' + chError.message)
    } else {
      Alert.alert('Success', 'Cohort and default channels created!')
    }

    setName('')
    load()
  }

  async function toggle(id: string, active: boolean) { 
    await supabase.from('cohorts').update({ active: !active }).eq('id', id)
    load() 
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <AppHeader title="Manage Cohorts" showBack />
      
      <View style={styles.form}>
        <Text style={styles.label}>New Cohort Name</Text>
        <Composer value={name} onChange={setName} limit={50} placeholder="e.g. Fall 2025" />
        <TouchableOpacity style={styles.createBtn} onPress={create}>
          <Text style={styles.createBtnText}>Create Cohort</Text>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={cohorts}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: c }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.cohortName}>{c.name}</Text>
              <Text style={[styles.status, c.active ? styles.active : styles.inactive]}>
                {c.active ? 'Active' : 'Archived'}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => nav.navigate('CohortMembers', { cohortId: c.id, cohortName: c.name })}>
                <Ionicons name="people-circle-outline" size={28} color={tokens.colors.light.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, c.active ? styles.toggleOff : styles.toggleOn]} 
                onPress={() => toggle(c.id, c.active)}
              >
                <Text style={styles.toggleText}>{c.active ? 'Archive' : 'Activate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  form: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  createBtn: { 
    backgroundColor: tokens.colors.light.primary, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8
  },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cohortName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  status: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  active: { color: '#10B981' },
  inactive: { color: '#9CA3AF' },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  toggleOn: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  toggleOff: { borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#4B5563' }
})

