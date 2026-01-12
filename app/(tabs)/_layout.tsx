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
import { supabase } from "@/constant/supabase";

// --- IMPORT LUCIDE ICONS ---
import { 
  LayoutGrid, 
  Calendar, 
  Megaphone, 
  Music, 
  LogOut, 
  ArrowLeftCircle, 
  AlertCircle,
  Users,
  UserCircle // Idinagdag para sa Profile
} from 'lucide-react-native';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  
  const [showConfirm, setShowConfirm] = useState(false);

  const isMobile = width < 768;
  const isSmallPhone = width < 380;

  // --- UPDATED NAV ITEMS (Kasama na ang Profile) ---
  const navItems = [
    { name: "Dashboard", icon: LayoutGrid, path: "/(tabs)" },
    { name: "Events", icon: Calendar, path: "/(tabs)/events" },
    { name: "Announcements", icon: Megaphone, path: "/(tabs)/announcements" },
    { name: "Song Lineups", icon: Music, path: "/(tabs)/song-lineups" },
    { name: "Team", icon: Users, path: "/(tabs)/members" }, 
    { name: "Profile", icon: UserCircle, path: "/(tabs)/profile" }, // BAGONG ITEM
  ];

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
            {!isMobile && (
              <View>
                <Text style={styles.logoText}>Great Awakening</Text>
                <Text style={styles.logoSub}>Love God&Love people</Text>
              </View>
            )}
          </View>

          <View style={[styles.navGroup, isMobile && styles.navGroupMobile]}>
            <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={false}>
              {navItems.map((item) => {
                const cleanPath = item.path.replace("/(tabs)", "") || "/";
                const cleanCurrentPath = pathname.replace("/(tabs)", "") || "/";
                const isActive = cleanCurrentPath === cleanPath;

                return (
                  <Pressable
                    key={item.name}
                    onPress={() => navigateTo(item.path)}
                    style={[
                      styles.navItem,
                      isMobile && styles.mobileNavItem,
                      isActive && { backgroundColor: "#0F172A" } 
                    ]}
                  >
                    <item.icon 
                      size={isMobile ? (isSmallPhone ? 14 : 16) : 20} 
                      color={isActive ? "#fff" : "#94A3B8"} 
                      strokeWidth={2.5}
                    />
                    
                    <Text style={[
                      styles.navLabel, 
                      isMobile && styles.mobileNavLabel,
                      isActive && { color: "#fff", fontWeight: '800' }
                    ]}>
                      {item.name.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.logoutBtn, 
              isMobile && styles.logoutBtnMobile,
              { backgroundColor: pressed ? "#F8FAFC" : "#fff" }
            ]} 
            onPress={() => setShowConfirm(true)}
          >
            <LogOut size={isMobile ? 16 : 18} color="#dc2626" />
            {!isMobile && <Text style={styles.logoutText}>Sign Out</Text>}
          </Pressable>
        </View>

        {/* --- CONTENT AREA --- */}
        <View style={styles.contentContainer}>
          <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="events" />
            <Tabs.Screen name="announcements" />
            <Tabs.Screen name="song-lineups" />
            <Tabs.Screen name="members" /> 
            <Tabs.Screen name="profile" /> {/* IDINAGDAG NA SCREEN */}
          </Tabs>
        </View>
      </View>

      {/* --- CONFIRMATION OVERLAY --- */}
      {showConfirm && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <View style={styles.confirmCard}>
            <AlertCircle size={40} color="#0F172A" />
            <Text style={styles.confirmTitle}>Confirm Sign Out</Text>
            <Text style={styles.confirmSub}>Are you sure you want to end your session?</Text>
            <View style={styles.confirmRow}>
              <Pressable style={[styles.confirmBtn, { backgroundColor: "#0F172A" }]} onPress={processLogout}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>YES, LOGOUT</Text>
              </Pressable>
              <Pressable style={[styles.confirmBtn, { backgroundColor: "#F1F5F9" }]} onPress={() => setShowConfirm(false)}>
                <Text style={{ color: "#475569", fontWeight: "800", fontSize: 12 }}>CANCEL</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#FFFFFF" },
  sidebar: { 
    width: 240, 
    backgroundColor: "#ffffff", 
    borderRightWidth: 1, 
    borderRightColor: "#F1F5F9", 
    padding: 24, 
    justifyContent: "space-between" 
  },
  topNav: { 
    width: "100%", 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: "#F1F5F9" 
  },
  logoSection: { marginBottom: 40 },
  logoText: { fontSize: 18, fontWeight: "900", color: "#0F172A", letterSpacing: -0.5 },
  logoSub: { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 2, marginTop: -2 },
  
  navGroup: { flex: 1 },
  navGroupMobile: { flexDirection: 'row', alignItems: 'center' },
  navItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    marginBottom: 4 
  },
  mobileNavItem: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  navLabel: { fontSize: 11, fontWeight: "700", color: "#64748B", marginLeft: 12, letterSpacing: 0.5 },
  mobileNavLabel: { fontSize: 10, marginLeft: 6 },
  
  contentContainer: { flex: 1 },
  logoutBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: "#F1F5F9" 
  },
  logoutBtnMobile: { marginLeft: 'auto', paddingVertical: 8 },
  logoutText: { color: "#dc2626", fontWeight: "800", fontSize: 11, marginLeft: 10, letterSpacing: 0.5 },
  
  overlay: { backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "center", alignItems: "center", zIndex: 9999 },
  confirmCard: { width: 280, backgroundColor: "#fff", padding: 30, borderRadius: 4, alignItems: "center", borderWidth: 1, borderColor: '#E2E8F0' },
  confirmTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginTop: 15 },
  confirmSub: { fontSize: 13, color: "#64748B", textAlign: "center", marginVertical: 15, lineHeight: 20 },
  confirmRow: { flexDirection: "column", gap: 10, width: '100%' },
  confirmBtn: { paddingVertical: 12, borderRadius: 4, alignItems: "center", width: '100%' }
});