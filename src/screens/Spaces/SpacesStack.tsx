import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Spaces from './index';
import Channels from './Channels';
import CommunityBoard from './CommunityBoard';
import GeneralChat from './GeneralChat';

const Stack = createNativeStackNavigator();

export default function SpacesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="SpacesRoot" component={Spaces} />
      <Stack.Screen name="Channels" component={Channels} />
      <Stack.Screen name="CommunityBoard" component={CommunityBoard} />
      <Stack.Screen name="GeneralChat" component={GeneralChat} />
    </Stack.Navigator>
  );
}
