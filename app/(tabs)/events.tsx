import React, { useState, useCallback } from "react"; // Idinagdag ang useCallback
import { 
  View, Text, StyleSheet, ScrollView, 
  Pressable, ActivityIndicator, Image, Modal 
} from "react-native";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router"; // Idinagdag para sa auto-refresh logic

interface EventItem {
  id: string;
  title: string;
  description: string;
  target_date: string;
  target_time: string;
  location: string;
  category: string;
  image_url?: string;
}

export default function EventsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'memories'>('upcoming');
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [pastEvents, setPastEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<EventItem | null>(null);

  const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800';

  // --- AUTO-REFRESH LOGIC ---
  useFocusEffect(
    useCallback(() => {
      fetchEvents();

      const subscription = supabase
        .channel('realtime-events-v3')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchEvents())
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }, [])
  );

  const fetchEvents = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("category", "event")
      .order("target_date", { ascending: true });

    if (!error && data) {
      const upcoming = data.filter(item => item.target_date >= today);
      const past = data.filter(item => item.target_date < today).reverse();
      setUpcomingEvents(upcoming);
      setPastEvents(past);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Church Events</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'upcoming' ? "Join our upcoming gatherings" : "Memories of our faith journey"}
          </Text>
        </View>
        
        <View style={styles.tabContainer}>
          <Pressable style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} onPress={() => setActiveTab('upcoming')}>
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'memories' && styles.activeTab]} onPress={() => setActiveTab('memories')}>
            <Text style={[styles.tabText, activeTab === 'memories' && styles.activeTabText]}>Memories</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {activeTab === 'upcoming' && (
            upcomingEvents.length === 0 ? (
              <View style={styles.center}><Text style={styles.emptyText}>No events scheduled yet.</Text></View>
            ) : (
              upcomingEvents.map((item) => (
                <View key={item.id} style={styles.eventCard}>
                  {/* DATE BADGE */}
                  <View style={styles.dateBox}>
                    <Text style={styles.month}>{new Date(item.target_date).toLocaleString('default', { month: 'short' })}</Text>
                    <Text style={styles.day}>{new Date(item.target_date).getDate()}</Text>
                  </View>

                  <View style={styles.details}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                    
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color={colors.primary} />
                        <Text style={styles.metaText}>{item.target_time || "TBA"}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={16} color="#64748B" />
                        <Text style={styles.metaText}>{item.location || "Main Sanctuary"}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )
          )}

          {activeTab === 'memories' && (
            <View style={styles.memoryGrid}>
              {pastEvents.map((m) => (
                <Pressable key={m.id} style={styles.memoryCard} onPress={() => setSelectedMemory(m)}>
                  <Image source={{ uri: m.image_url || PLACEHOLDER_IMG }} style={styles.memoryImg} />
                  <View style={styles.memoryOverlay}>
                    <Text style={styles.memoryTitle}>{m.title}</Text>
                    <Text style={styles.memoryDate}>{new Date(m.target_date).toLocaleDateString()}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* DETAILED MODAL */}
      <Modal visible={!!selectedMemory} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMemory && (
              <>
                <Image source={{ uri: selectedMemory.image_url || PLACEHOLDER_IMG }} style={styles.modalImg} />
                <Pressable style={styles.closeIcon} onPress={() => setSelectedMemory(null)}>
                  <Ionicons name="close-circle" size={35} color="#fff" />
                </Pressable>
                <View style={styles.modalTextContent}>
                  <View style={styles.modalBadge}><Text style={styles.modalBadgeText}>PAST EVENT</Text></View>
                  <Text style={styles.modalTitle}>{selectedMemory.title}</Text>
                  
                  <View style={styles.modalMeta}>
                     <Text style={styles.modalMetaLabel}>DATE: <Text style={styles.modalMetaVal}>{new Date(selectedMemory.target_date).toLocaleDateString()}</Text></Text>
                     <Text style={styles.modalMetaLabel}>TIME: <Text style={styles.modalMetaVal}>{selectedMemory.target_time || "---"}</Text></Text>
                  </View>

                  <Text style={styles.modalInfo}>{selectedMemory.description || "No description provided."}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', padding: 5, borderRadius: 15 },
  tab: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 12 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  tabText: { fontWeight: '700', color: '#64748B' },
  activeTabText: { color: colors.primary },
  scrollContent: { paddingBottom: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
  
  eventCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 25, borderRadius: 28, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  dateBox: { backgroundColor: '#EEF2FF', padding: 15, borderRadius: 20, alignItems: 'center', minWidth: 80 },
  month: { fontSize: 14, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  day: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  details: { flex: 1, marginLeft: 25 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  cardDesc: { color: '#64748B', fontSize: 15, lineHeight: 22, marginBottom: 15 },
  
  metaRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, color: '#475569', fontWeight: '600' },

  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  memoryCard: { width: '31%', height: 280, borderRadius: 30, overflow: 'hidden' },
  memoryImg: { width: '100%', height: '100%' },
  memoryOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25, backgroundColor: 'rgba(0,0,0,0.6)' },
  memoryTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  memoryDate: { color: '#E2E8F0', fontSize: 12, marginTop: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 600, backgroundColor: '#fff', borderRadius: 35, overflow: 'hidden' },
  modalImg: { width: '100%', height: 350 },
  closeIcon: { position: 'absolute', top: 25, right: 25 },
  modalTextContent: { padding: 35 },
  modalBadge: { alignSelf: 'flex-start', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 15 },
  modalBadgeText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  modalTitle: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
  modalMeta: { flexDirection: 'row', gap: 20, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 15 },
  modalMetaLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  modalMetaVal: { color: '#1E293B' },
  modalInfo: { fontSize: 16, color: '#475569', lineHeight: 26 },
  emptyText: { color: '#94A3B8', fontSize: 16 }
});