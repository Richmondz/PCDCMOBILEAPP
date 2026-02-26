import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

export default function Settings() {
  const nav = useNavigation<any>()

  return (
    <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Settings" showBack />
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.item} onPress={() => nav.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={tokens.colors.light.primary} />
            <Text style={styles.itemText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={tokens.colors.light.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => nav.navigate('EditProfile')}>
            <Ionicons name="person-outline" size={24} color={tokens.colors.light.primary} />
            <Text style={styles.itemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={tokens.colors.light.textTertiary} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.light.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12
  },
  itemText: { flex: 1, fontSize: 16, fontWeight: '600', color: tokens.colors.light.text }
})
