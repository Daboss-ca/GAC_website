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

    if (!fullName || !email || !password || !confirmPassword || !ministry) {
      return setStatus({ message: "Please fill all fields", type: "error" });
    }

    if (password !== confirmPassword) {
      return setStatus({ message: "Passwords do not match", type: "error" });
    }

    setLoading(true);

    try {
      // 1️⃣ Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2️⃣ Database Insert (Public Schema)
        const { error: dbError } = await supabase.from("users").insert([
          { 
            id: authData.user.id, 
            email: email.trim().toLowerCase(), 
            full_name: fullName, 
            ministry 
          }
        ]);

        if (dbError) {
          // Kapag nag-error sa DB pero pasok na sa Auth, baka maging multo ang account.
          // Optional: handle it here.
          throw dbError;
        }

        // 3️⃣ IMPORTANT: Force Sign Out pagkatapos ng signup.
        // Dahil ang Expo/Web ay laging sinesave ang session agad,
        // kailangan natin itong linisin para hindi sila maging "locally logged in" 
        // hangga't hindi sila nag-ve-verify o nag-da-dashboard flow.
        await supabase.auth.signOut();

        setStatus({ 
          message: "Signup successful! Please check your email and verify your account before logging in.", 
          type: "success" 
        });

        // I-clear ang form
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setMinistry("");
        
        setTimeout(() => {
            router.push("/(auth)/login");
        }, 3500);
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
      <ScrollView contentContainerStyle={styles.screen}>
        <Stack.Screen options={{ title: "Sign Up", headerShown: false }} />

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Great Awakening Church</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={colors.muted}
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Pressable style={styles.dropdownHeader} onPress={toggleDropdown}>
            <Text style={ministry ? styles.dropdownTextSelected : styles.dropdownPlaceholder}>
              {ministry || "Select Ministry"}
            </Text>
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
            style={[styles.button, loading && { opacity: 0.7 }]}
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
              <Text style={[
                styles.statusText, 
                status.type === "error" ? styles.errorText : styles.successText
              ]}>
                {status.message}
              </Text>
            </View>
          ) : null}

          <Pressable onPress={() => router.push("/(auth)/login")} style={{ marginTop: 10 }}>
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
  screen: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#f5f5f5" },
  card: { width: "100%", maxWidth: 400, padding: 32, borderRadius: 20, backgroundColor: "#fff", elevation: 5 },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 24, textAlign: "center" },
  input: { backgroundColor: "#f9f9f9", padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e0e0e0" },
  dropdownHeader: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e0e0e0", backgroundColor: "#f9f9f9", marginBottom: 8 },
  dropdownPlaceholder: { color: colors.muted },
  dropdownTextSelected: { color: colors.text },
  dropdownContainer: { maxHeight: 150, marginBottom: 16, borderRadius: 12, backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#e0e0e0" },
  scrollDropdown: { padding: 8 },
  dropdownItem: { padding: 12, borderRadius: 10, marginBottom: 4 },
  dropdownItemSelected: { backgroundColor: colors.primary },
  dropdownText: { color: colors.text },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  statusContainer: { marginTop: 16, padding: 12, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 14, textAlign: "center", fontWeight: "500" },
  errorBg: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
  errorText: { color: "#dc2626" },
  successBg: { backgroundColor: "#dcfce7", borderColor: "#bbf7d0" },
  successText: { color: "#16a34a" },
  loginText: { textAlign: "center", color: colors.text, marginTop: 10 },
  loginLink: { color: colors.primary, fontWeight: "600" },
});