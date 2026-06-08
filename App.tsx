import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider } from "posthog-react-native";
import AppNavigation from "./src/navigation";
import { configureAPI } from './src/engine/api';
import { ENV } from './src/config/env';
import { useBindAnalytics } from "./src/services/analytics";
// Initialize Claude API on app load
if (ENV.ANTHROPIC_API_KEY) {
  configureAPI({ apiKey: ENV.ANTHROPIC_API_KEY });
}

/**
 * Binds the PostHog singleton from the provider context into our analytics
 * module so non-React call sites (engine helpers, store actions) can capture
 * events. Mounted inside <PostHogProvider> so `usePostHog()` resolves.
 *
 * Session replay is intentionally OFF (no `enableSessionReplay`, no
 * `posthog-react-native-session-replay` plugin installed). EU host. We
 * capture metadata only.
 */
function AnalyticsBootstrap() {
  useBindAnalytics();
  return null;
}

export default function App() {
  // If POSTHOG_KEY is missing (e.g. local dev without the secret), wrap with
  // an unconfigured provider — the analytics module's `_client` stays null and
  // every capture call short-circuits. No analytics, no crash.
  return (
    <PostHogProvider
      apiKey={ENV.POSTHOG_KEY}
      options={{ host: ENV.POSTHOG_HOST || "https://eu.i.posthog.com" }}
      // captureScreens:false — PostHogProvider mounts above NavigationContainer,
      // so the screen autocapture tracker (useNavigationTracker) calls
      // useNavigation/useNavigationState outside the container and throws
      // "Couldn't find a navigation object" (a caught console.error that
      // red-screens via LogBox in dev; silent in prod). $screen capture was
      // already non-functional, so disabling it loses nothing while keeping
      // touch + lifecycle autocapture. Must be explicitly false — {} or true
      // default captureScreens on (?? true) and re-throw.
      autocapture={{ captureScreens: false }}
    >
      <AnalyticsBootstrap />
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
        <AppNavigation />
      </SafeAreaProvider>
    </PostHogProvider>
  );
}
