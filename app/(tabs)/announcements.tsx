import React, { useState, useCallback } from "react";
import { 
  View, Text, StyleSheet, Pressable, ScrollView, 
  TextInput, Modal, ActivityIndicator, Platform 
} from "react-native";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router"; // Idinagdag para sa auto-refresh

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: 'announcement' | 'event' | 'song-lineup';
  target_date: string;
  target_time: string;
  location: string;
  song_1: string;
  song_2: string;
  song_3: string;
  song_4: string;
  external_link: string;
  created_at: string;
}

export default function AnnouncementsScreen() {
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Status Messages State (Palit sa Alert)
  const [statusMsg, setStatusMsg] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null); // Para sa inline delete confirmation

  // Form States
  const [category, setCategory] = useState<Announcement['category']>("announcement");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [song1, setSong1] = useState("");
  const [song2, setSong2] = useState("");
  const [song3, setSong3] = useState("");
  const [song4, setSong4] = useState("");
  const [link, setLink] = useState("");

  // Auto-refresh tuwing papasok sa screen
  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000); // Mawawala after 3 seconds
  };

  const fetchAll = async () => {
    setLoading(true);
    const { data: res, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setData(res || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title) return showStatus("Title is required", "error");

    const payload = { 
      title, 
      description, 
      category, 
      target_date: date || null, 
      target_time: time || null, 
      location: location || null,
      song_1: song1 || null, 
      song_2: song2 || null, 
      song_3: song3 || null, 
      song_4: song4 || null,
      external_link: link || null 
    };

    const { error } = await supabase.from("announcements").insert([payload]);
    
    if (error) {
      showStatus("Error: " + error.message, "error");
    } else {
      showStatus("Posted successfully!", "success");
      closeModal();
      fetchAll();
    }
  };

  const confirmDelete = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) {
      showStatus("Announcement deleted", "success");
      setDeletingId(null);
      fetchAll();
    } else {
      showStatus("Failed to delete", "error");
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTitle(""); setDescription(""); setDate(""); setTime(""); setLocation("");
    setSong1(""); setSong2(""); setSong3(""); setSong4(""); setLink("");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Post Manager</Text>
          <Text style={styles.subtitle}>Broadcast news and organize church activities</Text>
        </View>

        {/* INLINE STATUS MESSAGE (Katabi ng Header) */}
        {statusMsg && (
          <View style={[styles.inlineStatus, { backgroundColor: statusMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2' }]}>
            <Text style={{ color: statusMsg.type === 'success' ? '#166534' : '#991B1B', fontWeight: '700' }}>
              {statusMsg.text}
            </Text>
          </View>
        )}

        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New Post</Text>
        </Pressable>
      </View>

      {/* GRID LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {data.map((item) => (
            <View key={item.id} style={styles.card}>
              {deletingId === item.id ? (
                // --- INLINE DELETE CONFIRMATION ---
                <View style={styles.deleteConfirmOverlay}>
                  <Ionicons name="warning" size={30} color="#EF4444" />
                  <Text style={styles.confirmText}>Delete this post?</Text>
                  <View style={styles.confirmActions}>
                    <Pressable style={styles.confirmBtn} onPress={() => confirmDelete(item.id)}>
                      <Text style={styles.confirmBtnText}>Yes, Delete</Text>
                    </Pressable>
                    <Pressable style={styles.cancelBtn} onPress={() => setDeletingId(null)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, item.category === 'announcement' && { backgroundColor: '#F0F9FF' }]}>
                      <Text style={[styles.badgeText, item.category === 'announcement' && { color: '#0369A1' }]}>
                        {item.category.replace('-', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <Pressable onPress={() => setDeletingId(item.id)}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  </View>

                  <Text style={styles.cardTitle}>{item.title}</Text>

                  <View style={styles.scheduleHighlight}>
                    <View style={styles.schedItem}>
                      <Ionicons name="calendar" size={16} color={colors.primary} />
                      <Text style={styles.schedTextMain}>{item.target_date || "No Date Set"}</Text>
                    </View>
                    <View style={styles.schedItem}>
                      <Ionicons name="time" size={16} color={colors.primary} />
                      <Text style={styles.schedTextMain}>{item.target_time || "TBA"}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>
                </>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* FORM MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Create New Post</Text>
                <Pressable onPress={closeModal}><Ionicons name="close" size={24} color="#64748B" /></Pressable>
            </View>
            
            <View style={styles.categoryRow}>
              {(['announcement', 'event', 'song-lineup'] as const).map(cat => (
                <Pressable key={cat} onPress={() => setCategory(cat)} style={[styles.catBtn, category === cat && styles.catBtnActive]}>
                  <Text style={[styles.catText, category === cat && { color: '#fff' }]}>{cat}</Text>
                </Pressable>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Basic Information</Text>
              <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
              <TextInput style={[styles.input, { height: 70 }]} placeholder="Description" value={description} onChangeText={setDescription} multiline />
              
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.innerLabel}>Date</Text>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={webInputStyle} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.innerLabel}>Time</Text>
                    <TextInput style={styles.input} placeholder="e.g. 9:00 AM" value={time} onChangeText={setTime} />
                </View>
              </View>

              {category === 'event' && (
                <View style={styles.specificSection}>
                  <Text style={styles.sectionLabel}>Location</Text>
                  <TextInput style={styles.input} placeholder="Venue Name" value={location} onChangeText={setLocation} />
                </View>
              )}

              {category === 'song-lineup' && (
                <View style={styles.specificSection}>
                  <Text style={styles.sectionLabel}>Songs & Links</Text>
                  <TextInput style={styles.input} placeholder="Song 1" value={song1} onChangeText={setSong1} />
                  <TextInput style={styles.input} placeholder="Song 2" value={song2} onChangeText={setSong2} />
                  <TextInput style={styles.input} placeholder="Song 3" value={song3} onChangeText={setSong3} />
                  <TextInput style={styles.input} placeholder="Song 4" value={song4} onChangeText={setSong4} />
                  <TextInput style={[styles.input, { borderColor: colors.primary }]} placeholder="YouTube/Link" value={link} onChangeText={setLink} />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Post Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const webInputStyle = {
  width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '15px', fontSize: '14px', backgroundColor: '#F8FAFC'
} as any;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 32, fontWeight: "900", color: '#0F172A' },
  subtitle: { color: "#64748B", fontSize: 16 },
  
  // Status Msg
  inlineStatus: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#10B981' },
  
  addButton: { backgroundColor: colors.primary, flexDirection: 'row', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, alignItems: 'center', gap: 8 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  card: { width: '31%', minHeight: 280, backgroundColor: '#fff', padding: 26, borderRadius: 28, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'flex-start' },
  
  // Delete Inline UI
  deleteConfirmOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  confirmText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmBtn: { backgroundColor: '#EF4444', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cancelBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  cancelBtnText: { color: '#64748B', fontWeight: '700', fontSize: 12 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  badge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 10, color: colors.primary, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
  scheduleHighlight: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 18, marginBottom: 15, gap: 8, borderLeftWidth: 5, borderLeftColor: colors.primary },
  schedItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  schedTextMain: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  cardDesc: { color: '#64748B', fontSize: 14, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: 550, padding: 35, borderRadius: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalHeaderTitle: { fontSize: 24, fontWeight: '800' },
  categoryRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  catBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  catBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'capitalize' },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: colors.primary, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  innerLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, color: '#64748B' },
  input: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15, fontSize: 15 },
  row: { flexDirection: 'row', width: '100%' },
  specificSection: { marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  modalActions: { marginTop: 25 },
  saveBtn: { backgroundColor: colors.primary, padding: 20, borderRadius: 18, alignItems: 'center' }
});