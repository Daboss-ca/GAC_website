import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Pressable,
  useWindowDimensions 
} from "react-native";
import { supabase } from "@/constant/supabase";
import { colors } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

export default function MembersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [])
  );

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("full_name, ministry, email")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, isMobile && { padding: 20 }]}>
        
        {/* HEADER SECTION */}
        <View style={[styles.topActions, isMobile && { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }]}>
          <Pressable 
            onPress={() => router.replace("/(tabs)")} 
            style={styles.inlineBackButton}
          >
            <Ionicons name="arrow-back" size={18} color={colors.primary} />
            <Text style={styles.inlineBackText}>Dashboard</Text>
          </Pressable>

          <View style={styles.totalBadge}>
            <Ionicons name="people" size={18} color={colors.primary} />
            <Text style={styles.totalText}>{members.length} Members</Text>
          </View>
        </View>

        <View style={styles.headerTitleSection}>
          <Text style={[styles.welcome, isMobile && { fontSize: 28 }]}>Church Members</Text>
          <Text style={styles.subtitle}>List of registered users in the system.</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Fetching records...</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* Table Header - Hidden on Mobile */}
            {!isMobile && (
              <View style={styles.tableHeaderRow}>
                 <Text style={[styles.columnLabel, { flex: 2 }]}>MEMBER NAME</Text>
                 <Text style={[styles.columnLabel, { flex: 1 }]}>MINISTRY</Text>
                 <Text style={[styles.columnLabel, { flex: 1.5 }]}>CONTACT / EMAIL</Text>
              </View>
            )}

            {/* Members Rows/Cards */}
            {members.map((item, index) => (
              <View key={index} style={[styles.memberRow, isMobile && styles.memberCardMobile]}>
                
                {/* TOP PART: AVATAR & INFO */}
                <View style={styles.infoWrapper}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {item.full_name ? item.full_name[0].toUpperCase() : "G"}
                    </Text>
                    {/* Floating Ministry Tag for Mobile (Matches your screenshot style) */}
                    {isMobile && (
                      <View style={styles.floatingBadgeMobile}>
                         <Text style={styles.floatingBadgeText}>{item.ministry || "Member"}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.textDetails}>
                    <Text style={styles.memberNameText} numberOfLines={1}>{item.full_name}</Text>
                    <Text style={styles.emailSubText} numberOfLines={1}>{item.email}</Text>
                  </View>

                  {/* Ministry Column for Desktop Only */}
                  {!isMobile && (
                    <View style={{ flex: 1, marginLeft: 20 }}>
                      <View style={styles.desktopBadge}>
                        <Text style={styles.badgeText}>{item.ministry || "Member"}</Text>
                      </View>
                    </View>
                  )}

                  {/* Email Column for Desktop Only */}
                  {!isMobile && (
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.emailText}>{item.email}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {members.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>No members registered yet.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 40 },
  
  topActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 25 
  },
  inlineBackButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineBackText: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  headerTitleSection: { marginBottom: 30 },
  welcome: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 4 },
  
  totalBadge: { 
    backgroundColor: colors.primary + '10', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  totalText: { fontWeight: '800', color: colors.primary, fontSize: 13 },

  tableContainer: { gap: 10 },
  tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 8 },
  columnLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },

  memberRow: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    marginBottom: 5,
  },
  memberCardMobile: {
    padding: 16,
  },
  infoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  avatarCircle: { 
    width: 50, 
    height: 50, 
    borderRadius: 18, 
    backgroundColor: colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative', // Para sa floating badge
  },
  avatarInitial: { color: '#fff', fontWeight: '800', fontSize: 20 },
  
  textDetails: {
    flex: 2,
    marginLeft: 15,
    justifyContent: 'center',
  },
  memberNameText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  emailSubText: { fontSize: 13, color: '#64748B', marginTop: 2 },

  // Mobile Floating Badge
  floatingBadgeMobile: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
    minWidth: 60,
    alignItems: 'center'
  },
  floatingBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  // Desktop Badge
  desktopBadge: { 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6, 
    alignSelf: 'flex-start' 
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  emailText: { fontSize: 14, color: '#64748B' },

  loaderContainer: { marginTop: 80, alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 50 },
  emptyStateText: { marginTop: 10, color: '#94A3B8', fontSize: 16, fontWeight: '600' }
});