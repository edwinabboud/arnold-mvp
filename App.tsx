import React from "react";
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider } from "posthog-react-native";
import AppNavigation from "./src/navigation";
import { configureAPI } from './src/engine/api';
import { ENV } from './src/config/env';
import { useBindAnalytics, captureAppError } from "./src/services/analytics";
import { colors } from "./src/theme";
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

/**
 * Minimal Arnold-styled recovery screen shown when the root ErrorBoundary
 * catches a render error. Deliberately depends on nothing but theme colors so
 * it can render even when the app tree it replaced is broken. "Tap to restart"
 * re-mounts the child tree (soft restart) rather than reloading the process.
 */
function RecoveryScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <View style={styles.recoveryRoot}>
      <Text style={styles.recoveryTitle}>Something broke</Text>
      <TouchableOpacity style={styles.recoveryButton} onPress={onRestart} accessibilityRole="button">
        <Text style={styles.recoveryButtonText}>Tap to restart</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Root React ErrorBoundary. On catch it renders RecoveryScreen and fires the
 * categorical `app_error` analytics event with the offending component name
 * only — no message, stack text, or PII (per src/services/analytics.ts). Placed
 * inside PostHogProvider + after AnalyticsBootstrap so `_client` is bound when
 * componentDidCatch runs.
 */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, info: React.ErrorInfo): void {
    // Extract ONLY the top component name from the React component stack —
    // a bounded identifier, never free text. Stack lines look like "    in Foo".
    const firstFrame = (info?.componentStack ?? "").trim().split("\n")[0] ?? "";
    const match = firstFrame.match(/in ([A-Za-z0-9_]+)/);
    captureAppError({ component: match ? match[1] : "unknown" });
  }

  handleRestart = (): void => this.setState({ hasError: false });

  render(): React.ReactNode {
    if (this.state.hasError) return <RecoveryScreen onRestart={this.handleRestart} />;
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  recoveryRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: 32,
  },
  recoveryTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
  },
  recoveryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  recoveryButtonText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: "700",
  },
});

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
      <RootErrorBoundary>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
          <AppNavigation />
        </SafeAreaProvider>
      </RootErrorBoundary>
    </PostHogProvider>
  );
}
