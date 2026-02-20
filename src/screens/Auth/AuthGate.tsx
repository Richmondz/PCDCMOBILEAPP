import { useEffect } from 'react'
import { View } from 'react-native'
import { initAuth, useAuth } from '../../store/auth'
import SignIn from './SignIn'
import Onboarding from './Onboarding'
import OnboardingWizard from './OnboardingWizard'
import { useProfile } from '../../store/profile'
import InstallPrompt from '../../components/pwa/InstallPrompt';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, setSession } = useAuth()
  const { profile, loadProfile } = useProfile()

  useEffect(() => { initAuth(setSession) }, [])
  useEffect(() => { if (session) loadProfile() }, [session])

  return (
    <View style={{ flex: 1 }}>
      <Text style={{position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', backgroundColor: 'yellow', padding: 10, zIndex: 9999, color: 'black', fontWeight: 'bold'}}>DEBUGGER v4</Text>
      {children}
    </View>
  );
}

