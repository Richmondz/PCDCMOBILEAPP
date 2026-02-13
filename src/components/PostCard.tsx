import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { tokens } from '../theme/tokens'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function PostCard({ author, content, mediaUrl, createdAt, reactions, onReact, onLongPress, onEscalate, onPressAuthor }: {
  author: string
  content: string
  mediaUrl?: string
  createdAt: string
  reactions: Record<string, boolean>
  onReact: (type: string) => void
  onLongPress: () => void
  onEscalate?: () => void
  onPressAuthor?: () => void
}) {
  return (
    <TouchableOpacity style={styles.card} onLongPress={onLongPress} activeOpacity={0.95}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatar} onPress={onPressAuthor}>
          <Text style={styles.avatarText}>{author[0]?.toUpperCase() || '?'}</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={onPressAuthor}>
            <Text style={styles.author}>{author}</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{new Date(createdAt).toLocaleDateString()} • {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        {onEscalate ? (
          <TouchableOpacity style={styles.moreBtn} onPress={onEscalate}>
            <Ionicons name="ellipsis-horizontal" size={20} color={tokens.colors.light.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.content}>{content}</Text>
      
      {mediaUrl ? (
        <Image 
          source={{ uri: mediaUrl }} 
          style={styles.image} 
          resizeMode="cover"
          onError={(e) => console.warn('Image load error:', e.nativeEvent.error, mediaUrl)}
        />
      ) : null}

      <View style={styles.actions}>
        <View style={styles.reactions}>
          {['heart','thumbs-up','hand-left'].map((icon, idx) => {
            const types = ['heart','clap','handshake']
            const type = types[idx]
            const active = !!reactions[type]
            const iconName = icon as any
            
            return (
              <TouchableOpacity 
                key={type} 
                style={[styles.reactBtn, active && styles.reactActive]} 
                onPress={() => onReact(type)}
              >
                <Ionicons 
                  name={active ? iconName : `${iconName}-outline` as any} 
                  size={20} 
                  color={active ? tokens.colors.light.primary : tokens.colors.light.textSecondary} 
                />
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: tokens.colors.light.surface, 
    borderRadius: tokens.radii.card, 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#F3F4F6', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  headerInfo: { flex: 1 },
  author: { fontSize: 16, fontWeight: '600', color: '#111827' },
  time: { fontSize: 12, color: '#9CA3AF' },
  moreBtn: { padding: 4 },
  content: { fontSize: 16, lineHeight: 24, color: '#374151', marginBottom: 12 },
  image: { 
    width: '100%', 
    height: 250, 
    borderRadius: 12, 
    marginBottom: 12,
    backgroundColor: '#F3F4F6'
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  reactions: { flexDirection: 'row', gap: 16 },
  reactBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F9FAFB' },
  reactActive: { backgroundColor: '#EFF6FF' }
})
