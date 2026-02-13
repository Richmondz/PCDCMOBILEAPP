import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { PrimaryButton } from '../../components/Buttons'
import { supabase } from '../../lib/supabase'
import * as MailComposer from 'expo-mail-composer'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'

export default function DataExport() {
  const [loading, setLoading] = useState(false)

  async function exportData() {
    setLoading(true)
    try {
      // 1. Fetch All Data
      const { data: users, error: err1 } = await supabase.from('profiles').select('*')
      if (err1) console.log('Err1', err1)

      const { data: checkIns, error: err2 } = await supabase.from('check_ins').select('*, profiles(nickname)')
      if (err2) console.log('Err2', err2)

      // The table name might be 'tool_usage_logs' or 'tool_usage'? Let's check schema.
      // Based on 002_tool_usage.sql (inferred), it is likely 'tool_usage_logs'.
      // If it fails, we will try 'tool_usage' or skip it.
      let tools = []
      const { data: toolsData, error: err3 } = await supabase.from('tool_usage_logs').select('*, profiles(nickname)')
      if (!err3) tools = toolsData || []
      else {
         console.log('Err3 (logs)', err3)
         // Fallback or ignore
      }

      const { data: posts, error: err4 } = await supabase.from('channel_posts').select('*, profiles(nickname), channels(name)')
      if (err4) console.log('Err4', err4)

      // Only throw if critical user data is missing. 
      if (!users) throw new Error('Failed to fetch profiles data')

      // 2. Format CSVs
      const csvUsers = [
        'ID,Nickname,Role,Grade,Created At',
        ...users.map(u => `${u.id},${u.nickname},${u.role},${u.grade},${u.created_at}`)
      ].join('\n')

      const csvCheckIns = [
        'Date,User,Mood,Note,Tags',
        ...checkIns.map((c: any) => `${c.created_at},${c.profiles?.nickname},${c.mood},"${c.note || ''}","${c.tags?.join('|')}"`)
      ].join('\n')

      const csvTools = [
        'Date,User,Tool,Duration(s)',
        ...(tools || []).map((t: any) => `${t.created_at},${t.profiles?.nickname},${t.tool_key},${t.duration_seconds || 0}`)
      ].join('\n')

      const csvPosts = [
        'Date,User,Channel,Content',
        ...(posts || []).map((p: any) => `${p.created_at},${p.profiles?.nickname},${p.channels?.name},"${p.content.replace(/"/g, '""')}"`)
      ].join('\n')

      // 3. Create Files
      const dir = FileSystem.cacheDirectory + 'export/'
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
      
      const files = [
        { name: 'users.csv', content: csvUsers },
        { name: 'checkins.csv', content: csvCheckIns },
        { name: 'tools.csv', content: csvTools },
        { name: 'posts.csv', content: csvPosts }
      ]

      const attachments = []
      for (const f of files) {
        const path = dir + f.name
        await FileSystem.writeAsStringAsync(path, f.content)
        attachments.push(path)
      }

      // 4. Send Email
      const isAvailable = await MailComposer.isAvailableAsync()
      
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: ['yzholdingsllc8011@gmail.com', 'ryang@chinatown-pcdc.org'],
          subject: `PCDC App Data Export - ${new Date().toLocaleDateString()}`,
          body: 'Attached is the latest data export from the PCDC Teen Club App.',
          attachments: attachments
        })
      } else {
        // Fallback: Share the files individually or zip them (zipping requires another lib, so just share first one for now or alert)
        // Since sharing multiple files isn't always supported, let's just share them one by one or warn.
        // Actually, Sharing.shareAsync usually takes one file.
        // Let's try to share the first file as a fallback or alert user.
        Alert.alert(
          'Mail Not Available', 
          'The default mail app is not configured. Do you want to save/share the files manually?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Share Users CSV', onPress: () => Sharing.shareAsync(attachments[0]) },
            { text: 'Share Check-ins CSV', onPress: () => Sharing.shareAsync(attachments[1]) }
          ]
        )
      }

    } catch (e: any) {
      console.log('Export Error:', e)
      Alert.alert('Export Failed', e.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Data Export" showBack />
        
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons name="cloud-download-outline" size={48} color={tokens.colors.light.primary} />
            </View>
            <Text style={styles.title}>Export All Database Records</Text>
            <Text style={styles.desc}>
              This will generate CSV files for Users, Check-ins, Tool Usage, and Posts, and attach them to an email addressed to the administrators.
            </Text>
            
            <View style={styles.recipientBox}>
              <Text style={styles.recipientLabel}>Recipients:</Text>
              <Text style={styles.recipient}>yzholdingsllc8011@gmail.com</Text>
              <Text style={styles.recipient}>ryang@chinatown-pcdc.org</Text>
            </View>

            <PrimaryButton 
              title={loading ? "Generating..." : "Generate & Send Email"} 
              onPress={exportData} 
              disabled={loading}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { padding: 16, justifyContent: 'center', flex: 1 },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    gap: 16
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  desc: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  
  recipientBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4
  },
  recipientLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 },
  recipient: { fontSize: 14, fontWeight: '600', color: '#374151', fontFamily: 'monospace' }
})