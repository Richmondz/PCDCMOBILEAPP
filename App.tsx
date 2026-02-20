import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme, Platform } from 'react-native'
import HomeScreen from './src/screens/Home'
import SpacesStack from './src/screens/Spaces/SpacesStack';
import ClipsScreen from './src/screens/Clips'
import InboxScreen from './src/screens/Inbox'
import ProfileScreen from './src/screens/Profile'
import { AuthGate } from './src/screens/Auth/AuthGate'
import { tokens } from './src/theme/tokens'
import { useEffect, useState } from 'react'
import { useNotifications } from './src/store/notifications'
import Banner from './src/components/Banner'
import * as Offline from './src/lib/offline_storage'
import { supabase } from './src/lib/supabase'
import { ensureWeeklyRecap } from './src/store/recap'
import PresenceTracker from './src/modules/presence'
import ActivityTracker from './src/components/ActivityTracker'
import InstallPrompt from './src/components/pwa/InstallPrompt'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

export default function App() {
  const scheme = useColorScheme()
  const { banner, init } = useNotifications()
  const [inited, setInited] = useState(false)

  useEffect(() => {
    (async () => {
      await ensureWeeklyRecap()
      if (!inited) {
        init()
        setInited(true)
      }
    })()
  }, [inited])

  useEffect(() => {
    Offline.flush({
      post: async (p) => { await supabase.from('channel_posts').insert(p) },
      message: async (p) => { await supabase.from('messages').insert(p) }
    })
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, [])

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <AuthGate>
          <InstallPrompt />
          <PresenceTracker />
          <ActivityTracker />
          <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
            <Stack.Screen name="Root" component={Tabs} />
            <Stack.Screen name="Thread" component={require('./src/screens/Inbox/Thread').default} />
            <Stack.Screen name="NewMessage" component={require('./src/screens/Inbox/NewMessage').default} />
            <Stack.Screen name="BreathingTimer" component={require('./src/screens/Tools/BreathingTimer').default} />
            <Stack.Screen name="GroundingGame" component={require('./src/screens/Tools/GroundingGame').default} />
            <Stack.Screen name="ReframeCard" component={require('./src/screens/Tools/ReframeCard').default} />
            <Stack.Screen name="UploadClip" component={require('./src/screens/Clips/Upload').default} />
            <Stack.Screen name="ModerationQueue" component={require('./src/screens/Moderation/ModerationQueue').default} />
            <Stack.Screen name="Admin" component={require('./src/screens/Admin').default} />
            <Stack.Screen name="AdminCohorts" component={require('./src/screens/Admin/Cohorts').default} />
            <Stack.Screen name="CohortMembers" component={require('./src/screens/Admin/CohortMembers').default} />
            <Stack.Screen name="AdminMentors" component={require('./src/screens/Admin/Mentors').default} />
            <Stack.Screen name="AdminPrompts" component={require('./src/screens/Admin/Prompts').default} />
            {/* Removed: AdminClips, AdminRequests, BulkImport, AdminMentors */}
            <Stack.Screen name="AdminReports" component={require('./src/screens/Admin/Reports').default} />
            <Stack.Screen name="DataExport" component={require('./src/screens/Admin/DataExport').default} />
            <Stack.Screen name="AskMentorForm" component={require('./src/screens/Inbox/AskMentorForm').default} />
            <Stack.Screen name="Resources" component={require('./src/screens/Resources').default} />
            <Stack.Screen name="HelpNow" component={require('./src/screens/Resources/HelpNow').default} />
            {/* <Stack.Screen name="AdminRequests" component={require('./src/screens/Admin/Requests').default} /> */}
            <Stack.Screen name="EscalationInbox" component={require('./src/screens/Staff/EscalationInbox').default} />
            <Stack.Screen name="EscalateForm" component={require('./src/screens/Staff/EscalateForm').default} />
            <Stack.Screen name="Notifications" component={require('./src/screens/Profile/Notifications').default} />
            {/* <Stack.Screen name="BulkImport" component={require('./src/screens/Admin/BulkImport').default} /> */}
            <Stack.Screen name="StaffDashboard" component={require('./src/screens/Staff/Dashboard').default} />
            <Stack.Screen name="StaffMetrics" component={require('./src/screens/Staff/Metrics').default} />
            <Stack.Screen name="ManageSlots" component={require('./src/screens/Office/ManageSlots').default} />
            <Stack.Screen name="RequestSlot" component={require('./src/screens/Office/Request').default} />
            <Stack.Screen name="OfficeApprovals" component={require('./src/screens/Office/Approvals').default} />
            <Stack.Screen name="WeeklyReportDetail" component={require('./src/screens/Profile/WeeklyReportDetail').default} />
            <Stack.Screen name="PwaDebug" component={require('./src/screens/PWA/Debug').default} />
          </Stack.Navigator>
          {banner ? <Banner message={banner} /> : null}
        </AuthGate>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Spaces" component={SpacesStack} />
      {/* <Tab.Screen name="Clips" component={ClipsScreen} /> */}
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
