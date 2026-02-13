import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { tokens } from '../theme/tokens'

export default function MessageBubble({ content, mine }: { content: string; mine: boolean }) {
  if (mine) {
    return (
      <View style={[styles.row, styles.right]}>
        <LinearGradient
          colors={[tokens.colors.light.primaryGradientStart, tokens.colors.light.primaryGradientEnd]}
          style={[styles.bubble, styles.mine]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.text, styles.textMine]}>{content}</Text>
        </LinearGradient>
      </View>
    )
  }

  return (
    <View style={[styles.row, styles.left]}>
      <View style={[styles.bubble, styles.other]}>
        <Text style={[styles.text, styles.textOther]}>{content}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4 },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { 
    maxWidth: '80%', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  mine: { 
    borderBottomRightRadius: 4,
  },
  other: { 
    backgroundColor: '#FFFFFF', 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  text: { fontSize: 16, lineHeight: 22 },
  textMine: { color: '#FFFFFF' },
  textOther: { color: '#1F2937' }
})

