// app/(auth)/signup.tsx
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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/constant/colors";

// Enable LayoutAnimation for Android
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
  const [dropdownOpen, setDropdownOpen] = useState(false); // <-- collapsible

  const ministries = ["Singer", "Musician", "Multimedia", "Backstage", "Ptr's"];

  const handleSignup = () => {
    if (!fullName || !email || !password || !confirmPassword || !ministry) {
      return alert("Please fill all fields");
    }
    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }
    router.replace("/(tabs)");
  };

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDropdownOpen(!dropdownOpen);
  };

  const selectMinistry = (m: string) => {
    setMinistry(m);
    toggleDropdown(); // close dropdown after selecting
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.screen}>
        <Stack.Screen options={{ title: "Sign Up" }} />

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up to join Great Awakening Church
          </Text>

          {/* Full Name */}
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={colors.muted}
            value={fullName}
            onChangeText={setFullName}
          />

          {/* Email */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password */}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Confirm Password */}
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Collapsible Dropdown */}
          <Pressable
            style={styles.dropdownHeader}
            onPress={toggleDropdown}
          >
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
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      ministry === m && styles.dropdownItemSelected,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => selectMinistry(m)}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        ministry === m && { color: "#fff", fontWeight: "600" },
                      ]}
                    >
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Sign Up Button */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleSignup}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>

          {/* Navigate to Login */}
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginLink}>Login</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    padding: 32,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 24, textAlign: "center" },
  input: { backgroundColor: "#f9f9f9", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e0e0e0" },
  dropdownHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
  },
  dropdownPlaceholder: { color: colors.muted },
  dropdownTextSelected: { color: colors.text },
  dropdownContainer: {
    maxHeight: 150, // scrollable height
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  scrollDropdown: { flex: 1, paddingHorizontal: 8 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4, backgroundColor: "#f9f9f9" },
  dropdownItemSelected: { backgroundColor: colors.primary },
  dropdownText: { color: colors.text },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 16, transitionDuration: "150ms" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  loginText: { textAlign: "center", color: colors.text },
  loginLink: { color: colors.primary, fontWeight: "600" },
});
