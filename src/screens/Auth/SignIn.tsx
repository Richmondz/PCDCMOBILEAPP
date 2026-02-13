import { useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PrimaryButton } from '../../components/Buttons'
import Composer from '../../components/Composer'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme/tokens'

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSignIn() {
    setError(null)
    setLoading(true)
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setError('Account created! Check your email to confirm.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    
    setLoading(false)
  }

  return (
    <LinearGradient
      colors={[tokens.colors.light.background, '#E0F2FE']}
      style={styles.gradient}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</Text>
                <Text style={styles.subtitle}>{isSignUp ? "Join PCDC Teen Club" : "Sign in to PCDC Teen Club"}</Text>
              </View>

              <View style={styles.form}>
                <Composer 
                  label="Email"
                  value={email} 
                  onChange={setEmail} 
                  limit={100} 
                  placeholder="Enter your email"
                  showCount={false}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Composer 
                  label="Password"
                  value={password} 
                  onChange={setPassword} 
                  limit={100} 
                  placeholder="Enter your password"
                  showCount={false}
                  secureTextEntry
                />

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <PrimaryButton 
                  title={loading ? (isSignUp ? "Creating..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign In")} 
                  onPress={onSignIn} 
                />

                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ alignSelf: 'center', marginTop: 8 }}>
                  <Text style={{ color: tokens.colors.light.primary, fontWeight: '600' }}>
                    {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: tokens.spacing.s16 },
  card: {
    backgroundColor: tokens.colors.light.surface,
    borderRadius: tokens.radii.large,
    padding: tokens.spacing.s24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    gap: tokens.spacing.s32
  },
  header: { alignItems: 'center', gap: tokens.spacing.s8 },
  title: { 
    fontSize: tokens.typography.display, 
    fontWeight: '800', 
    color: tokens.colors.light.text,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: tokens.typography.body,
    color: tokens.colors.light.textSecondary,
    textAlign: 'center'
  },
  form: { gap: tokens.spacing.s24 },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: tokens.spacing.s12,
    borderRadius: tokens.radii.small,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  errorText: {
    color: tokens.colors.light.danger,
    fontSize: tokens.typography.caption,
    textAlign: 'center'
  }
})

