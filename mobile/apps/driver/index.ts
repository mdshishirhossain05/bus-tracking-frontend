import { registerRootComponent } from "expo";

// Importing this module runs TaskManager.defineTask at the global scope, which
// is required for the background location task to be invokable by the OS even
// when the app's UI isn't mounted.
import "./src/location/backgroundTask";

import App from "./App";

registerRootComponent(App);
