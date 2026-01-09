import React, { useState, useCallback } from "react";
import { 
  View, Text, StyleSheet, ScrollView, 
  Pressable, ActivityIndicator, Linking, useWindowDimensions 
} from "react-native";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

interface SongLineupItem {
  id: string;
  title: string;
  description: string;
  target_date: string;
  target_time: string;
  song_1: string;
  song_2: string;
  song_3: string;
  song_4: string;
  external_link: string;
}

export default function SongLineupScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [lineups, setLineups] = useState<SongLineupItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchLineups();
      const subscription = supabase
        .channel('realtime-lineups')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          fetchLineups();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }, [])
  );

  const fetchLineups = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("category", "song-lineup")
      .order("target_date", { ascending: true });
    
    if (!error) setLineups(data || []);
    setLoading(false);
  };

  const openLink = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => alert("Couldn't load page"));
    }
  };

  return (
    <View style={[styles.container, isMobile && { padding: 15 }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isMobile && { fontSize: 26 }]}>Song Lineups</Text>
          <Text style={[styles.subtitle, isMobile && { fontSize: 14 }]}>Worship service setlists</Text>
        </View>
        <Ionicons name="musical-notes" size={isMobile ? 28 : 32} color={colors.primary} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.grid, isMobile && { flexDirection: 'column' }]} showsVerticalScrollIndicator={false}>
          {lineups.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="musical-note-outline" size={50} color="#CBD5E1" />
                <Text style={styles.emptyText}>No lineups posted yet.</Text>
            </View>
          ) : (
            lineups.map((item) => (
              <View key={item.id} style={[styles.card, isMobile && { width: '100%', padding: 20 }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, isMobile && { fontSize: 18 }]}>{item.title}</Text>
                  <Ionicons name="list-outline" size={20} color={colors.primary} />
                </View>

                {/* SCHEDULE BOX */}
                <View style={styles.scheduleHighlight}>
                  <View style={styles.schedItem}>
                    <Ionicons name="calendar" size={14} color={colors.primary} />
                    <Text style={[styles.schedTextMain, isMobile && { fontSize: 14 }]}>{item.target_date || "No Date"}</Text>
                  </View>
                  <View style={styles.schedItem}>
                    <Ionicons name="time" size={14} color={colors.primary} />
                    <Text style={[styles.schedTextMain, isMobile && { fontSize: 14 }]}>{item.target_time || "TBA"}</Text>
                  </View>
                </View>

                {/* SONG LIST SECTION */}
                <View style={styles.songList}>
                  <Text style={styles.songLabel}>SETLIST:</Text>
                  {[item.song_1, item.song_2, item.song_3, item.song_4].map((song, index) => (
                    <View key={index} style={styles.songRow}>
                      <Text style={styles.songNumber}>{index + 1}</Text>
                      <Text style={styles.songName} numberOfLines={1}>{song || "---"}</Text>
                    </View>
                  ))}
                </View>

                {/* FOOTER ACTION */}
                {item.external_link && (
                  <Pressable 
                    style={styles.linkButton} 
                    onPress={() => openLink(item.external_link)}
                  >
                    <Ionicons name="logo-youtube" size={16} color="#fff" />
                    <Text style={styles.linkText}>Reference</Text>
                    <Ionicons name="open-outline" size={14} color="#fff" style={{ marginLeft: 'auto' }} />
                  </Pressable>
                )}
                
                {item.description && (
                    <Text style={styles.descText}>{item.description}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 32, fontWeight: "900", color: '#0F172A' },
  subtitle: { color: "#64748B", fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  
  card: { 
    width: '31%', 
    backgroundColor: '#fff', 
    padding: 26, 
    borderRadius: 28, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', flex: 1 },

  scheduleHighlight: { 
    backgroundColor: '#F8FAFC', 
    padding: 14, 
    borderRadius: 18, 
    marginBottom: 20, 
    gap: 6, 
    borderLeftWidth: 5, 
    borderLeftColor: colors.primary 
  },
  schedItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  schedTextMain: { fontSize: 16, fontWeight: '800', color: '#1E293B' },

  songList: { marginBottom: 15 },
  songLabel: { fontSize: 10, fontWeight: '900', color: colors.primary, marginBottom: 10, letterSpacing: 1 },
  songRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    padding: 10, 
    borderRadius: 12, 
    marginBottom: 6 
  },
  songNumber: { 
    width: 22, 
    height: 22, 
    backgroundColor: colors.primary, 
    borderRadius: 11, 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 11, 
    fontWeight: '800', 
    lineHeight: 22,
    marginRight: 10
  },
  songName: { fontSize: 13, fontWeight: '600', color: '#334155', flex: 1 },

  linkButton: { 
    backgroundColor: '#1E293B', 
    flexDirection: 'row', 
    padding: 12, 
    borderRadius: 12, 
    alignItems: 'center', 
    gap: 8,
    marginBottom: 12
  },
  linkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  descText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', lineHeight: 18 },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100, width: '100%', gap: 10 },
  emptyText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' }
});