import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { useProfile } from '../../store/profile'
import { supabase } from '../../lib/supabase'
import Composer from '../../components/Composer'
import { PrimaryButton } from '../../components/Buttons'

export default function EditProfile() {
  const { profile, loadProfile } = useProfile()
  const [bio, setBio] = useState(profile?.bio || '')

  useEffect(() => {
    if (profile?.bio) setBio(profile.bio)
  }, [profile?.bio])

  async function save() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ bio }).eq('id', user.id)
    loadProfile()
    Alert.alert('Saved', 'Your profile has been updated.')
  }

  return (
    <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Edit Profile" showBack />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.label}>Bio</Text>
            <Composer
              value={bio}
              onChange={setBio}
              limit={500}
              placeholder="Tell us about yourself..."
              multiline
            />
            <PrimaryButton title="Save" onPress={save} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16 },
  card: {
    backgroundColor: tokens.colors.light.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12
  },
  label: { fontSize: 14, fontWeight: '600', color: tokens.colors.light.text }
})
