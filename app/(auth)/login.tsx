import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  ScrollView 
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "error" | "success" | null }>({
    message: "",
    type: null,
  });

  // 1️⃣ AUTO-LOGOUT FIX: Sa tuwing pupunta sila sa Login screen, 
  // sisiguraduhin nating malinis ang session para iwas sa "locally stored" problem.
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  const handleLogin = async () => {
    setStatus({ message: "", type: null });

    if (!email || !password) {
      return setStatus({ message: "Please enter both email and password", type: "error" });
    }

    setLoading(true);

    try {
      // 2️⃣ Auth Login
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password: password 
      });

      if (error) throw error;

      if (data?.session) {
        // 3️⃣ Verify if User actually exists in our 'users' table
        // Ito ang solusyon para kung binura mo sila sa DB, hindi sila makaka-login 
        // kahit buhay pa ang account nila sa Auth list.
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user?.id)
          .single();

        if (userError || !userData) {
          // Kung wala sa database table, i-logout natin agad sila
          await supabase.auth.signOut();
          throw new Error("Invalid account.");
        }

        setStatus({ 
          message: `Welcome back, ${userData?.full_name || 'User'}! Redirecting...`, 
          type: "success" 
        });

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      }
    } catch (error: any) {
      setStatus({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <Stack.Screen options={{ title: "Login", headerShown: false }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              loading && { opacity: 0.7 },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>

          {status.message ? (
            <View style={[
              styles.statusContainer, 
              status.type === "error" ? styles.errorBg : styles.successBg
            ]}>
              <Text style={[
                styles.statusText, 
                status.type === "error" ? styles.errorText : styles.successText
              ]}>
                {status.message}
              </Text>
            </View>
          ) : null}

          <Pressable onPress={() => router.push("/(auth)/signup")} style={{ marginTop: 20 }}>
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ... (KEEP YOUR STYLES UNCHANGED)
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  card: { width: "100%", maxWidth: 400, padding: 32, borderRadius: 20, backgroundColor: "#fff", elevation: 5, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 24, textAlign: "center" },
  input: { backgroundColor: "#f9f9f9", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e0e0e0" },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  statusContainer: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 14, textAlign: "center", fontWeight: "500" },
  errorBg: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
  errorText: { color: "#dc2626" },
  successBg: { backgroundColor: "#dcfce7", borderColor: "#bbf7d0" },
  successText: { color: "#16a34a" },
  signupText: { textAlign: "center", color: colors.text },
  signupLink: { color: colors.primary, fontWeight: "600" },
});