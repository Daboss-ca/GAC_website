import React, { useState, useCallback } from "react";
import { 
  View, Text, StyleSheet, ScrollView, 
  Pressable, ActivityIndicator, Image, Modal,
  useWindowDimensions // Idinagdag para sa responsiveness
} from "react-native";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

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
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Mobile breakpoint

  const [activeTab, setActiveTab] = useState<'upcoming' | 'memories'>('upcoming');
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [pastEvents, setPastEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<EventItem | null>(null);

  const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800';

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
    <View style={[styles.container, isMobile && { padding: 15 }]}>
      {/* HEADER SECTION - Responsive direction */}
      <View style={[styles.header, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 20 }]}>
        <View>
          <Text style={[styles.title, isMobile && { fontSize: 26 }]}>Church Events</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'upcoming' ? "Join our gatherings" : "Our faith journey"}
          </Text>
        </View>
        
        <View style={[styles.tabContainer, isMobile && { width: '100%' }]}>
          <Pressable style={[styles.tab, activeTab === 'upcoming' && styles.activeTab, isMobile && { flex: 1 }]} onPress={() => setActiveTab('upcoming')}>
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText, isMobile && { textAlign: 'center' }]}>Upcoming</Text>
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'memories' && styles.activeTab, isMobile && { flex: 1 }]} onPress={() => setActiveTab('memories')}>
            <Text style={[styles.tabText, activeTab === 'memories' && styles.activeTabText, isMobile && { textAlign: 'center' }]}>Memories</Text>
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
                <View key={item.id} style={[styles.eventCard, isMobile && { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  {/* DATE BADGE */}
                  <View style={[styles.dateBox, isMobile && { flexDirection: 'row', width: '100%', gap: 10, minWidth: 0, marginBottom: 15 }]}>
                    <Text style={styles.month}>{new Date(item.target_date).toLocaleString('default', { month: 'short' })}</Text>
                    <Text style={[styles.day, isMobile && { fontSize: 20 }]}>{new Date(item.target_date).getDate()}</Text>
                  </View>

                  <View style={[styles.details, isMobile && { marginLeft: 0 }]}>
                    <Text style={[styles.cardTitle, isMobile && { fontSize: 18 }]}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>
                    
                    <View style={[styles.metaRow, isMobile && { flexWrap: 'wrap' }]}>
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
            <View style={[styles.memoryGrid, isMobile && { flexDirection: 'column' }]}>
              {pastEvents.map((m) => (
                <Pressable key={m.id} style={[styles.memoryCard, isMobile && { width: '100%' }]} onPress={() => setSelectedMemory(m)}>
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

      {/* DETAILED MODAL - Responsive Width */}
      <Modal visible={!!selectedMemory} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isMobile && { width: '92%', borderRadius: 20 }]}>
            {selectedMemory && (
              <ScrollView bounces={false}>
                <Image source={{ uri: selectedMemory.image_url || PLACEHOLDER_IMG }} style={[styles.modalImg, isMobile && { height: 250 }]} />
                <Pressable style={styles.closeIcon} onPress={() => setSelectedMemory(null)}>
                  <Ionicons name="close-circle" size={35} color="#fff" />
                </Pressable>
                <View style={[styles.modalTextContent, isMobile && { padding: 20 }]}>
                  <View style={styles.modalBadge}><Text style={styles.modalBadgeText}>PAST EVENT</Text></View>
                  <Text style={[styles.modalTitle, isMobile && { fontSize: 22 }]}>{selectedMemory.title}</Text>
                  
                  <View style={[styles.modalMeta, isMobile && { flexDirection: 'column', gap: 5 }]}>
                     <Text style={styles.modalMetaLabel}>DATE: <Text style={styles.modalMetaVal}>{new Date(selectedMemory.target_date).toLocaleDateString()}</Text></Text>
                     <Text style={styles.modalMetaLabel}>TIME: <Text style={styles.modalMetaVal}>{selectedMemory.target_time || "---"}</Text></Text>
                  </View>

                  <Text style={styles.modalInfo}>{selectedMemory.description || "No description provided."}</Text>
                </View>
              </ScrollView>
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
  modalContent: { width: 600, backgroundColor: '#fff', borderRadius: 35, overflow: 'hidden', maxHeight: '90%' },
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