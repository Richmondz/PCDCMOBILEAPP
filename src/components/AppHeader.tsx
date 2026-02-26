import { View, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function AppHeader({ title, action, showBack }: { title: string; action?: React.ReactNode; showBack?: boolean }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.s16,
    paddingVertical: tokens.spacing.s12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: tokens.typography.header,
    fontWeight: '700',
    color: tokens.colors.light.text,
    letterSpacing: -0.3
  }
})

