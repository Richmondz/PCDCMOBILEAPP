import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import FadeInView from '../../components/FadeInView'
import { tokens } from '../../theme/tokens'

export default function PlayPromo() {
  const nav = useNavigation<any>()

  return (
    <FadeInView delay={60}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => nav.navigate('Play')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.emoji}>🏆</Text>
            <View style={styles.textBlock}>
              <Text style={styles.title}>Play & Compete</Text>
              <Text style={styles.subtitle}>Leaderboard • Crossy Road-style Trivia</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </FadeInView>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', ...tokens.shadows.md },
  gradient: { padding: 16 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 32 },
  textBlock: { flex: 1 },
  title: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  arrow: { fontSize: 20, color: 'rgba(255,255,255,0.8)', fontWeight: '700' }
})
