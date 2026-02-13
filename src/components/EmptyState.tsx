import { View, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { padding: tokens.spacing.s24, alignItems: 'center' },
  title: { fontSize: tokens.typography.header, fontWeight: '600' },
  subtitle: { marginTop: tokens.spacing.s8, color: tokens.colors.light.muted }
})

