import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from 'expo-linking';

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ministry, setMinistry] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [status, setStatus] = useState<{ message: string; type: "error" | "success" | null }>({
    message: "",
    type: null,
  });

  const ministries = ["Singer", "Musician", "Multimedia", "Backstage", "Ptr's"];

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDropdownOpen(!dropdownOpen);
  };

  const selectMinistry = (m: string) => {
    setMinistry(m);
    toggleDropdown();
  };

  const handleSignup = async () => {
    setStatus({ message: "", type: null });

    // Basic Validation
    if (!fullName || !email || !password || !confirmPassword || !ministry) {
      return setStatus({ message: "Please fill all fields", type: "error" });
    }

    if (password !== confirmPassword) {
      return setStatus({ message: "Passwords do not match", type: "error" });
    }

    setLoading(true);

    try {
      const redirectTo = Linking.createURL("/(auth)/login");

      // 1. SUPABASE AUTH SIGNUP
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      // Catching Auth Errors (Example: User already exists but not confirmed)
      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error("This email is already registered. Please login instead.");
        }
        throw authError;
      }

      if (authData.user) {
        // 2. INSERT TO PUBLIC USERS TABLE
        const { error: dbError } = await supabase.from("users").insert([
          { 
            id: authData.user.id, 
            email: email.trim().toLowerCase(), 
            full_name: fullName, 
            ministry 
          }
        ]);

        if (dbError) {
          // HANDLE 409 CONFLICT (Duplicate Key/Email)
          if (dbError.code === "23505") { 
            throw new Error("Email already exists in our records.");
          }
          throw dbError;
        }
        
        setStatus({ 
          message: "Account created! Please check your email to confirm your signup.", 
          type: "success" 
        });

        // Optional: Clear fields on success
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setMinistry("");
      }
    } catch (error: any) {
      // Map technical errors to user-friendly messages
      let friendlyMessage = error.message;
      
      if (error.message.includes("network") || error.status === 0) {
        friendlyMessage = "Connection error. Please check your internet.";
      }

      setStatus({ 
        message: friendlyMessage, 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ title: "Sign Up", headerShown: false }} />

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Great Awakening Church</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#94a3b8"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#64748B" 
              />
            </Pressable>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
              placeholder="Confirm Password"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#64748B" 
              />
            </Pressable>
          </View>

          <Pressable style={styles.dropdownHeader} onPress={toggleDropdown}>
            <Text style={ministry ? styles.dropdownTextSelected : styles.dropdownPlaceholder}>
              {ministry || "Select Ministry"}
            </Text>
            <Ionicons name={dropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
          </Pressable>

          {dropdownOpen && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.scrollDropdown} nestedScrollEnabled>
                {ministries.map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.dropdownItem, ministry === m && styles.dropdownItemSelected]}
                    onPress={() => selectMinistry(m)}
                  >
                    <Text style={[styles.dropdownText, ministry === m && { color: "#fff" }]}>
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button, 
              (loading || pressed) && { opacity: 0.8 }
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </Pressable>

          {status.message ? (
            <View style={[
                styles.statusContainer, 
                status.type === "error" ? styles.errorBg : styles.successBg
            ]}>
              <Ionicons 
                name={status.type === "error" ? "alert-circle" : "checkmark-circle"} 
                size={18} 
                color={status.type === "error" ? "#dc2626" : "#16a34a"} 
                style={{marginRight: 8}}
              />
              <Text style={[
                styles.statusText, 
                status.type === "error" ? styles.errorText : styles.successText
              ]}>
                {status.message}
              </Text>
            </View>
          ) : null}

          <Pressable onPress={() => router.push("/(auth)/login")} style={{ marginTop: 20 }}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Login</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#f8f9fa" },
  card: { width: "100%", maxWidth: 400, padding: 24, borderRadius: 24, backgroundColor: "#fff", elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: {width: 0, height: 4} },
  title: { fontSize: 24, fontWeight: "800", color: "#1E293B", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 24, textAlign: "center" },
  input: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 12, fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: "#e2e8f0", color: "#1e293b" },
  
  passwordContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#f8fafc", 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#e2e8f0", 
    marginBottom: 14,
    paddingRight: 12 
  },
  eyeIcon: { padding: 4 },

  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc", marginBottom: 8 },
  dropdownPlaceholder: { color: "#94a3b8", fontSize: 15 },
  dropdownTextSelected: { color: "#1e293b", fontSize: 15 },
  dropdownContainer: { maxHeight: 150, marginBottom: 16, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", overflow: 'hidden' },
  scrollDropdown: { padding: 4 },
  dropdownItem: { padding: 10, borderRadius: 8, marginBottom: 2 },
  dropdownItemSelected: { backgroundColor: colors.primary },
  dropdownText: { color: "#475569", fontSize: 14 },

  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: "center", marginTop: 10, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: {width: 0, height: 4} },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  statusContainer: { marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 13, flex: 1, fontWeight: "600" },
  errorBg: { backgroundColor: "#fef2f2", borderColor: "#fee2e2" },
  errorText: { color: "#dc2626" },
  successBg: { backgroundColor: "#f0fdf4", borderColor: "#dcfce7" },
  successText: { color: "#16a34a" },

  loginText: { textAlign: "center", color: "#64748B", fontSize: 14 },
  loginLink: { color: colors.primary, fontWeight: "700" },
});