import { View, Text, StyleSheet } from 'react-native'
import { tokens } from '../theme/tokens'

export default function AppHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.s16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: tokens.typography.header,
    fontWeight: '600'
  }
})

