import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constant/colors";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.welcome}>Welcome to Great Awakening Church!</Text>
      <Text style={styles.subtitle}>Choose a section to explore:</Text>

      <View style={styles.cardsContainer}>
        {/* Events */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push("/(tabs)/events")}
        >
          <Text style={styles.cardText}>Events</Text>
        </Pressable>

        {/* Announcements */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push("/(tabs)/announcements")}
        >
          <Text style={styles.cardText}>Announcements</Text>
        </Pressable>

        {/* Song Lineups */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push("/(tabs)/song-lineups")}
        >
          <Text style={styles.cardText}>Song Lineups</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 24,
  },
  cardsContainer: {
    flexDirection: "column",
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: colors.primary,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
});
