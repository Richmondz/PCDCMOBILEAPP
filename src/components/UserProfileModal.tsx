import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { tokens } from '../theme/tokens'
import { PillTag } from './PillTag'

type Props = {
  userId: string | null
  onClose: () => void
}

export default function UserProfileModal({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      loadProfile(userId)
    }
  }, [userId])

  const loadProfile = async (id: string) => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
    setLoading(false)
  }

  if (!userId) return null

  return (
    <Modal visible={!!userId} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={tokens.colors.light.primary} style={{ margin: 20 }} />
          ) : profile ? (
            <ScrollView contentContainerStyle={styles.scroll}>
              <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profile.nickname?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={styles.nickname}>{profile.nickname}</Text>
                <Text style={styles.role}>
                  {profile.role === 'member' ? 'Member' : profile.role === 'mentor' ? 'Mentor' : 'Staff'}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>MBTI</Text>
                <Text style={styles.value}>{profile.mbti || 'Not set'}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Hobbies</Text>
                <View style={styles.tags}>
                  {profile.hobbies && profile.hobbies.length > 0 ? (
                    profile.hobbies.map((h: string, i: number) => (
                      <PillTag key={i} label={h} color="blue" />
                    ))
                  ) : (
                    <Text style={styles.value}>No hobbies listed</Text>
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Joined</Text>
                <Text style={styles.value}>
                  {new Date(profile.created_at).toLocaleDateString()}
                </Text>
              </View>
            </ScrollView>
          ) : (
            <Text style={{ textAlign: 'center', margin: 20 }}>User not found</Text>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  content: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 400,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  title: {
    fontSize: 18,
    fontWeight: '700'
  },
  scroll: {
    padding: 20
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  avatarText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '700'
  },
  nickname: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  role: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4
  },
  section: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8
  },
  value: {
    fontSize: 16,
    color: '#111827'
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  }
})
