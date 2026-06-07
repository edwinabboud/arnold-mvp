import Constants from 'expo-constants';

export const ENV = {
  ANTHROPIC_API_KEY: Constants.expoConfig?.extra?.anthropicApiKey || '',
  SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl || '',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey || '',
  POSTHOG_KEY: Constants.expoConfig?.extra?.posthogKey || '',
  POSTHOG_HOST: Constants.expoConfig?.extra?.posthogHost || '',
};