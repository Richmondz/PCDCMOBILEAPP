import React from 'react'
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native'
import { tokens } from '../theme/tokens'

export type OptionItem = {
  label: string
  onPress: () => void
  isDestructive?: boolean
  icon?: string // Optional icon name if needed later
}

type Props = {
  visible: boolean
  title?: string
  options: OptionItem[]
  onClose: () => void
}

export default function OptionsModal({ visible, title, options, onClose }: Props) {
  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.content}>
          {title && <Text style={styles.title}>{title}</Text>}
          
          {options.map((opt, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.option, i === options.length - 1 && styles.lastOption]} 
              onPress={() => {
                onClose()
                // Small delay to allow modal to close before action (e.g. alert)
                setTimeout(() => opt.onPress(), 100)
              }}
            >
              <Text style={[styles.optionText, opt.isDestructive && styles.destructive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={[styles.option, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end', // Bottom sheet style
    padding: Platform.OS === 'web' ? 0 : 0
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    paddingTop: 8,
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    width: '100%',
    alignSelf: 'center'
  },
  title: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  option: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  lastOption: {
    borderBottomWidth: 0
  },
  optionText: {
    fontSize: 18,
    color: '#007AFF'
  },
  destructive: {
    color: '#EF4444'
  },
  cancel: {
    marginTop: 8,
    borderTopWidth: 8,
    borderTopColor: '#F3F4F6', // Separator look
    borderBottomWidth: 0
  },
  cancelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF'
  }
})
