import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../store/profile'
import { Ionicons } from '@expo/vector-icons'

type Report = { id: string; target_type: string; target_id: string; reason: string; details?: string; status: string; created_at: string }

export default function ModerationQueue() {
  const { profile } = useProfile()
  const [reports, setReports] = useState<Report[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadReports = async () => {
    if (profile?.role !== 'staff') return
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
    setReports((data as any[]) || [])
  }

  useEffect(() => { loadReports() }, [profile])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadReports()
    setRefreshing(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('reports').update({ status }).eq('id', id)
    setReports(rs => rs.map(r => r.id === id ? { ...r, status } : r))
  }

  async function hidePost(postId: string) { 
    await supabase.from('channel_posts').update({ deleted_at: new Date().toISOString() }).eq('id', postId)
    await supabase.from('audit_logs').insert({ action: 'hide_post', target_type: 'post', target_id: postId }) 
  }

  async function muteUser(cohortId: string, userId: string, days: number) { 
    const until = new Date()
    until.setDate(until.getDate()+days)
    await supabase.from('cohort_mutes').upsert({ cohort_id: cohortId, user_id: userId, until: until.toISOString() })
    await supabase.from('audit_logs').insert({ action: 'mute_user', target_type: 'cohort', target_id: cohortId, meta: { userId, days } }) 
  }

  async function lockChannel(channelId: string, hours: number) { 
    const until = new Date()
    until.setHours(until.getHours()+hours)
    await supabase.from('channel_locks').upsert({ channel_id: channelId, until: until.toISOString() })
    await supabase.from('audit_logs').insert({ action: 'lock_channel', target_type: 'channel', target_id: channelId, meta: { hours } }) 
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return '#EF4444'
      case 'in_review': return '#F59E0B'
      case 'resolved': return '#10B981'
      default: return '#6B7280'
    }
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Moderation Queue" showBack />
        
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Target:</Text>
                <Text style={styles.value}>{item.target_type}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Reason:</Text>
                <Text style={styles.value}>{item.reason}</Text>
              </View>
              {item.details ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Details:</Text>
                  <Text style={styles.value}>{item.details}</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Text style={styles.sectionTitle}>Update Status</Text>
                <View style={styles.btnRow}>
                  {['open','in_review','resolved'].map(s => (
                    <TouchableOpacity 
                      key={s} 
                      style={[
                        styles.statusBtn, 
                        item.status === s && { backgroundColor: getStatusColor(s), borderColor: getStatusColor(s) }
                      ]} 
                      onPress={() => updateStatus(item.id, s)}
                    >
                      <Text style={[styles.btnText, item.status === s && { color: '#FFF' }]}>{s.replace('_', ' ')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Actions</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => hidePost(item.target_id)}>
                    <Ionicons name="eye-off-outline" size={16} color="#374151" />
                    <Text style={styles.actionBtnText}>Hide Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => lockChannel(item.target_id, 12)}>
                    <Ionicons name="lock-closed-outline" size={16} color="#374151" />
                    <Text style={styles.actionBtnText}>Lock 12h</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={tokens.colors.light.success} />
              <Text style={styles.emptyText}>All caught up! No open reports.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  list: { padding: 16 },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  date: { fontSize: 12, color: '#9CA3AF' },
  
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 80, fontSize: 14, color: '#6B7280', fontWeight: '500' },
  value: { flex: 1, fontSize: 14, color: '#111827' },

  actions: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  
  statusBtn: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF'
  },
  btnText: { fontSize: 12, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    backgroundColor: '#F3F4F6' 
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  empty: { alignItems: 'center', marginTop: 48, gap: 12 },
  emptyText: { color: '#6B7280', fontSize: 16 }
})
