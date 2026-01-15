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
import * as Linking from 'expo-linking';
// Ginamit ang Lucide Icons para consistent sa web at mobile
import { Mail, Lock, User, Users, ChevronDown, Check, Eye, EyeOff, AlertCircle } from "lucide-react-native";

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

  // Dinagdag ang Leaders sa listahan
  const ministries = ["Singer", "Musician", "Multimedia", "Backstage", "Ptr's", "LifeGroup Leader", "Ministry Leader"];

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

    if (!fullName || !email || !password || !confirmPassword || !ministry) {
      return setStatus({ message: "Please fill all fields", type: "error" });
    }

    if (password !== confirmPassword) {
      return setStatus({ message: "Passwords do not match", type: "error" });
    }

    setLoading(true);

    try {
      const redirectTo = Linking.createURL("/(auth)/login");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: { emailRedirectTo: redirectTo },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error("Email already registered. Please login instead.");
        }
        throw authError;
      }

      if (authData.user) {
        const { error: dbError } = await supabase.from("users").insert([
          { 
            id: authData.user.id, 
            email: email.trim().toLowerCase(), 
            full_name: fullName, 
            ministry 
          }
        ]);

        if (dbError) throw dbError;
        
        setStatus({ 
          message: "Account created! Check your email to confirm.", 
          type: "success" 
        });

        // Reset fields
        setFullName(""); setEmail(""); setPassword(""); setConfirmPassword(""); setMinistry("");
      }
    } catch (error: any) {
      setStatus({ message: error.message, type: "error" });
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

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <User size={18} color="#94a3b8" style={styles.leftIcon} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Full Name"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={18} color="#94a3b8" style={styles.leftIcon} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={18} color="#94a3b8" style={styles.leftIcon} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
            </Pressable>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Lock size={18} color="#94a3b8" style={styles.leftIcon} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Confirm Password"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Ministry Dropdown */}
          <Pressable style={styles.dropdownHeader} onPress={toggleDropdown}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Users size={18} color="#94a3b8" style={{ marginRight: 10 }} />
              <Text style={ministry ? styles.dropdownTextSelected : styles.dropdownPlaceholder}>
                {ministry || "Select Ministry / Role"}
              </Text>
            </View>
            <ChevronDown size={18} color="#64748B" />
          </Pressable>

          {dropdownOpen && (
            <View style={styles.dropdownWrapper}>
              <ScrollView style={styles.scrollDropdown} nestedScrollEnabled>
                {ministries.map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.dropdownItem, ministry === m && styles.dropdownItemSelected]}
                    onPress={() => selectMinistry(m)}
                  >
                    <Text style={[styles.dropdownText, ministry === m && { color: "#fff" }]}>{m}</Text>
                    {ministry === m && <Check size={14} color="#fff" />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.button, (loading || pressed) && { opacity: 0.8 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </Pressable>

          {status.message && (
            <View style={[styles.statusBox, status.type === "error" ? styles.errorBg : styles.successBg]}>
              {status.type === "error" ? <AlertCircle size={18} color="#dc2626" /> : <Check size={18} color="#16a34a" />}
              <Text style={[styles.statusText, status.type === "error" ? styles.errorText : styles.successText]}>
                {status.message}
              </Text>
            </View>
          )}

          <Pressable onPress={() => router.push("/(auth)/login")} style={{ marginTop: 20 }}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLink}>Login</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#f8f9fa" },
  card: { width: "100%", maxWidth: 400, padding: 24, borderRadius: 24, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  title: { fontSize: 24, fontWeight: "800", color: "#1E293B", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 24, textAlign: "center" },
  
  // Icon Inputs
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 14, paddingHorizontal: 12 },
  leftIcon: { marginRight: 10 },
  inputWithIcon: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#1e293b", ...Platform.select({ web: { outlineStyle: 'none' } }) } as any,

  // Dropdown
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc", marginBottom: 8 },
  dropdownPlaceholder: { color: "#94a3b8", fontSize: 15 },
  dropdownTextSelected: { color: "#1e293b", fontSize: 15 },
  dropdownWrapper: { maxHeight: 150, marginBottom: 16, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", overflow: 'hidden' },
  scrollDropdown: { padding: 4 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 2 },
  dropdownItemSelected: { backgroundColor: colors.primary },
  dropdownText: { color: "#475569", fontSize: 14, fontWeight: "600" },

  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  statusBox: { marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 13, flex: 1, fontWeight: "600" },
  errorBg: { backgroundColor: "#fef2f2", borderColor: "#fee2e2" },
  errorText: { color: "#dc2626" },
  successBg: { backgroundColor: "#f0fdf4", borderColor: "#dcfce7" },
  successText: { color: "#16a34a" },

  loginText: { textAlign: "center", color: "#64748B", fontSize: 14 },
  loginLink: { color: colors.primary, fontWeight: "700" },
});