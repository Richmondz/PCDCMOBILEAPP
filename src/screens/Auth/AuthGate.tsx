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

  if (!session) return <SignIn />
  if (!profile) return <View style={{flex:1,backgroundColor:'#fff'}} /> // Loading state
  
  // Check if hobbies/bio/zodiac are missing (rudimentary check for "onboarding complete")
  // Or check specific flag if we added one. For now, let's assume if 'bio' is empty, they need to onboard.
  const needsOnboarding = !profile.bio || !profile.hobbies || !profile.hobbies.length
  
  if (needsOnboarding) return <Onboarding />

  return (
    <View style={{ flex: 1 }}>
      {children}
      <InstallPrompt />
    </View>
  );
}
