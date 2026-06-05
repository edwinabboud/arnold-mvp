import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import AppNavigation from "./src/navigation";
import { configureAPI } from './src/engine/api';
import { ENV } from './src/config/env';
// Initialize Claude API on app load
if (ENV.ANTHROPIC_API_KEY) {
  configureAPI({ apiKey: ENV.ANTHROPIC_API_KEY });
}

export default function App() {
  // KeyboardProvider must sit at the root so the native module can track
  // the keyboard frame for any descendant. It wraps SafeAreaProvider rather
  // than being wrapped by it — the keyboard module hooks the window
  // independent of safe-area context.
  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
        <AppNavigation />
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
