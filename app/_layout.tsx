// app/_layout.tsx
import { Slot } from "expo-router";
import { SafeAreaView, StyleSheet, StatusBar, Platform } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Adjust sa StatusBar para sa Android */}
      {Platform.OS === "android" && <StatusBar barStyle="dark-content" />}
      
      {/* Slot renders all child routes */}
      <Slot />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
