import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Pressable 
} from "react-native";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router"; // Idinagdag ang useFocusEffect

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    members: 0,
    upcomingEvents: 0,
    songLineups: 0,
    totalPosts: 0
  });
  const [loading, setLoading] = useState(true);

  // --- ITO ANG LOGIC PARA SA AUTO-REFRESH ---
  // Tuwing iki-click ang Dashboard sa Sidebar, tatakbo itong function na ito.
  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();

      // Optional: Realtime subscription para kung may mag-signup habang nakatingin ka
      const subscription = supabase
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchDashboardStats())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchDashboardStats())
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }, [])
  );

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Bilangin ang Signups
      const { data: userCount } = await supabase.rpc('get_user_count');

      // 2. Bilangin ang Upcoming Events
      const { count: eventCount } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'event')
        .gte('target_date', today);

      // 3. Bilangin ang Song Lineups
      const { count: lineupCount } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'song-lineup')
        .gte('target_date', today);

      // 4. Bilangin ang Lahat ng Posts
      const { count: postCount } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true });

      setStats({
        members: userCount || 0,
        upcomingEvents: eventCount || 0,
        songLineups: lineupCount || 0,
        totalPosts: postCount || 0
      });
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Church Dashboard</Text>
          <Text style={styles.subtitle}>Overview of church activities and users.</Text>
        </View>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.dateText}>{new Date().toDateString()}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Refreshing dashboard data...</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {/* STATS ROW 1 */}
          <View style={styles.statsRow}>
            <Pressable style={styles.card} onPress={() => router.push('/members')}>
              <View style={[styles.iconBox, { backgroundColor: '#6366F120' }]}>
                <Ionicons name="people" size={28} color="#6366F1" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>WCAM Member</Text>
                <Text style={styles.cardCount}>{stats.members}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </Pressable>

            <Pressable style={styles.card} onPress={() => router.push('/events')}>
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="calendar" size={28} color="#F59E0B" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Upcoming Events</Text>
                <Text style={styles.cardCount}>{stats.upcomingEvents}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </Pressable>
          </View>

          {/* STATS ROW 2 */}
          <View style={styles.statsRow}>
            <Pressable style={styles.card} onPress={() => router.push('/song-lineups')}>
              <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="musical-notes" size={28} color="#10B981" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Active Lineups</Text>
                <Text style={styles.cardCount}>{stats.songLineups}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </Pressable>

            <Pressable style={styles.card} onPress={() => router.push('/announcements')}>
              <View style={[styles.iconBox, { backgroundColor: '#EC489920' }]}>
                <Ionicons name="megaphone" size={28} color="#EC4899" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Total Posts</Text>
                <Text style={styles.cardCount}>{stats.totalPosts}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </Pressable>
          </View>

          {/* QUICK ACTIONS */}
          <Text style={styles.sectionTitle}>Quick Management</Text>
          <View style={styles.actionGrid}>
            <Pressable style={styles.actionBtn} onPress={() => router.push('/announcements')}>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.actionBtnText}>New Announcement</Text>
            </Pressable>
            
            <Pressable style={[styles.actionBtn, { backgroundColor: '#1E293B' }]} onPress={() => router.push('/song-lineups')}>
              <Ionicons name="musical-note" size={22} color="#fff" />
              <Text style={styles.actionBtnText}>Update Lineup</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  welcome: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 5 },
  dateBadge: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontWeight: '700', color: colors.primary, fontSize: 14 },
  grid: { gap: 20 },
  statsRow: { flexDirection: 'row', gap: 20 },
  card: { flex: 1, backgroundColor: '#fff', padding: 25, borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 20 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardCount: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  loaderContainer: { marginTop: 100, alignItems: 'center' },
  loaderText: { marginTop: 10, color: '#64748B', fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 30, marginBottom: 15 },
  actionGrid: { flexDirection: 'row', gap: 20 },
  actionBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});