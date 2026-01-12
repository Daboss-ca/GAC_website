import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://wdsnvjokapzoldbmkyol.supabase.co';
const supabaseAnonKey = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkc252am9rYXB6b2xkYm1reW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjQ5NTMsImV4cCI6MjA4MzUwMDk1M30.M84vCeOGnO_ISwTT4y5yvGboXevfzfDLAZ1w1STGTGo';

// Gagawa tayo ng condition: 
// Kung Web, gagamit tayo ng standard browser storage.
// Kung Mobile, gagamit tayo ng AsyncStorage.
const isWeb = Platform.OS === 'web';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Sa Web, hindi na kailangan i-import ang AsyncStorage
    // Kusa na itong gagamit ng localStorage/cookies
    ...(isWeb ? {} : {
      storage: require('@react-native-async-storage/async-storage').default,
    }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // Importante para sa Web auth redirects
  },
});