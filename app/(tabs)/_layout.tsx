import React from "react";
// Idinagdag ang Image component
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Tabs, useRouter, usePathname } from "expo-router";
import { colors } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/constant/supabase";

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", icon: "grid-outline", path: "/(tabs)" },
    { name: "Events", icon: "calendar-outline", path: "/(tabs)/events" },
    { name: "Announcements", icon: "megaphone-outline", path: "/(tabs)/announcements" },
    { name: "Song Lineups", icon: "musical-notes-outline", path: "/(tabs)/song-lineups" },
  ];

  const isMembersPage = pathname.includes("members");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.mainWrapper}>
      {/* --- SIDEBAR --- */}
      <View style={styles.sidebar}>
        <View>
          <View style={styles.logoSection}>
            {/* IN-UPDATE NA LOGO SECTION: Pinalitan ang Text ng Image */}
            <View style={styles.logoIconContainer}>
               <Image 
                source={require("@/.expo/web/cache/production/images/favicon/favicon-a4e030697a7571b3e95d31860e4da55d2f98e5e861e2b55e414f45a8556828ba-contain-transparent/favicon-48.png")} 
                style={styles.logoImage} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoText}>Great Awakening Church</Text>
          </View>

          <View style={styles.navGroup}>
            {isMembersPage && (
              <Pressable
                onPress={() => router.replace("/(tabs)")}
                style={[styles.navItem, styles.backNavButton]}
              >
                <Ionicons name="arrow-back-circle" size={24} color="#fff" />
                <Text style={[styles.navLabel, { color: "#fff", fontWeight: "700" }]}>
                  Back to Dashboard
                </Text>
              </Pressable>
            )}

            {navItems.map((item) => {
              const cleanPath = item.path.replace("/(tabs)", "") || "/";
              const cleanCurrentPath = pathname.replace("/(tabs)", "") || "/";
              const isActive = cleanCurrentPath === cleanPath;

              if (isMembersPage && item.name === "Dashboard") return null;

              return (
                <Pressable
                  key={item.name}
                  onPress={() => router.replace(item.path as any)}
                  style={[
                    styles.navItem,
                    isActive && !isMembersPage && { backgroundColor: colors?.primary || "#4F46E5" }
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={isActive && !isMembersPage ? "#fff" : "#64748B"}
                  />
                  <Text style={[styles.navLabel, isActive && !isMembersPage && { color: "#fff" }]}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* --- MAIN CONTENT ENGINE --- */}
      <View style={styles.contentContainer}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="events" />
          <Tabs.Screen name="announcements" />
          <Tabs.Screen name="song-lineups" />
          <Tabs.Screen name="members" /> 
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  sidebar: { width: 280, backgroundColor: "#ffffff", borderRightWidth: 1, borderRightColor: "#E2E8F0", padding: 24, justifyContent: "space-between", height: "100%" },
  logoSection: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  
  // New Logo Styles
  logoIconContainer: { marginRight: 12 },
  logoImage: { width: 40, height: 40 }, // Size base sa 48px standard but slightly adjusted
  
  logoText: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  navGroup: {},
  navItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 8 },
  backNavButton: { 
    backgroundColor: colors?.primary || "#4F46E5", 
    marginBottom: 20, 
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  navLabel: { fontSize: 15, fontWeight: "500", color: "#64748B", marginLeft: 12 },
  contentContainer: { flex: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 20 },
  logoutText: { color: "#dc2626", fontWeight: "600", fontSize: 15, marginLeft: 12 },
});