import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { LinearGradient } from 'expo-linear-gradient'
import { tokens } from '../theme/tokens'
import { PrimaryButton, SecondaryButton } from './Buttons'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function ClipCard({ title, description, videoUrl, onSave, onTry, onAsk, bookmarked }: {
  title: string
  description?: string
  videoUrl: string
  onSave: () => void
  onTry: () => void
  onAsk: () => void
  bookmarked: boolean
}) {
  return (
    <View style={styles.card}>
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          onError={(e) => console.log('Video Load Error:', e)}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        >
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.desc} numberOfLines={2}>{description}</Text> : null}
        </LinearGradient>
      </View>
      
      <View style={styles.actions}>
        <View style={styles.mainActions}>
          <PrimaryButton 
            title={bookmarked ? 'Saved' : 'Save'} 
            onPress={onSave}
            icon={bookmarked ? "bookmark" : "bookmark-outline"}
            style={{ flex: 1 }}
          />
          <SecondaryButton 
            title="Try It" 
            onPress={onTry} 
            icon="play-circle-outline"
            style={{ flex: 1 }}
          />
        </View>
        <SecondaryButton 
          title="Ask Mentor" 
          onPress={onAsk} 
          icon="chatbubble-ellipses-outline"
          style={{ width: '100%' }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { 
    borderRadius: tokens.radii.large, 
    backgroundColor: tokens.colors.light.surface, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: tokens.spacing.s24
  },
  videoContainer: {
    width: '100%',
    height: width * 1.2, // Taller aspect ratio
    position: 'relative',
    backgroundColor: '#000' // Ensure black background
  },
  video: { 
    width: '100%', 
    height: '100%',
    backgroundColor: '#000'
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: tokens.spacing.s16,
    paddingTop: tokens.spacing.s48
  },
  title: { 
    fontSize: tokens.typography.header, 
    fontWeight: '700', 
    color: '#FFFFFF',
    marginBottom: tokens.spacing.s4
  },
  desc: { 
    fontSize: tokens.typography.body, 
    color: '#E5E7EB' 
  },
  actions: { 
    padding: tokens.spacing.s16, 
    gap: tokens.spacing.s12 
  },
  mainActions: {
    flexDirection: 'row',
    gap: tokens.spacing.s12
  }
})

