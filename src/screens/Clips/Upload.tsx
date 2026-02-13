import { useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { tokens } from '../../theme/tokens'
import { PrimaryButton } from '../../components/Buttons'
import Composer from '../../components/Composer'
import * as ImagePicker from 'expo-image-picker'
import { useClips } from '../../store/clips'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'

export default function UploadClip() {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [uri, setUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { upload } = useClips()

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos })
    if (!res.canceled) setUri(res.assets[0].uri)
  }

  async function save() {
    if (!uri) return
    setLoading(true)
    try {
      const result = await upload(uri, title, desc, date || undefined)
      
      // Reset form on success
      setTitle('')
      setDesc('')
      setDate('')
      setUri(null)

      if (result.refreshed) {
        alert('Clip uploaded successfully! You might need to refresh the feed to see it.')
      } else {
        alert('Uploaded successfully, but could not refresh the feed. Please pull to refresh manually.')
      }
    } catch (e: any) {
      console.error('Upload error:', e)
      alert('Upload failed: ' + (e.message || JSON.stringify(e)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Upload Clip</Text>
            <Text style={styles.subtitle}>Share a helpful video with the club</Text>

            <TouchableOpacity style={styles.videoPicker} onPress={pick}>
              {uri ? (
                <Video
                  source={{ uri }}
                  style={styles.videoPreview}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                />
              ) : (
                <View style={styles.pickerContent}>
                  <Ionicons name="videocam" size={48} color={tokens.colors.light.primary} />
                  <Text style={styles.pickerText}>Tap to select video</Text>
                </View>
              )}
              {uri && (
                <View style={styles.changeOverlay}>
                  <Text style={styles.changeText}>Change</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.form}>
              <View>
                <Text style={styles.label}>Title</Text>
                <Composer value={title} onChange={setTitle} limit={100} placeholder="e.g. 5-Min Meditation" />
              </View>

              <View>
                <Text style={styles.label}>Description</Text>
                <Composer value={desc} onChange={setDesc} limit={200} placeholder="What is this video about?" />
              </View>

              <View>
                <Text style={styles.label}>Active Date (YYYY-MM-DD)</Text>
                <Composer value={date} onChange={setDate} limit={10} placeholder="Optional - default is today" />
              </View>

              <PrimaryButton 
                title={loading ? "Publishing..." : "Publish Clip"} 
                onPress={save} 
                disabled={!uri || !title || loading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  
  videoPicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pickerContent: { alignItems: 'center', gap: 8 },
  pickerText: { fontSize: 16, color: '#2563EB', fontWeight: '600' },
  videoPreview: { width: '100%', height: '100%' },
  changeOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  changeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  form: { gap: 20 },
  label: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#6B7280', 
    textTransform: 'uppercase', 
    marginBottom: 8,
    letterSpacing: 0.5
  }
})

