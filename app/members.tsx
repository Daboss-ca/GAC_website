import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Pressable 
} from "react-native";
import { supabase } from "@/constant/supabase";
import { colors } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

export default function MembersScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Automatic refresh tuwing papasok sa screen na ito
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
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* --- MANUAL BACK BUTTON (HEADER) --- */}
        <Pressable 
          onPress={() => router.replace("/(tabs)")} 
          style={styles.inlineBackButton}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.inlineBackText}>Back to Dashboard Overview</Text>
        </Pressable>

        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Church Members</Text>
            <Text style={styles.subtitle}>List of all registered users in the system.</Text>
          </View>
          
          <View style={styles.totalBadge}>
            <Ionicons name="people" size={18} color={colors.primary} />
            <Text style={styles.totalText}>{members.length} Members</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Fetching latest records...</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* Table Header Labels */}
            <View style={styles.tableHeaderRow}>
               <Text style={[styles.columnLabel, { flex: 2 }]}>MEMBER NAME</Text>
               <Text style={[styles.columnLabel, { flex: 1 }]}>MINISTRY</Text>
               <Text style={[styles.columnLabel, { flex: 1.5 }]}>CONTACT / EMAIL</Text>
            </View>

            {/* Members Rows */}
            {members.map((item, index) => (
              <View key={index} style={styles.memberRow}>
                <View style={styles.nameSection}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {item.full_name ? item.full_name[0].toUpperCase() : "G"}
                    </Text>
                  </View>
                  <Text style={styles.memberNameText}>{item.full_name}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.ministry || "Member"}</Text>
                  </View>
                </View>

                <View style={{ flex: 1.5 }}>
                  <Text style={styles.emailText}>{item.email}</Text>
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
  
  // New Back Button Style sa loob ng Page
  inlineBackButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 20,
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  inlineBackText: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 35 
  },
  welcome: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 4 },
  
  totalBadge: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  totalText: { fontWeight: '800', color: colors.primary, fontSize: 15 },

  tableContainer: { gap: 10 },
  tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 25, marginBottom: 5 },
  columnLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },

  memberRow: { 
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 18, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  nameSection: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatarCircle: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    backgroundColor: colors.primary + '15', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarInitial: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  memberNameText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  badge: { 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 6, 
    alignSelf: 'flex-start' 
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  emailText: { fontSize: 14, color: '#64748B' },

  loaderContainer: { marginTop: 80, alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 50 },
  emptyStateText: { marginTop: 10, color: '#94A3B8', fontSize: 16, fontWeight: '600' }
});