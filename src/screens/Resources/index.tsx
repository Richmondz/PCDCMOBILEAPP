import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Composer from '../../components/Composer'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'

export default function Resources() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [q, cat])

  async function load() {
    setLoading(true)
    let req = supabase.from('resources').select('*')
    if (q) req = req.ilike('title', `%${q}%`)
    if (cat) req = req.eq('category', cat)
    const { data } = await req
    setItems(data || [])
    setLoading(false)
  }

  async function openLink(url: string) {
    if (url.startsWith('tel:') || url.startsWith('mailto:')) {
      await Linking.openURL(url)
    } else {
      await WebBrowser.openBrowserAsync(url)
    }
  }

  async function save(resourceId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('saved_resources').insert({ resource_id: resourceId, user_id: user.id })
  }

  const cats = ['Stress/Anxiety','Family Conflict','Bullying','Study Help','Food/Housing','Immigration','Grief','Self-Esteem']

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Resources" showBack />
        
        <View style={styles.searchContainer}>
          <Composer 
            value={q} 
            onChange={setQ} 
            limit={100} 
            placeholder="Search resources..." 
            // showCount={false}
          />
        </View>

        <View style={styles.catContainer}>
          <FlatList
            horizontal
            data={cats}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.chip, cat === item && styles.activeChip]} 
                onPress={() => setCat(cat === item ? null : item)}
              >
                <Text style={[styles.chipText, cat === item && styles.activeChipText]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="book-outline" size={24} color={tokens.colors.light.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.title}</Text>
                  <Text style={styles.catLabel}>{item.category}</Text>
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={() => save(item.id)}>
                  <Ionicons name="bookmark-outline" size={20} color={tokens.colors.light.primary} />
                </TouchableOpacity>
              </View>
              
              {item.description && <Text style={styles.desc}>{item.description}</Text>}
              
              {item.url && (
                <TouchableOpacity style={styles.linkBtn} onPress={() => openLink(item.url)}>
                  <Text style={styles.linkText}>{item.type === 'hotline' ? 'Call Now' : 'Open Link'}</Text>
                  <Ionicons name={item.type === 'hotline' ? "call-outline" : "open-outline"} size={16} color={tokens.colors.light.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No resources found</Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
  catContainer: { marginBottom: 12 },
  catList: { paddingHorizontal: 16, gap: 8 },
  
  chip: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  activeChip: { 
    backgroundColor: tokens.colors.light.primary, 
    borderColor: tokens.colors.light.primary 
  },
  chipText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeChipText: { color: '#FFFFFF' },

  list: { padding: 16, paddingTop: 4 },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  name: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  catLabel: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' },
  saveBtn: { padding: 8 },
  
  desc: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  
  linkBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6'
  },
  linkText: { fontSize: 14, fontWeight: '600', color: tokens.colors.light.primary },

  empty: { alignItems: 'center', marginTop: 48, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 16 }
})

