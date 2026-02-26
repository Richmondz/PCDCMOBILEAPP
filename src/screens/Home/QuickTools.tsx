import { View, ScrollView, StyleSheet, Text } from 'react-native'
import Card from '../../components/Card'
import QuickToolChip from '../../components/QuickToolChip'
import { tokens } from '../../theme/tokens'
import { useNavigation } from '@react-navigation/native'
import FadeInView from '../../components/FadeInView'

export default function QuickTools() {
  const nav = useNavigation<any>()
  return (
    <FadeInView delay={200}>
      <Card>
        <Text style={styles.sectionTitle}>Wellness Tools</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          <QuickToolChip label="Breathing" onPress={() => nav.navigate('BreathingTimer')} />
          <QuickToolChip label="Grounding" onPress={() => nav.navigate('GroundingGame')} />
          <QuickToolChip label="Reframe" onPress={() => nav.navigate('ReframeCard')} />
        </ScrollView>
      </Card>
    </FadeInView>
  )
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.light.text,
    marginBottom: 12
  },
  row: { gap: tokens.spacing.s12 }
})
