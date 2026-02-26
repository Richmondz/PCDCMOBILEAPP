import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { tokens } from './src/theme/tokens'
import HomeScreen from './src/screens/Home';
import SpacesScreen from './src/screens/Spaces';
import ClipsScreen from './src/screens/Clips';
import InboxScreen from './src/screens/Inbox';
import ProfileScreen from './src/screens/Profile';
import { AuthGate } from './src/screens/Auth/AuthGate';
import { useEffect, useState } from 'react';
import { useNotifications } from './src/store/notifications';
import Banner from './src/components/Banner';
import * as Offline from './src/lib/offline_storage';
import { supabase } from './src/lib/supabase';
import { ensureWeeklyRecap } from './src/store/recap';
import PresenceTracker from './src/modules/presence';
import ActivityTracker from './src/components/ActivityTracker';
import InstallPrompt from './src/components/pwa/InstallPrompt';
import FloatingBackButton from './src/components/FloatingBackButton';
import SettingsScreen from './src/screens/Profile/Settings';
import NotificationsScreen from './src/screens/Profile/Notifications';
import EditProfileScreen from './src/screens/Profile/EditProfile';
import WeeklyRecapScreen from './src/screens/Profile/WeeklyReportDetail';
import ChatScreen from './src/screens/Inbox/Thread';
import UploadClipScreen from './src/screens/Clips/Upload';
import ChannelsScreen from './src/screens/Spaces/Channels';
import ModerationQueueScreen from './src/screens/Moderation/ModerationQueue';
import ResourcesScreen from './src/screens/Resources';
import HelpNowScreen from './src/screens/Resources/HelpNow';
import WeeklyReportDetailScreen from './src/screens/Profile/WeeklyReportDetail';
import BreathingTimerScreen from './src/screens/Tools/BreathingTimer';
import GroundingGameScreen from './src/screens/Tools/GroundingGame';
import ReframeCardScreen from './src/screens/Tools/ReframeCard';


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
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Root" component={Tabs} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="WeeklyRecap" component={WeeklyRecapScreen} />
            <Stack.Screen name="Thread" component={ChatScreen} />
            <Stack.Screen name="UploadClip" component={UploadClipScreen} />
            <Stack.Screen name="Channels" component={ChannelsScreen} />
            <Stack.Screen name="ModerationQueue" component={ModerationQueueScreen} />
            <Stack.Screen name="Resources" component={ResourcesScreen} />
            <Stack.Screen name="HelpNow" component={HelpNowScreen} />
            <Stack.Screen name="WeeklyReportDetail" component={WeeklyReportDetailScreen} />
            <Stack.Screen name="BreathingTimer" component={BreathingTimerScreen} />
            <Stack.Screen name="GroundingGame" component={GroundingGameScreen} />
            <Stack.Screen name="ReframeCard" component={ReframeCardScreen} />
          </Stack.Navigator>
          <FloatingBackButton />
          {banner ? <Banner message={banner} /> : null}
        </AuthGate>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.light.primary,
        tabBarInactiveTintColor: tokens.colors.light.textTertiary,
        tabBarStyle: {
          backgroundColor: tokens.colors.light.surface,
          borderTopColor: 'rgba(0,0,0,0.06)',
          borderTopWidth: 1,
          paddingTop: 8,
          height: 64
        },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
        tabBarIconStyle: { marginBottom: -2 }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tab.Screen 
        name="Spaces" 
        component={SpacesScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }}
      />
      <Tab.Screen 
        name="Inbox" 
        component={InboxScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} /> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  )
}
