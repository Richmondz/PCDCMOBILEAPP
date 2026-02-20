import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showIosInstall, setShowIosInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    if (Platform.OS === 'web') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

      if (isIos() && isSafari() && !isInStandaloneMode()) {
        setShowIosInstall(true);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  if (!installPrompt && !showIosInstall) {
    return null;
  }

  if (showIosInstall) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          To install, tap the Share button <Ionicons name="share-outline" size={18} /> and then 'Add to Home Screen'.
        </Text>
        <TouchableOpacity onPress={() => setShowIosInstall(false)} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Install the YouthConnect Hub app!</Text>
      <TouchableOpacity style={styles.button} onPress={handleInstallClick}>
        <Text style={styles.buttonText}>Install</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2c3e50',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#34495e',
  },
  text: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
});

export default InstallPrompt;
