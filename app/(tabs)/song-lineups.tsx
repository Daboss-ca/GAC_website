import React, { useState, useCallback } from "react"; // Idinagdag ang useCallback
import { 
  View, Text, StyleSheet, ScrollView, 
  Pressable, ActivityIndicator, Linking 
} from "react-native";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router"; // Idinagdag para sa auto-refresh

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
  const [lineups, setLineups] = useState<SongLineupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- AUTO-REFRESH LOGIC ---
  // Tatakbo ito tuwing "nag-fofocus" ang user sa screen na ito
  useFocusEffect(
    useCallback(() => {
      fetchLineups();

      // REAL-TIME SUBSCRIPTION sa loob ng focus effect
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
    // Hindi natin ititigil ang loading spinner dito para smooth ang refresh
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
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Song Lineups</Text>
          <Text style={styles.subtitle}>Worship service setlists and rehearsals</Text>
        </View>
        <Ionicons name="musical-notes" size={32} color={colors.primary} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {lineups.length === 0 ? (
            <Text style={styles.emptyText}>No lineups posted yet.</Text>
          ) : (
            lineups.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Ionicons name="list-outline" size={20} color={colors.primary} />
                </View>

                {/* SCHEDULE BOX */}
                <View style={styles.scheduleHighlight}>
                  <View style={styles.schedItem}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <Text style={styles.schedTextMain}>{item.target_date || "No Date"}</Text>
                  </View>
                  <View style={styles.schedItem}>
                    <Ionicons name="time" size={16} color={colors.primary} />
                    <Text style={styles.schedTextMain}>{item.target_time || "TBA"}</Text>
                  </View>
                </View>

                {/* SONG LIST SECTION */}
                <View style={styles.songList}>
                  <Text style={styles.songLabel}>SETLIST:</Text>
                  <View style={styles.songRow}>
                    <Text style={styles.songNumber}>1</Text>
                    <Text style={styles.songName}>{item.song_1 || "---"}</Text>
                  </View>
                  <View style={styles.songRow}>
                    <Text style={styles.songNumber}>2</Text>
                    <Text style={styles.songName}>{item.song_2 || "---"}</Text>
                  </View>
                  <View style={styles.songRow}>
                    <Text style={styles.songNumber}>3</Text>
                    <Text style={styles.songName}>{item.song_3 || "---"}</Text>
                  </View>
                  <View style={styles.songRow}>
                    <Text style={styles.songNumber}>4</Text>
                    <Text style={styles.songName}>{item.song_4 || "---"}</Text>
                  </View>
                </View>

                {/* FOOTER ACTION */}
                {item.external_link && (
                  <Pressable 
                    style={styles.linkButton} 
                    onPress={() => openLink(item.external_link)}
                  >
                    <Ionicons name="logo-youtube" size={16} color="#fff" />
                    <Text style={styles.linkText}>View Reference</Text>
                    <Ionicons name="open-outline" size={14} color="#fff" style={{ marginLeft: 'auto' }} />
                  </Pressable>
                )}
                
                <Text style={styles.descText}>{item.description}</Text>
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
    shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', flex: 1 },

  scheduleHighlight: { 
    backgroundColor: '#F8FAFC', 
    padding: 16, 
    borderRadius: 18, 
    marginBottom: 20, 
    gap: 8, 
    borderLeftWidth: 5, 
    borderLeftColor: colors.primary 
  },
  schedItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  schedTextMain: { fontSize: 16, fontWeight: '800', color: '#1E293B' },

  songList: { marginBottom: 20 },
  songLabel: { fontSize: 11, fontWeight: '900', color: colors.primary, marginBottom: 12, letterSpacing: 1 },
  songRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    padding: 10, 
    borderRadius: 12, 
    marginBottom: 8 
  },
  songNumber: { 
    width: 24, 
    height: 24, 
    backgroundColor: colors.primary, 
    borderRadius: 12, 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 12, 
    fontWeight: '800', 
    lineHeight: 24,
    marginRight: 12
  },
  songName: { fontSize: 14, fontWeight: '600', color: '#334155' },

  linkButton: { 
    backgroundColor: '#1E293B', 
    flexDirection: 'row', 
    padding: 14, 
    borderRadius: 14, 
    alignItems: 'center', 
    gap: 8,
    marginBottom: 15
  },
  linkText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  descText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', lineHeight: 18 },
  emptyText: { color: '#94A3B8', fontSize: 16, textAlign: 'center', marginTop: 50, width: '100%' }
});