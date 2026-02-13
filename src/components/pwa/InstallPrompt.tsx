import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Detect iOS
const isIos = () => {
  if (Platform.OS !== 'web') return false
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent)
}

// Detect if already in standalone mode
const isStandalone = () => {
  if (Platform.OS !== 'web') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIosPrompt, setIsIosPrompt] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    if (isStandalone()) return

    const checkDismissed = async () => {
      const dismissed = await AsyncStorage.getItem('pwa_prompt_dismissed')
      if (dismissed) {
        const timestamp = parseInt(dismissed, 10)
        // Show again after 7 days
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
          return
        }
      }

      // Android / Chrome
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShowPrompt(true)
      })

      // iOS
      if (isIos()) {
        setShowPrompt(true)
        setIsIosPrompt(true)
      }
    }

    checkDismissed()
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = async () => {
    setShowPrompt(false)
    await AsyncStorage.setItem('pwa_prompt_dismissed', Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-pwa" size={24} color="#FFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Install YouthConnect</Text>
            <Text style={styles.subtitle}>
              {isIosPrompt 
                ? "Install this app on your iPhone for the best experience." 
                : "Add to Home Screen for quick access and full-screen view."}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {isIosPrompt ? (
          <View style={styles.iosInstructions}>
            <Text style={styles.iosStep}>1. Tap the <Ionicons name="share-outline" size={16} color="#FFF" /> Share button below</Text>
            <Text style={styles.iosStep}>2. Select <Text style={{ fontWeight: '700' }}>Add to Home Screen</Text></Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
            <Text style={styles.installBtnText}>Install App</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
    // Only show on mobile widths if desired, but React Native Web usually handles responsiveness
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%'
  },
  content: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#374151'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#374151',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18
  },
  closeBtn: {
    padding: 4
  },
  installBtn: {
    marginTop: 16,
    backgroundColor: '#6B46C1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  installBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14
  },
  iosInstructions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 8
  },
  iosStep: {
    color: '#D1D5DB',
    fontSize: 13
  }
})
