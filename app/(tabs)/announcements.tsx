import React, { useState, useCallback } from "react";
import { 
  View, Text, StyleSheet, Pressable, ScrollView, 
  TextInput, Modal, ActivityIndicator, Platform, Linking, Alert
} from "react-native";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { useFocusEffect } from "expo-router"; 
import { Plus, Trash2, X, Calendar, Clock, MapPin, ChevronDown, Music, ExternalLink } from 'lucide-react-native';

export default function AnnouncementsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);

  const [category, setCategory] = useState("announcement");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(""); 
  const [time, setTime] = useState("");
  const [location, setLocation] = useState(""); 
  const [songLink, setSongLink] = useState(""); // UI State
  const [songs, setSongs] = useState({ song1: "", song2: "", song3: "", song4: "" });

  const categories = ["announcement", "event", "song-lineup"];

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const fetchAll = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      await supabase.from("announcements").delete().lt("target_date", today); 
      const { data: res } = await supabase.from("announcements").select("*").order("target_date", { ascending: true });
      if (res) setData(res);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!title.trim() || !date.trim()) {
      Platform.OS === 'web' ? alert("Title and Date are required.") : Alert.alert("Error", "Title and Date are required.");
      return;
    }

    // MAPA: Dito natin ginamit ang 'external_link' para magtugma sa database mo
    const payload = { 
        title: title.trim(), 
        description: description.trim(), 
        category, 
        target_date: date, 
        target_time: time || null, 
        location: location || null, 
        external_link: songLink || null, // <--- Eto ang binago natin
        song_1: songs.song1 || null, 
        song_2: songs.song2 || null, 
        song_3: songs.song3 || null, 
        song_4: songs.song4 || null 
    };

    const { error } = await supabase.from("announcements").insert([payload]);
    
    if (error) {
      console.error("Supabase Error:", error.message);
      alert("Error: " + error.message);
    } else {
      closeModal(); 
      fetchAll();
    }
  };

  const closeModal = () => {
    setModalVisible(false); 
    setIsCatOpen(false);
    setCategory("announcement"); 
    setTitle(""); 
    setDescription(""); 
    setDate(""); 
    setTime(""); 
    setLocation(""); 
    setSongLink("");
    setSongs({ song1: "", song2: "", song3: "", song4: "" });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>Church Feed</Text>
            <Text style={styles.headerSubtitle}>Updated activities and lineups</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {data.map((item) => (
            <View key={item.id} style={styles.largeCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.typeBadge, { backgroundColor: item.category === 'event' ? '#FEF3C7' : '#E0F2FE' }]}>
                   <Text style={[styles.typeBadgeText, { color: item.category === 'event' ? '#B45309' : colors.primary }]}>
                    {item.category?.replace('-', ' ').toUpperCase()}
                   </Text>
                </View>
                <Pressable onPress={() => supabase.from("announcements").delete().eq("id", item.id).then(() => fetchAll())}>
                  <Trash2 size={18} color="#FDA4AF" />
                </Pressable>
              </View>

              <Text style={styles.largeTitle}>{item.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}><Calendar size={14} color={colors.primary} /><Text style={styles.metaText}>{item.target_date}</Text></View>
                {item.target_time && <View style={styles.metaItem}><Clock size={14} color="#64748B" /><Text style={styles.metaText}>{item.target_time}</Text></View>}
              </View>

              {item.location && <View style={[styles.metaItem, { marginTop: 4 }]}><MapPin size={14} color="#64748B" /><Text style={styles.metaText}>{item.location}</Text></View>}
              {item.description && <Text style={styles.largeDesc}>{item.description}</Text>}

              {item.category === 'song-lineup' && (
                <View style={styles.largeLineupBox}>
                  <View style={styles.lineupTitleRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Music size={16} color={colors.primary} />
                        <Text style={[styles.lineupTitleText, { marginLeft: 6 }]}>Worship Lineup</Text>
                    </View>
                    {item.external_link && ( // <--- Inupdate din dito para sa Display
                        <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(item.external_link)}>
                            <ExternalLink size={12} color={colors.primary} />
                            <Text style={styles.linkBtnText}>Link</Text>
                        </Pressable>
                    )}
                  </View>
                  <View style={styles.songsList}>
                    {[item.song_1, item.song_2, item.song_3, item.song_4].map((s, i) => s && (
                      <View key={i} style={styles.songRow}>
                        <Text style={styles.songNumber}>{i + 1}</Text>
                        <Text style={styles.songNameText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* COMPACT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Post</Text>
              <Pressable onPress={closeModal}><X size={20} color="#64748B" /></Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.labelText}>Category</Text>
              <View style={{ zIndex: 1000 }}>
                <Pressable style={styles.dropdown} onPress={() => setIsCatOpen(!isCatOpen)}>
                  <Text style={styles.dropdownValue}>{category.toUpperCase()}</Text>
                  <ChevronDown size={16} color="#64748B" />
                </Pressable>
                {isCatOpen && (
                  <View style={styles.dropdownMenu}>
                    {categories.map(c => (
                      <Pressable key={c} style={styles.menuItem} onPress={() => { setCategory(c); setIsCatOpen(false); }}>
                        <Text style={styles.menuItemText}>{c.toUpperCase()}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
              
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelText}>Date</Text>
                  {Platform.OS === 'web' ? (
                    <input title="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} 
                      style={{ padding: '10px', borderRadius: '8px', borderWidth: 1, borderStyle: 'solid', borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', width: '100%', fontSize: '13px', marginBottom: '10px' } as any} 
                    />
                  ) : (
                    <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.labelText}>Time</Text>
                  <TextInput style={styles.input} placeholder="9:00 AM" value={time} onChangeText={setTime} />
                </View>
              </View>

              {category === 'event' && <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />}
              
              {category === 'song-lineup' && (
                <View style={styles.songSection}>
                  <Text style={styles.labelText}>External Link & Songs</Text>
                  <TextInput style={[styles.input, { borderColor: colors.primary }]} placeholder="Link (YouTube/Spotify)" value={songLink} onChangeText={setSongLink} />
                  <TextInput style={styles.songInput} placeholder="Song 1" value={songs.song1} onChangeText={(t) => setSongs({...songs, song1: t})} />
                  <TextInput style={styles.songInput} placeholder="Song 2" value={songs.song2} onChangeText={(t) => setSongs({...songs, song2: t})} />
                  <TextInput style={styles.songInput} placeholder="Song 3" value={songs.song3} onChangeText={(t) => setSongs({...songs, song3: t})} />
                  <TextInput style={styles.songInput} placeholder="Song 4" value={songs.song4} onChangeText={(t) => setSongs({...songs, song4: t})} />
                </View>
              )}

              <TextInput style={[styles.input, { height: 60 }]} placeholder="Description" value={description} onChangeText={setDescription} multiline />

              <Pressable style={styles.submitBtn} onPress={handleSave}>
                <Text style={styles.submitBtnText}>Publish Now</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  header: { padding: 25, paddingTop: 50, backgroundColor: "#fff", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900' as any, color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B' },
  addBtn: { backgroundColor: colors.primary, width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 15 },
  largeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '800' as any },
  largeTitle: { fontSize: 22, fontWeight: '800' as any, color: '#1E293B', marginBottom: 6 },
  metaRow: { flexDirection: 'row', marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  metaText: { fontSize: 13, color: '#64748B', fontWeight: '600' as any, marginLeft: 4 },
  largeDesc: { fontSize: 14, color: '#475569', lineHeight: 20, marginTop: 8 },
  largeLineupBox: { marginTop: 15, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  lineupTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  lineupTitleText: { fontSize: 13, fontWeight: '800' as any, color: colors.primary },
  linkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  linkBtnText: { fontSize: 11, fontWeight: '700' as any, color: colors.primary, marginLeft: 4 },
  songsList: { paddingBottom: 5 },
  songRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 6 },
  songNumber: { fontSize: 11, fontWeight: '800' as any, color: colors.primary, width: 20, textAlign: 'center' },
  songNameText: { fontSize: 14, fontWeight: '600' as any, color: '#1E293B', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 15, width: '90%', maxWidth: 400, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800' as any },
  labelText: { fontSize: 11, fontWeight: '700' as any, color: '#64748B', marginBottom: 4, marginTop: 8 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 5 },
  dropdownValue: { fontSize: 13, fontWeight: '700' as any },
  dropdownMenu: { position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 2000 },
  menuItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuItemText: { fontSize: 12, fontWeight: '600' as any },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 8, color: '#000' },
  row: { flexDirection: 'row' },
  songSection: { marginBottom: 5 },
  songInput: { backgroundColor: '#fff', borderLeftWidth: 3, borderLeftColor: colors.primary, padding: 8, borderRadius: 6, fontSize: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 4 },
  submitBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' as any }
});