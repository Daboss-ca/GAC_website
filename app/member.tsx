import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Pressable,
  useWindowDimensions,
  Image 
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
        .select("full_name, ministry, email, avatar_url")
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
        
        {/* HEADER */}
        <View style={styles.topActions}>
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.inlineBackButton}>
            <Ionicons name="arrow-back" size={18} color={colors.primary} />
            <Text style={styles.inlineBackText}>Dashboard</Text>
          </Pressable>
          <View style={styles.totalBadge}>
            <Ionicons name="people" size={18} color={colors.primary} />
            <Text style={styles.totalText}>{members.length} Members</Text>
          </View>
        </View>

        <View style={styles.headerTitleSection}>
          <Text style={styles.welcome}>Church Members</Text>
          <Text style={styles.subtitle}>Manage and view all registered members.</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Loading members...</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            
            {!isMobile && (
              <View style={styles.tableHeaderRow}>
                 <Text style={[styles.columnLabel, { width: 300 }]}>MEMBER / NAME</Text>
                 <Text style={[styles.columnLabel, { flex: 1 }]}>MINISTRY</Text>
                 <Text style={[styles.columnLabel, { flex: 1.5 }]}>EMAIL ADDRESS</Text>
              </View>
            )}

            {members.map((item, index) => {
              const avatarUri = item.avatar_url ? `${item.avatar_url}?t=${new Date().getTime()}` : undefined;

              return (
                <View key={index} style={[styles.memberRow, isMobile && styles.memberCardMobile]}>
                  <View style={styles.infoWrapper}>
                    
                    {/* PROFILE COLUMN - FIXED LAYOUT */}
                    <View style={styles.profileColumn}>
                      {/* ETO YUNG UI NG PAGLALAGYAN NG PROFILE */}
                      <View style={styles.avatarFrame}>
                        {avatarUri ? (
                          <Image 
                            source={{ uri: avatarUri }} 
                            style={styles.avatarImage}
                            resizeMode="cover"
                            // @ts-ignore
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <View style={styles.initialCircle}>
                            <Text style={styles.initialText}>
                              {item.full_name ? item.full_name[0].toUpperCase() : "?"}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.nameTextContainer}>
                        <Text style={styles.memberNameText} numberOfLines={1}>
                          {item.full_name || "No Name"}
                        </Text>
                        {isMobile && <Text style={styles.mobileEmailSub} numberOfLines={1}>{item.email}</Text>}
                      </View>
                    </View>

                    {/* MINISTRY COLUMN (DESKTOP) */}
                    {!isMobile && (
                      <View style={{ flex: 1 }}>
                        <View style={styles.ministryBadge}>
                          <Text style={styles.ministryText}>{item.ministry || "Member"}</Text>
                        </View>
                      </View>
                    )}

                    {/* EMAIL COLUMN (DESKTOP) */}
                    {!isMobile && (
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.desktopEmailText}>{item.email}</Text>
                      </View>
                    )}

                    {/* MOBILE BADGE */}
                    {isMobile && (
                       <View style={styles.mobileBadge}>
                          <Text style={styles.mobileBadgeText}>{item.ministry || "Member"}</Text>
                       </View>
                    )}

                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 30 },
  topActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  inlineBackButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  inlineBackText: { color: colors.primary, fontWeight: '700' },
  totalBadge: { backgroundColor: colors.primary + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalText: { fontWeight: '800', color: colors.primary },
  headerTitleSection: { marginBottom: 25 },
  welcome: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B' },
  tableContainer: { gap: 10 },
  tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  columnLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  
  memberRow: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    minHeight: 70, // Siniguro na may sapat na taas
  },
  memberCardMobile: { padding: 15 },
  infoWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-start', // Binago mula sa space-between para dikit ang profile sa name
    width: '100%' 
  },

  // ETO ANG PINAKA-IMPORTANTENG CHANGE PARA LUMABAS ANG UI
  profileColumn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: 300, // Fixed width para hindi maipit ang profile picture
    marginRight: 20 
  },
  avatarFrame: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: '#F1F5F9', 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Siniguro na hindi ito liliit (flex shrink)
    flexShrink: 0, 
  },
  avatarImage: { width: '100%', height: '100%' },
  initialCircle: { width: '100%', height: '100%', backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  initialText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  
  nameTextContainer: { 
    marginLeft: 15, // Space sa pagitan ng profile picture at text
    flex: 1, 
  },
  memberNameText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  mobileEmailSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  ministryBadge: { alignSelf: 'flex-start', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ministryText: { fontSize: 10, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  desktopEmailText: { fontSize: 14, color: '#64748B' },
  
  mobileBadge: { 
    position: 'absolute', 
    top: -5, 
    right: -5, 
    backgroundColor: colors.primary, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6,
    zIndex: 1 
  },
  mobileBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  loaderContainer: { marginTop: 100, alignItems: 'center' },
  loaderText: { marginTop: 10, color: '#64748B' }
});