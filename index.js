import { registerRootComponent } from 'expo';
import App from './App';

// SW registration disabled - causes "insecure" DOMException on Vercel; app works without it

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// and ensures the environment is set up for Expo Go or native builds
registerRootComponent(App);
