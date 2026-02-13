import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { useSpaces } from '../../store/spaces'
import { useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { PrimaryButton } from '../../components/Buttons'

export default function Spaces() {
  const { cohorts, loadCohorts, fetchAllCohorts, joinCohort } = useSpaces()
  const nav = useNavigation<any>()
  const [refreshing, setRefreshing] = useState(false)
  const [availableCohorts, setAvailableCohorts] = useState<any[]>([])
  const [showJoin, setShowJoin] = useState(false)

  useEffect(() => { loadCohorts() }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadCohorts()
    setRefreshing(false)
  }
  
  const handleJoin = async (id: string, name: string) => {
    Alert.alert('Join Space', `Join ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Join', onPress: async () => {
          await joinCohort(id)
          setShowJoin(false)
      }}
    ])
  }

  if (cohorts.length === 0 && !showJoin) {
    return (
      <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <AppHeader title="My Spaces" />
          <View style={styles.empty}>
             <Ionicons name="planet-outline" size={64} color={tokens.colors.light.textTertiary} />
             <Text style={styles.emptyText}>You haven't joined any spaces yet.</Text>
             <PrimaryButton 
               title="Find a Space" 
               onPress={async () => {
                 const all = await fetchAllCohorts()
                 setAvailableCohorts(all)
                 setShowJoin(true)
               }}
               style={{ marginTop: 20, width: 200 }}
             />
          </View>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  if (showJoin) {
    return (
      <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
             <TouchableOpacity onPress={() => setShowJoin(false)}>
               <Ionicons name="arrow-back" size={24} color="#111827" />
             </TouchableOpacity>
             <Text style={{ fontSize: 20, fontWeight: '700', marginLeft: 16 }}>Join a Space</Text>
          </View>
          <FlatList
            data={availableCohorts}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => handleJoin(item.id, item.name)}>
                <View style={styles.iconBox}>
                   <Ionicons name="add" size={24} color={tokens.colors.light.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.subtitle}>Tap to join</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
               <View style={styles.empty}>
                 <Text style={styles.emptyText}>No spaces available to join.</Text>
               </View>
            }
          />
        </SafeAreaView>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="My Spaces" />
        
        <FlatList
          data={cohorts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => nav.navigate('Channels', { cohortId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Ionicons name="people" size={24} color={tokens.colors.light.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subtitle}>Tap to enter space</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  list: { padding: 16 },
  card: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  empty: { alignItems: 'center', marginTop: 48, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 16 }
})
