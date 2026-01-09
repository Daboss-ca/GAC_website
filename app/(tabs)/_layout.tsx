import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  useWindowDimensions, 
  ScrollView,
  LayoutAnimation,
  Platform 
} from "react-native";
import { Tabs, useRouter, usePathname } from "expo-router";
import { colors } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/constant/supabase";

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  
  const isMobile = width < 768;
  const isSmallPhone = width < 380; // Para sa mga extra small na screens

  const [showConfirm, setShowConfirm] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: "grid-outline", path: "/(tabs)" },
    { name: "Events", icon: "calendar-outline", path: "/(tabs)/events" },
    { name: "Announcements", icon: "megaphone-outline", path: "/(tabs)/announcements" },
    { name: "Song Lineups", icon: "musical-notes-outline", path: "/(tabs)/song-lineups" },
  ];

  const isMembersPage = pathname.includes("members");

  const navigateTo = (path: string) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    router.replace(path as any);
  };

  const processLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.mainWrapper}>
      <View style={[styles.mainWrapper, isMobile && { flexDirection: "column" }]}>
        
        {/* --- NAVIGATION BAR --- */}
        <View style={[styles.sidebar, isMobile && styles.topNav]}>
          
          <View style={[styles.logoSection, isMobile && { marginBottom: 0, marginRight: 10 }]}>
            {!isMobile && <Text style={styles.logoText}>Great Awakening</Text>}
          </View>

          <View style={[styles.navGroup, isMobile && styles.navGroupMobile]}>
            <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={false}>
              {isMembersPage && (
                <Pressable
                  onPress={() => navigateTo("/(tabs)")}
                  style={[styles.navItem, styles.backNavButton, isMobile && styles.mobileNavItem]}
                >
                  <Ionicons name="arrow-back-circle" size={isMobile ? 18 : 22} color="#fff" />
                  <Text style={[styles.navLabel, isMobile && styles.mobileNavLabel, { color: "#fff" }]}>Back</Text>
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
                    onPress={() => navigateTo(item.path)}
                    style={[
                      styles.navItem,
                      isMobile && styles.mobileNavItem,
                      isMobile && !isActive && styles.inactiveLift,
                      isActive && !isMembersPage && { backgroundColor: colors?.primary || "#4F46E5" }
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={isMobile ? (isSmallPhone ? 16 : 18) : 22} // Responsive icon size
                      color={isActive && !isMembersPage ? "#fff" : "#64748B"}
                    />
                    {(isActive || !isMobile) && (
                      <Text style={[
                        styles.navLabel, 
                        isMobile && styles.mobileNavLabel,
                        isActive && !isMembersPage && { color: "#fff" }
                      ]}>
                        {item.name}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* LOGOUT BUTTON - Responsiveized */}
          <Pressable 
            style={({ pressed }) => [
              styles.logoutBtn, 
              isMobile && styles.logoutBtnMobile,
              { backgroundColor: pressed ? "#FEE2E2" : "#FFF5F5" }
            ]} 
            onPress={() => setShowConfirm(true)}
          >
            <View style={[styles.logoutIconContainer, isMobile && { padding: 4 }]}>
              <Ionicons name="log-out-outline" size={isMobile ? 16 : 20} color="#dc2626" />
            </View>
            {!isMobile && <Text style={styles.logoutText}>Logout</Text>}
          </Pressable>
        </View>

        <View style={styles.contentContainer}>
          <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="events" />
            <Tabs.Screen name="announcements" />
            <Tabs.Screen name="song-lineups" />
            <Tabs.Screen name="members" /> 
          </Tabs>
        </View>
      </View>

      {/* CONFIRMATION OVERLAY */}
      {showConfirm && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <View style={styles.confirmCard}>
            <Ionicons name="alert-circle" size={isMobile ? 32 : 40} color="#dc2626" style={{ marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>Confirm Logout</Text>
            <Text style={styles.confirmSub}>Are you sure you want to sign out?</Text>
            <View style={styles.confirmRow}>
              <Pressable style={[styles.confirmBtn, { backgroundColor: "#dc2626" }]} onPress={processLogout}>
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: isMobile ? 12 : 14 }}>Logout</Text>
              </Pressable>
              <Pressable style={[styles.confirmBtn, { backgroundColor: "#E2E8F0" }]} onPress={() => setShowConfirm(false)}>
                <Text style={{ color: "#475569", fontWeight: "bold", fontSize: isMobile ? 12 : 14 }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  sidebar: { width: 260, backgroundColor: "#ffffff", borderRightWidth: 1, borderRightColor: "#E2E8F0", padding: 20, justifyContent: "space-between" },
  topNav: { width: "100%", flexDirection: "row", alignItems: "center", padding: 8, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  
  logoSection: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  logoText: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginLeft: 10 },
  
  navGroup: { flex: 1 },
  navGroupMobile: { flexDirection: 'row', alignItems: 'center' },
  
  navItem: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, marginBottom: 6 },
  mobileNavItem: { paddingVertical: 6, paddingHorizontal: 10, marginRight: 5 },
  
  // Animation effect
  inactiveLift: {
    transform: [{ translateY: -8 }],
    opacity: 0.5,
  },

  navLabel: { fontSize: 13, fontWeight: "600", color: "#64748B", marginLeft: 8 },
  mobileNavLabel: { fontSize: 11, marginLeft: 5 }, // Mas maliit na font sa mobile
  
  backNavButton: { backgroundColor: colors?.primary || "#4F46E5" },
  contentContainer: { flex: 1 },

  // LOGOUT UI
  logoutBtn: { flexDirection: "row", alignItems: "center", padding: 8, borderRadius: 10, borderWidth: 1, borderColor: "#FEE2E2", marginTop: 15 },
  logoutBtnMobile: { marginTop: 0, marginLeft: 8, paddingVertical: 4, paddingHorizontal: 8 },
  logoutIconContainer: { backgroundColor: "#fff", padding: 5, borderRadius: 6, justifyContent: "center", alignItems: "center", elevation: 1 },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 13, marginLeft: 10 },

  overlay: { backgroundColor: "rgba(15, 23, 42, 0.7)", justifyContent: "center", alignItems: "center", zIndex: 9999 },
  confirmCard: { width: '80%', maxWidth: 300, backgroundColor: "#fff", padding: 20, borderRadius: 18, alignItems: "center" },
  confirmTitle: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
  confirmSub: { fontSize: 13, color: "#64748B", textAlign: "center", marginVertical: 12 },
  confirmRow: { flexDirection: "row", gap: 8 },
  confirmBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, minWidth: 80, alignItems: "center" }
});