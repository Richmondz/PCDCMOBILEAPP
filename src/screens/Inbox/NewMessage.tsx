import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import { useInbox } from '../../store/inbox'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

export default function NewMessage() {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { createDM } = useInbox()
  const nav = useNavigation<any>()

  useEffect(() => {
    if (q.length > 1) search()
    else setUsers([])
  }, [q])

  async function search() {
    setLoading(true)
    const { data } = await supabase.from('profiles')
      .select('id, nickname, role')
      .ilike('nickname', `%${q}%`)
      .limit(10)
    setUsers(data || [])
    setLoading(false)
  }

  async function start(userId: string, nickname: string, role: string) {
    const id = await createDM(userId)
    if (id) {
      nav.replace('Thread', { id, otherName: nickname, otherRole: role })
    }
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="New Message" showBack />
        
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput 
            style={styles.input}
            placeholder="Search by name..."
            value={q}
            onChangeText={setQ}
            autoFocus
          />
        </View>

        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => start(item.id, item.nickname, item.role)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nickname[0].toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.nickname}</Text>
                <Text style={styles.role}>{item.role}</Text>
              </View>
              <Ionicons name="chatbubble-outline" size={20} color={tokens.colors.light.primary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{loading ? 'Searching...' : 'Search for a user to start a chat'}</Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8
  },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  list: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  role: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  empty: { alignItems: 'center', marginTop: 32 },
  emptyText: { color: '#9CA3AF' }
})