import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  useWindowDimensions, 
  LayoutAnimation,
  Platform,
  Modal,
  SafeAreaView
} from "react-native";
import { Tabs, useRouter, usePathname } from "expo-router";
import { supabase } from "@/constant/supabase";

// --- ICONS ---
import { 
  LayoutGrid, 
  Calendar, 
  Megaphone, 
  Music, 
  LogOut, 
  AlertCircle,
  Users,
  UserCircle,
  Menu,
  X 
} from 'lucide-react-native';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isMobile = width < 768;

  const navItems = [
    { name: "Home", icon: LayoutGrid, path: "/(tabs)" },
    { name: "Events", icon: Calendar, path: "/(tabs)/events" },
    { name: "Announcements", icon: Megaphone, path: "/(tabs)/announcements" },
    { name: "Song Lineups", icon: Music, path: "/(tabs)/song-lineups" },
    { name: "Team", icon: Users, path: "/(tabs)/members" }, 
    { name: "Profile", icon: UserCircle, path: "/(tabs)/profile" },
  ];

  const navigateTo = (path: string) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsSidebarOpen(false);
    router.replace(path as any);
  };

  const processLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  const NavContent = () => (
    <View style={styles.sidebarInner}>
      <View>
        <View style={styles.logoSection}>
          <View style={{ flex: 1, paddingRight: 10 }}>
             <Text style={styles.logoText} numberOfLines={2}>
               GREAT AWAKENING CHURCH
             </Text>
             <Text style={styles.logoSub}>LOVE GOD & PEOPLE</Text>
          </View>
          
          {isMobile && (
            <Pressable 
              onPress={() => setIsSidebarOpen(false)} 
              style={styles.closeBtn}
            >
              <X size={24} color="#0F172A" />
            </Pressable>
          )}
        </View>

        <View style={styles.navGroup}>
          {navItems.map((item) => {
            const cleanPath = item.path.replace("/(tabs)", "") || "/";
            const cleanCurrentPath = pathname.replace("/(tabs)", "") || "/";
            const isActive = cleanCurrentPath === cleanPath;

            return (
              <Pressable
                key={item.name}
                onPress={() => navigateTo(item.path)}
                style={[styles.navItem, isActive && { backgroundColor: "#0F172A" }]}
              >
                <item.icon size={18} color={isActive ? "#fff" : "#94A3B8"} strokeWidth={2.5} />
                <Text style={[styles.navLabel, isActive && { color: "#fff", fontWeight: '800' }]}>
                  {item.name.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable 
        style={styles.logoutBtn} 
        onPress={() => {
          setIsSidebarOpen(false);
          setShowConfirm(true);
        }}
      >
        <LogOut size={16} color="#dc2626" />
        <Text style={styles.logoutText}>SIGN OUT</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.mainWrapper}>
      <View style={[styles.layoutContainer, isMobile && { flexDirection: 'column' }]}>
        
        {/* DESKTOP SIDEBAR */}
        {!isMobile && (
          <View style={styles.desktopSidebar}>
            <NavContent />
          </View>
        )}

        {/* MOBILE HEADER */}
        {isMobile && (
          <View style={styles.mobileHeader}>
            <Pressable onPress={() => setIsSidebarOpen(true)} style={styles.burgerBtn}>
              <Menu size={26} color="#0F172A" />
            </Pressable>
            <Text style={styles.mobileLogoText}>GAC</Text>
          </View>
        )}

        {/* CONTENT */}
        <View style={styles.contentArea}>
          <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="events" />
            <Tabs.Screen name="announcements" />
            <Tabs.Screen name="song-lineups" />
            <Tabs.Screen name="members" /> 
            <Tabs.Screen name="profile" />
          </Tabs>
        </View>
      </View>

      {/* MOBILE DRAWER */}
      <Modal transparent visible={isSidebarOpen && isMobile} animationType="none">
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContent}>
            <NavContent />
          </View>
          <Pressable style={styles.drawerBackdrop} onPress={() => setIsSidebarOpen(false)} />
        </View>
      </Modal>

      {/* LOGOUT MODAL */}
      <Modal transparent visible={showConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <AlertCircle size={40} color="#0F172A" />
            <Text style={styles.confirmTitle}>Sign Out</Text>
            <Text style={styles.confirmSub}>End your session now?</Text>
            <div style={styles.confirmRow as any}>
              <Pressable style={[styles.confirmBtn, { backgroundColor: "#0F172A" }]} onPress={processLogout}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>LOGOUT</Text>
              </Pressable>
              <Pressable style={[styles.confirmBtn, { backgroundColor: "#F1F5F9" }]} onPress={() => setShowConfirm(false)}>
                <Text style={{ color: "#475569", fontWeight: "800", fontSize: 12 }}>CANCEL</Text>
              </Pressable>
            </div>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#FFFFFF" },
  layoutContainer: { flex: 1, flexDirection: 'row' },
  desktopSidebar: { width: 260, height: '100%', backgroundColor: "#ffffff", borderRightWidth: 1, borderRightColor: "#F1F5F9" },
  contentArea: { flex: 1 },

  mobileHeader: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#fff' },
  burgerBtn: { padding: 5 },
  mobileLogoText: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginLeft: 15 },

  sidebarInner: { flex: 1, padding: 25, justifyContent: "space-between" },
  
  logoSection: { 
    marginBottom: 40, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', // Mahalaga para sa multi-line text
  },
  logoText: { 
    fontSize: 14, // Fixed size para sa mobile responsiveness
    fontWeight: "900", 
    color: "#0F172A", 
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  logoSub: { fontSize: 9, fontWeight: "700", color: "#94A3B8", letterSpacing: 1, marginTop: 4 },
  
  navGroup: { gap: 5 },
  navItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12 },
  navLabel: { fontSize: 11, fontWeight: "700", color: "#64748B", marginLeft: 12, letterSpacing: 0.5 },
  
  logoutBtn: { flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 12, backgroundColor: "#FEF2F2" },
  logoutText: { color: "#dc2626", fontWeight: "800", fontSize: 11, marginLeft: 10 },
  
  // Close Button positioning
  closeBtn: { 
    padding: 5,
    marginTop: -5, // Pantay sa unang linya ng text
  },

  drawerOverlay: { flex: 1, flexDirection: 'row' },
  drawerContent: { width: 280, height: '100%', backgroundColor: '#fff' },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", alignItems: "center" },
  confirmCard: { width: 280, backgroundColor: "#fff", padding: 25, borderRadius: 24, alignItems: "center" },
  confirmTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginTop: 10 },
  confirmSub: { fontSize: 13, color: "#64748B", marginVertical: 15, textAlign: 'center' },
  confirmRow: { gap: 10, width: '100%' },
  confirmBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center", width: '100%' }
});