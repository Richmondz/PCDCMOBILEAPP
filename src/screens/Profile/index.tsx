import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { useProfile } from '../../store/profile'
import { supabase } from '../../lib/supabase'
import SavedTools from './SavedTools'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'

export default function Profile({ route }: any) {
  const { profile: myProfile } = useProfile()
  const nav = useNavigation<any>()
  const [targetProfile, setTargetProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // If route params has userId, we are viewing someone else. Otherwise, view self.
  const targetId = route?.params?.userId
  const isMe = !targetId || targetId === myProfile?.id
  
  useEffect(() => {
    if (isMe) {
      setTargetProfile(myProfile)
    } else {
      setLoading(true)
      supabase.from('profiles').select('*').eq('id', targetId).single()
        .then(({ data }) => setTargetProfile(data))
        .finally(() => setLoading(false))
    }
  }, [targetId, myProfile])

  const profile = targetProfile

  async function signOut() {
    await supabase.auth.signOut()
  }

  const MenuLink = ({ title, icon, onPress, color }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: (color || tokens.colors.light.primary) + '15' }]}>
        <Ionicons name={icon} size={20} color={color || tokens.colors.light.primary} />
      </View>
      <Text style={styles.menuText}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  )

  const Section = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  )

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {isMe ? (
          <AppHeader title="My Profile" />
        ) : (
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{profile?.nickname || "Profile"}</Text>
            <View style={{ width: 40 }} />
          </View>
        )}
        
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header Card */}
          <View style={styles.profileCard}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile?.nickname?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile?.nickname || 'User'}</Text>
              <View style={[styles.roleBadge, profile?.role === 'staff' ? styles.staffBadge : styles.teenBadge]}>
                <Text style={styles.roleText}>{profile?.role?.toUpperCase() || 'TEEN'}</Text>
              </View>
            </View>
            {!isMe && (
               <TouchableOpacity 
                 style={styles.msgBtn}
                 onPress={async () => {
                   // Create/Navigate DM
                   // We need to call createDM from inbox store or logic here
                   // For now, let's navigate to Inbox with params? 
                   // Or just create it
                   const { data } = await supabase.rpc('create_dm', { target: targetId })
                   nav.navigate('Inbox', { screen: 'Thread', params: { id: data } })
                 }}
               >
                 <Ionicons name="chatbubble" size={20} color="#FFF" />
               </TouchableOpacity>
            )}
          </View>

          {profile?.bio ? (
            <View style={styles.bioCard}>
              <Text style={styles.bioText}>{profile.bio}</Text>
              <View style={styles.tags}>
                {profile.zodiac ? <View style={styles.tag}><Text style={styles.tagText}>{profile.zodiac}</Text></View> : null}
                {profile.mbti ? <View style={styles.tag}><Text style={styles.tagText}>{profile.mbti}</Text></View> : null}
                {profile.hobbies?.map((h: string, i: number) => (
                  <View key={i} style={styles.tag}><Text style={styles.tagText}>{h}</Text></View>
                ))}
              </View>
            </View>
          ) : null}

          {isMe && (
            <>
              <Section title="My Tools">
                <SavedTools />
                <MenuLink 
                  title="My Weekly Report" 
                  icon="stats-chart" 
                  onPress={() => nav.navigate('WeeklyReportDetail')} 
                  color={tokens.colors.light.accent}
                />
              </Section>
    
              <Section title="Support">
                <MenuLink 
                  title="Resources" 
                  icon="library-outline" 
                  onPress={() => nav.navigate('Resources')} 
                />
                <MenuLink 
                  title="Help Now" 
                  icon="heart-outline" 
                  onPress={() => nav.navigate('HelpNow')} 
                  color={tokens.colors.light.danger}
                />
              </Section>
    
              {profile?.role === 'staff' && (
                <Section title="Staff Area">
                  <MenuLink title="Moderation Queue" icon="shield-checkmark-outline" onPress={() => nav.navigate('ModerationQueue')} />
                  <MenuLink title="Admin Tools" icon="construct-outline" onPress={() => nav.navigate('Admin')} />
                </Section>
              )}
    
              {profile?.role === 'mentor' && (
                <Section title="Mentor Area">
                  <MenuLink title="Manage Office Slots" icon="calendar-outline" onPress={() => nav.navigate('ManageSlots')} />
                  <MenuLink title="Office Approvals" icon="checkmark-done-circle-outline" onPress={() => nav.navigate('OfficeApprovals')} />
                </Section>
              )}
    
              <Section title="Account">
                <MenuLink title="Notification Settings" icon="notifications-outline" onPress={() => nav.navigate('Notifications')} />
                <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
              </Section>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 24 },
  
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8
  },
  msgBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: tokens.colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: '#F3F4F6'
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#374151' },
  profileInfo: { flex: 1 },
  name: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  teenBadge: { backgroundColor: '#DBEAFE' },
  staffBadge: { backgroundColor: '#FEE2E2' },
  roleText: { fontSize: 10, fontWeight: '700', color: '#374151' },

  bioCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12 },
  bioText: { fontSize: 14, color: '#4B5563', marginBottom: 12, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginLeft: 4 },
  sectionContent: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  menuText: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' },
  
  signOutBtn: { padding: 16, alignItems: 'center' },
  signOutText: { color: tokens.colors.light.danger, fontWeight: '600', fontSize: 16 },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent'
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' }
})
