// =============================================================================
// LoginScreen — Email/password sign in
// =============================================================================

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../config/supabase";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState(__DEV__ ? "edwinabboudblanco@gmail.com" : "");
  const [password, setPassword] = useState(__DEV__ ? "helloworld" : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Auto-login in dev mode
  useEffect(() => {
    if (__DEV__ && email && password) {
      handleSignIn();
    }
  }, []);

  const handleSignIn = async () => {
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Text style={styles.title}>ARNOLD</Text>
          <Text style={styles.subtitle}>Your AI Calisthenics Coach</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextInput
            style={[styles.input, passwordFocused && styles.inputFocused]}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            secureTextEntry
            textContentType="password"
          />

          <View style={styles.buttonArea}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {error !== "" && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.linkAction}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0B" },
  inner: { flex: 1 },
  header: { paddingTop: "30%", alignItems: "center", marginBottom: 48 },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#F5A623",
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginTop: 8,
  },
  form: { paddingHorizontal: 24 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  inputFocused: { borderColor: "#F5A623" },
  buttonArea: { marginTop: 8 },
  button: {
    backgroundColor: "#F5A623",
    borderRadius: 12,
    padding: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#0A0A0B", fontSize: 18, fontWeight: "800" },
  errorText: { color: "#E63946", fontSize: 13, marginTop: 8, textAlign: "center" },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  linkText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  linkAction: { color: "#F5A623", fontSize: 14, fontWeight: "600" },
});
