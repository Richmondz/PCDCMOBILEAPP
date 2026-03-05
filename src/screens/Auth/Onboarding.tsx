import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'
import Composer from '../../components/Composer'
import { PrimaryButton } from '../../components/Buttons'
import { useProfile } from '../../store/profile'
import { decode } from 'base64-arraybuffer'
import * as FileSystem from 'expo-file-system';

export default function Onboarding() {
  const { profile, loadProfile } = useProfile()
  const [nickname, setNickname] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [zodiac, setZodiac] = useState('')
  const [mbti, setMbti] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    })

    if (!result.canceled) {
      const asset = result.assets[0]
      setAvatar(asset.uri)
      if (asset.base64) {
        setAvatarBase64(asset.base64)
      }
    }
  }

  async function uploadAvatar(uri: string, base64Data?: string | null): Promise<string | null> {
    try {
      let base64 = base64Data
      let contentType = 'image/jpeg'
      if (!base64) {
        try {
          base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' })
        } catch {
          Alert.alert('Upload failed', 'Could not read image. Try a different photo.')
          return null
        }
      }
      const ext = (uri.split('.').pop() || 'jpg').split('?')[0]
      if (ext && ['png', 'gif', 'webp'].includes(ext.toLowerCase())) {
        contentType = `image/${ext.toLowerCase()}`
      }
      const path = `${profile?.id}/avatar.${ext || 'jpg'}`

      const { error } = await supabase.storage.from('avatars').upload(path, decode(base64), { contentType, upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      return data.publicUrl
    } catch (e: any) {
      console.log('Upload error', e)
      Alert.alert('Upload failed', e.message || 'Please try again.')
      return null
    }
  }

  async function submit() {
    if (!nickname.trim()) return Alert.alert('Missing Name', 'Please enter a display name.')
    
    setLoading(true)
    let avatarUrl = null
    
    if (avatar) {
      avatarUrl = await uploadAvatar(avatar, avatarBase64)
    }

    const updates: any = {
      nickname: nickname.trim(),
      hobbies: hobbies.split(',').map(s => s.trim()).filter(Boolean),
      zodiac,
      mbti,
      bio,
      onboarding_completed: true 
    }
    
    if (avatarUrl) updates.avatar_url = avatarUrl

    const { error } = await supabase.from('profiles').update(updates).eq('id', profile?.id)

    if (error) Alert.alert('Error', error.message)
    else await loadProfile()
    
    setLoading(false)
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={{ height: 40 }} /> 
          <Text style={styles.title}>Tell us about you!</Text>
          <Text style={styles.subtitle}>Fill out your profile to connect with others.</Text>

          <View style={styles.form}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarBtn}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera" size={32} color="#9CA3AF" />
                    <Text style={styles.avatarText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Composer 
              label="Display Name (Required)" 
              placeholder="What should we call you?" 
              value={nickname} 
              onChange={setNickname} 
              limit={30}
            />

            <Composer 
              label="Bio" 
              placeholder="A short intro..." 
              value={bio} 
              onChange={setBio} 
              multiline 
              limit={200}
            />
            
            <Composer 
              label="Hobbies (comma separated)" 
              placeholder="e.g. Drawing, Soccer, Coding" 
              value={hobbies} 
              onChange={setHobbies} 
              limit={100}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Composer 
                  label="Zodiac Sign" 
                  placeholder="e.g. Leo" 
                  value={zodiac} 
                  onChange={setZodiac} 
                  limit={20}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1 }}>
                <Composer 
                  label="MBTI / Personality" 
                  placeholder="e.g. ENFP" 
                  value={mbti} 
                  onChange={setMbti} 
                  limit={10}
                />
              </View>
            </View>

            <PrimaryButton title={loading ? "Saving..." : "Complete Profile"} onPress={submit} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 24, gap: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 12 },
  form: { gap: 20 },
  avatarBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D1D5DB'
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, color: '#6B7280', marginTop: 4, fontWeight: '600' },
  row: { flexDirection: 'row' }
})
