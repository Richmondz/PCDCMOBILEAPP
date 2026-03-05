import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import AppHeader from '../../components/AppHeader'
import { tokens } from '../../theme/tokens'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'

export default function PlayHub() {
  const nav = useNavigation<any>()

  return (
    <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <AppHeader title="Play" />
        
        <View style={styles.content}>
          <Text style={styles.title}>Earn XP & Have Fun</Text>
          <Text style={styles.subtitle}>Compete on the leaderboard and test your PCDC knowledge</Text>

          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.navigate('Leaderboard')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>🏆</Text>
                </View>
                <Text style={styles.cardTitle}>Weekly Leaderboard</Text>
                <Text style={styles.cardDesc}>See who's on top. Ranked by XP. Resets every Sunday.</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardMeta}>Levels • XP</Text>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.navigate('PCDCRunner')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>🐔</Text>
                </View>
                <Text style={styles.cardTitle}>Crossy Trivia</Text>
                <Text style={styles.cardDesc}>Like Crossy Road! Tap to move, avoid cars. PCDC trivia every minute.</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardMeta}>+10 XP per correct</Text>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, padding: 20, gap: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#94A3B8', marginBottom: 24 },
  card: { borderRadius: 20, overflow: 'hidden', ...tokens.shadows.lg },
  cardGradient: { padding: 24, gap: 12 },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  cardDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  cardMeta: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }
})
