import { registerRootComponent } from "expo";
import React from "react";
import { ScrollView, Text } from "react-native";

// The app's real modules are loaded inside a try/catch so that an error
// thrown while a module initializes (e.g. a native module missing from the
// build) renders a readable error screen instead of closing the app before
// the first frame. Importing backgroundTask runs TaskManager.defineTask at
// the global scope, which is required for the background location task to
// be invokable by the OS even when the app's UI isn't mounted.
let Root: React.ComponentType;
try {
  require("./src/location/backgroundTask");
  Root = require("./App").default;
} catch (e) {
  const err = e as Error | undefined;
  const detail = `${err?.name ?? "Error"}: ${err?.message ?? String(e)}\n\n${err?.stack ?? ""}`;
  Root = function BootError() {
    return React.createElement(
      ScrollView,
      {
        style: { flex: 1, backgroundColor: "#0a0e16" },
        contentContainerStyle: { padding: 24, paddingTop: 64 },
      },
      React.createElement(
        Text,
        { selectable: true, style: { color: "#ff6b6b" } },
        "UniBus Driver failed to start. Screenshot this screen:\n\n" + detail,
      ),
    );
  };
}

registerRootComponent(Root);
