import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'

export default function CohortMembers() {
  const route = useRoute<any>()
  const nav = useNavigation()
  const { cohortId, cohortName } = route.params
  const [members, setMembers] = useState<any[]>([])
  const [unassigned, setUnassigned] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    
    // 1. Get current members of this cohort
    const { data: current } = await supabase.from('cohort_memberships')
      .select('user_id, profiles:user_id(id, nickname, email)')
      .eq('cohort_id', cohortId)
    
    // 2. Get ALL teens to find unassigned ones (simplified for now)
    // In a real app, you might only want teens NOT in any cohort, or search by name.
    // For now, we'll fetch all teens and filter out those already in THIS cohort.
    const { data: allTeens } = await supabase.from('profiles').select('id, nickname, email').eq('role', 'teen').order('nickname')

    const currentIds = new Set(current?.map((m: any) => m.user_id) || [])
    const memberList = current?.map((m: any) => m.profiles) || []
    const unassignedList = allTeens?.filter((t: any) => !currentIds.has(t.id)) || []

    setMembers(memberList)
    setUnassigned(unassignedList)
    setLoading(false)
  }

  async function addMember(userId: string) {
    const { error } = await supabase.from('cohort_memberships').insert({ cohort_id: cohortId, user_id: userId })
    if (error) Alert.alert('Error', error.message)
    else load()
  }

  async function removeMember(userId: string) {
    const { error } = await supabase.from('cohort_memberships').delete().eq('cohort_id', cohortId).eq('user_id', userId)
    if (error) Alert.alert('Error', error.message)
    else load()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{cohortName}</Text>
          <Text style={styles.headerSub}>Manage Members</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Members ({members.length})</Text>
        <FlatList
          data={members}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.nickname}</Text>
              <TouchableOpacity onPress={() => removeMember(item.id)} style={styles.removeBtn}>
                <Ionicons name="remove-circle-outline" size={20} color={tokens.colors.light.danger} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No members yet.</Text>}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Teens</Text>
        <FlatList
          data={unassigned}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.nickname}</Text>
              <TouchableOpacity onPress={() => addMember(item.id)} style={styles.addBtn}>
                <Text style={styles.addText}>Add</Text>
                <Ionicons name="add-circle" size={20} color={tokens.colors.light.primary} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No teens available to add.</Text>}
        />
      </View>
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
  headerSub: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  
  section: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase' },
  
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F9FAFB' 
  },
  name: { fontSize: 16, color: '#111827', fontWeight: '500' },
  
  removeBtn: { padding: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  addText: { color: tokens.colors.light.primary, fontWeight: '600' },
  
  divider: { height: 8, backgroundColor: '#F3F4F6' },
  empty: { color: '#9CA3AF', fontStyle: 'italic', marginTop: 8 }
})
