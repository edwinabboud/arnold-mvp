// =============================================================================
// Navigation — Auth + Onboarding + Main app with bottom tabs + Session modal
// =============================================================================

import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import { useStore } from "../store/useStore";
import { colors } from "../theme";
import { supabase } from "../config/supabase";
import { hydrateFromSupabase } from "../services/supabaseSync";
import type { Session } from "@supabase/supabase-js";

// Auth
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";

// Onboarding
import ConversationalOnboarding from "../screens/onboarding/ConversationalOnboarding";

// Main
import HomeScreen from "../screens/home/HomeScreen";
import SessionScreen from "../screens/session/SessionScreen";
import ProgressScreen from "../screens/progress/ProgressScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  animation: "slide_from_right" as const,
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: "rgba(255,255,255,0.04)",
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Train" }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: "Progress" }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Onboarding" component={ConversationalOnboarding} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Session"
        component={SessionScreen}
        options={{ animation: "slide_from_bottom", gestureEnabled: false }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 32, fontWeight: "900", color: colors.accent, letterSpacing: 6 }}>
        ARNOLD
      </Text>
    </View>
  );
}

export default function AppNavigation() {
  const onboardingComplete = useStore((s) => s.profile?.onboardingComplete ?? false);
  const storeProfile = useStore((s) => s.profile);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const hydrationAttempted = useRef(false);

  useEffect(() => {
    // Single source of truth: onAuthStateChange. It always fires once on
    // subscription with the INITIAL_SESSION event, AFTER Supabase's internal
    // AsyncStorage read completes. Calling getSession() directly races that
    // read on cold start and can return null even for signed-in users —
    // which was the cold-reopen sign-out bug.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthReady(true);
      // Reset hydration flag on sign-out so next sign-in re-hydrates
      if (!s) {
        hydrationAttempted.current = false;
      }
    });

    // Safety net: if onAuthStateChange somehow never fires (Supabase client
    // misconfigured, storage adapter broken, etc.), don't hang on LoadingScreen
    // forever. After 5s, treat auth as ready with whatever session we have
    // (probably null, which routes to AuthStack — recoverable by signing in).
    const timeoutId = setTimeout(() => {
      setAuthReady((ready: boolean) => {
        if (!ready) {
          console.warn("[ARNOLD] Auth readiness timeout — proceeding without onAuthStateChange");
        }
        return true;
      });
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Hydrate from Supabase when authenticated but local store is empty
  useEffect(() => {
    if (!session || storeProfile || hydrationAttempted.current) return;
    hydrationAttempted.current = true;

    setHydrating(true);
    hydrateFromSupabase()
      .then((data) => {
        if (data?.profile) {
          const store = useStore.getState();
          store.setProfile(data.profile);
          if (data.onboardingState) {
            store.setOnboardingState(data.onboardingState);
          }
          if (data.activeMesocycle) {
            store.setActiveMesocycle(data.activeMesocycle);
          }
          if (data.userProgressions.length > 0) {
            store.setUserProgressions(data.userProgressions);
          }
          if (data.streaks) {
            store.setStreaks(data.streaks);
          }
          if (data.sessionHistory.length > 0) {
            store.setSessionHistory(data.sessionHistory);
          }
          console.log("[ARNOLD] Hydration complete — data restored from Supabase");
        } else {
          console.log("[ARNOLD] Hydration complete — no remote data (new user)");
        }
      })
      .catch((e) => {
        console.warn("[ARNOLD] Hydration error:", e);
      })
      .finally(() => {
        setHydrating(false);
      });
  }, [session, storeProfile]);

  if (!authReady || hydrating) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {session === null ? (
        <AuthStack key="auth" />
      ) : onboardingComplete ? (
        <MainStack key="main" />
      ) : (
        <OnboardingStack key="onboarding" />
      )}
    </NavigationContainer>
  );
}
