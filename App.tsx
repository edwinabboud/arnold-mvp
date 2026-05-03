import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigation from "./src/navigation";
import { configureAPI } from './src/engine/api';
import { ENV } from './src/config/env';
// Initialize Claude API on app load
if (ENV.ANTHROPIC_API_KEY) {
  configureAPI({ apiKey: ENV.ANTHROPIC_API_KEY });
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
      <AppNavigation />
    </SafeAreaProvider>
  );
}
