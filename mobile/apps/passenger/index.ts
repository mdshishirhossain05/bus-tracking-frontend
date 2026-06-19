import { registerRootComponent } from 'expo';

// Importing this module runs TaskManager.defineTask at the global scope, which
// is required for the keep-alive foreground-service task to be invokable by the
// OS even when the app's UI isn't mounted.
import './src/location/backgroundTask';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
