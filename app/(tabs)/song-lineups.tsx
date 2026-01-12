import React, { useState, useCallback } from "react";
import { 
  View, Text, StyleSheet, ScrollView, 
  Pressable, ActivityIndicator, Linking, useWindowDimensions 
} from "react-native";
import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { useFocusEffect } from "expo-router";

// --- LUCIDE ICONS ---
import { 
  Music, 
  Youtube, 
  ExternalLink,
  ChevronRight
} from 'lucide-react-native';

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
    <View style={styles.container}>
      <View style={[styles.content, isMobile && { padding: 20 }]}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Song Lineups</Text>
            <Text style={styles.subtitle}>Scheduled Worship Setlists</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {lineups.length === 0 ? (
              <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No lineups posted yet.</Text>
              </View>
            ) : (
              <View style={styles.tableCard}>
                {/* TABLE HEADER */}
                {!isMobile && (
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 2 }]}>DATE & SERVICE</Text>
                    <Text style={[styles.th, { flex: 3 }]}>SONG SELECTIONS</Text>
                    <Text style={[styles.th, { flex: 1.5 }]}>CALL TIME</Text>
                    <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>LINK</Text>
                  </View>
                )}

                {/* TABLE ROWS */}
                {lineups.map((item) => (
                  <View key={item.id} style={[styles.tableRow, isMobile && styles.mobileRow]}>
                    
                    {/* Column 1: Date and Title */}
                    <View style={isMobile ? styles.mobileColFull : { flex: 2 }}>
                      <Text style={styles.dateLabel}>{item.target_date}</Text>
                      <Text style={styles.lineupTitle}>{item.title}</Text>
                    </View>

                    {/* Column 2: Songs */}
                    <View style={isMobile ? styles.mobileSongGrid : { flex: 3, paddingRight: 10 }}>
                      {[item.song_1, item.song_2, item.song_3, item.song_4].filter(Boolean).map((song, i) => (
                        <View key={i} style={styles.songPill}>
                          <Text style={styles.songNumber}>{i + 1}</Text>
                          <Text style={styles.songName} numberOfLines={1}>{song}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Column 3: Time */}
                    <View style={isMobile ? styles.mobileTimeRow : { flex: 1.5 }}>
                      <Text style={styles.timeText}>{item.target_time || "TBA"}</Text>
                      {item.description && <Text style={styles.descText}>{item.description}</Text>}
                    </View>

                    {/* Column 4: Action */}
                    <View style={isMobile ? styles.mobileActionRow : { flex: 1, alignItems: 'flex-end' }}>
                      {item.external_link ? (
                        <Pressable 
                          onPress={() => openLink(item.external_link)}
                          style={styles.actionBtn}
                        >
                          <Youtube size={16} color={colors.primary} />
                          {isMobile && <Text style={styles.actionBtnText}>Reference</Text>}
                        </Pressable>
                      ) : (
                        <View style={{ width: 30 }} />
                      )}
                    </View>

                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 40 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: "900", color: '#0F172A', letterSpacing: -1 },
  subtitle: { color: "#64748B", fontSize: 16, fontWeight: '500' },
  
  // TABLE STYLES
  tableCard: { 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  tableHeader: { 
    flexDirection: 'row', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  th: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#94A3B8', 
    letterSpacing: 1 
  },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F8FAFC', 
    alignItems: 'center' 
  },

  // COLUMN STYLES
  dateLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: colors.primary, 
    marginBottom: 4 
  },
  lineupTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  timeText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#64748B' 
  },
  descText: { 
    fontSize: 11, 
    color: '#94A3B8', 
    marginTop: 4, 
    fontStyle: 'italic' 
  },

  // SONG PILLS
  songPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4, 
    backgroundColor: '#F8FAFC', 
    padding: 6, 
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  songNumber: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: '#94A3B8', 
    width: 15 
  },
  songName: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#334155' 
  },

  actionBtn: { 
    padding: 10, 
    borderRadius: 12, 
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  // MOBILE ADAPTATION
  mobileRow: { 
    flexDirection: 'column', 
    alignItems: 'flex-start', 
    gap: 15,
    paddingVertical: 25
  },
  mobileColFull: { width: '100%' },
  mobileSongGrid: { width: '100%', marginTop: 5 },
  mobileTimeRow: { width: '100%', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 10 },
  mobileActionRow: { width: '100%', marginTop: 5 },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' }
});