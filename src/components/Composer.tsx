import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native'
import { tokens } from '../theme/tokens'

interface ComposerProps extends TextInputProps {
  value: string
  onChange: (t: string) => void
  limit?: number
  label?: string
  showCount?: boolean
}

export default function Composer({ 
  value, 
  onChange, 
  limit = 280, 
  placeholder = "Write something...",
  label,
  showCount = false,
  multiline = false,
  ...props
}: ComposerProps) {
  const remaining = limit - value.length
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, multiline && styles.multilineContainer]}>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.light.textTertiary}
          multiline={multiline}
          maxLength={limit}
          {...props}
        />
      </View>
      {showCount && (
        <Text style={[styles.helper, remaining < 20 && { color: tokens.colors.light.danger }]}>
          {remaining} characters left
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2
  },
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden'
  },
  multilineContainer: {
    minHeight: 80,
    maxHeight: 150
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#111827',
    width: '100%'
  },
  multilineInput: {
    height: '100%',
    textAlignVertical: 'top'
  },
  helper: { 
    fontSize: 12, 
    color: '#6B7280', 
    textAlign: 'right',
    marginTop: 4
  }
})

