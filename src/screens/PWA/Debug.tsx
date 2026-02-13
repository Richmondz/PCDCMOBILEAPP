import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native'
import { tokens } from '../../theme/tokens'
import AppHeader from '../../components/AppHeader'

export default function PwaDebug() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    if (Platform.OS === 'web') {
      setInfo({
        userAgent: window.navigator.userAgent,
        standalone: (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone),
        serviceWorker: 'serviceWorker' in navigator,
        online: navigator.onLine,
        width: window.innerWidth,
        height: window.innerHeight,
        platform: Platform.OS
      })
    } else {
      setInfo({ platform: Platform.OS })
    }
  }, [])

  return (
    <View style={styles.container}>
      <AppHeader title="PWA Debug" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Environment Info</Text>
        <View style={styles.card}>
          {Object.entries(info).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key}:</Text>
              <Text style={styles.value}>{String(value)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.light.background },
  content: { padding: 16 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: tokens.colors.light.textPrimary },
  card: {
    backgroundColor: tokens.colors.light.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: tokens.colors.light.border
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  label: { fontWeight: '600', color: '#6B7280' },
  value: { color: '#111827', maxWidth: '60%' }
})
