import { View, ScrollView, StyleSheet } from 'react-native'
import Card from '../../components/Card'
import QuickToolChip from '../../components/QuickToolChip'
import { tokens } from '../../theme/tokens'
import { useNavigation } from '@react-navigation/native'

export default function QuickTools() {
  const nav = useNavigation<any>()
  return (
    <Card>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <QuickToolChip label="Breathing" onPress={() => nav.navigate('BreathingTimer')} />
        <QuickToolChip label="Grounding" onPress={() => nav.navigate('GroundingGame')} />
        <QuickToolChip label="Reframe" onPress={() => nav.navigate('ReframeCard')} />
      </ScrollView>
    </Card>
  )
}

const styles = StyleSheet.create({ row: { gap: tokens.spacing.s12 } })

