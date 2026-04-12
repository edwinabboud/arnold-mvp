require("dotenv").config();

export default {
  expo: {
    name: "Arnold",
    slug: "arnold",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      backgroundColor: "#0A0A0B"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.arnold.coach"
    },
    android: {
      package: "com.arnold.coach",
      adaptiveIcon: {
        backgroundColor: "#0A0A0B"
      }
    },
    extra: {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};