import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import Composer from './Composer'
import { PrimaryButton } from './Buttons'
import * as ImagePicker from 'expo-image-picker'
import { tokens } from '../theme/tokens'
import { Ionicons } from '@expo/vector-icons'

export default function PostComposer({ onSubmit }: { onSubmit: (text: string, mediaUri?: string) => void }) {
  const [text, setText] = useState('')
  const [media, setMedia] = useState<string | undefined>()

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images })
    if (!res.canceled) setMedia(res.assets[0].uri)
  }

  return (
    <View style={styles.card}>
      <Composer 
        value={text} 
        onChange={setText} 
        limit={300} 
        placeholder="Share something with the club..."
        multiline
      />
      
      {media && (
        <View style={styles.mediaPreview}>
          <Image source={{ uri: media }} style={styles.image} />
          <TouchableOpacity style={styles.removeBtn} onPress={() => setMedia(undefined)}>
            <Ionicons name="close-circle" size={24} color="rgba(0,0,0,0.6)" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={pick}>
          <Ionicons name="image-outline" size={24} color={tokens.colors.light.primary} />
        </TouchableOpacity>
        
        <PrimaryButton 
          title="Post" 
          onPress={() => { onSubmit(text, media); setText(''); setMedia(undefined) }} 
          disabled={!text.trim()}
          style={{ width: 80, height: 36, paddingVertical: 0 }}
          textStyle={{ fontSize: 14 }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.light.surface,
    borderRadius: tokens.radii.card,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12
  },
  mediaPreview: { position: 'relative', marginTop: 8 },
  image: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#F3F4F6' },
  removeBtn: { position: 'absolute', top: 8, right: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  iconBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F9FAFB' }
})

