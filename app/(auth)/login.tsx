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
  ScrollView,
  useWindowDimensions // Import para sa responsiveness
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  
  // Responsive Breakpoints
  const isMobile = width < 768;
  const cardWidth = isMobile ? "100%" : 450; // Mas malapad ng konti sa desktop para maganda tignan

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "error" | "success" | null }>({
    message: "",
    type: null,
  });

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
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password: password 
      });
      if (error) throw error;
      if (data?.session) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user?.id)
          .single();

        if (userError || !userData) {
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
      
      <ScrollView 
        contentContainerStyle={[
            styles.scrollContent, 
            { paddingVertical: isMobile ? 20 : 50 } // Mas malaking padding sa desktop
        ]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { width: cardWidth }]}>
          <Text style={[styles.title, isMobile && { fontSize: 24 }]}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons 
                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                        size={22} 
                        color={colors.muted} 
                    />
                </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              loading && { opacity: 0.7 },
              pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
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

          <View style={styles.footer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push("/(auth)/signup")}>
                <Text style={styles.signupLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: "#F8FAFC" // Soft grayish blue background
  },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 16 
  },
  card: { 
    backgroundColor: "#fff", 
    padding: Platform.OS === 'web' ? 40 : 25, 
    borderRadius: 24, 
    // Shadow for Desktop
    ...Platform.select({
        web: {
            boxShadow: "0px 10px 25px rgba(0,0,0,0.05)",
        },
        android: { elevation: 4 },
        ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
        }
    })
  },
  title: { 
    fontSize: 30, 
    fontWeight: "800", 
    color: "#0F172A", 
    marginBottom: 8, 
    textAlign: "center" 
  },
  subtitle: { 
    fontSize: 16, 
    color: "#64748B", 
    marginBottom: 32, 
    textAlign: "center" 
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: { 
    backgroundColor: "#F1F5F9", 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    borderRadius: 14, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: "#E2E8F0",
    color: "#0F172A"
  },
  passwordContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#F1F5F9", 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: "#E2E8F0", 
    paddingRight: 10 
  },
  eyeIcon: { padding: 10 },
  button: { 
    backgroundColor: colors.primary, 
    paddingVertical: 18, 
    borderRadius: 14, 
    justifyContent: "center", 
    alignItems: "center", 
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  statusContainer: { marginTop: 20, padding: 14, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 14, textAlign: "center", fontWeight: "600" },
  errorBg: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
  errorText: { color: "#DC2626" },
  successBg: { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" },
  successText: { color: "#16A34A" },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 25 
  },
  signupText: { color: "#64748B", fontSize: 15 },
  signupLink: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});