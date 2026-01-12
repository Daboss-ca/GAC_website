import { Slot } from "expo-router";
import { SafeAreaView, StyleSheet, StatusBar, Platform, View } from "react-native";
import Head from "expo-router/head";

export default function RootLayout() {
  return (
    // Ginawa nating View ang main wrapper para sa Web/Desktop consistency
    <View style={styles.wrapper}>
      <Head>
        <title>Great Awakening Church</title>
        <meta name="description" content="Admin Dashboard" />
      </Head>

      {/* StatusBar setup para sa lahat ng Mobile platforms */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.container}>
        <Slot />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Match sa screens na ginawa natin
  },
  container: {
    flex: 1,
    // Inaayos ang padding para sa Android notch pero hindi double-spacing sa iOS/Web
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});