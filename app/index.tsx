// app/index.tsx
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Delay execution until component is mounted
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      // Redirect sa Login screen safely
      router.replace("/(auth)/login");
    }
  }, [ready]);

  // Optional: loading indicator habang nagre-redirect
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
