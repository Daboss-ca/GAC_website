import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Image,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { 
  Users, 
  Megaphone, 
  Calendar, 
  ChevronRight, 
  User, 
  Music,
  Clock,
  Quote,
  Search, 
  X,
  Heart, // Added for LifeGroup icon
  TrendingUp
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Existing States
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [lineupCount, setLineupCount] = useState(0);

  // --- NEW LIFEGROUP STATES ---
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalLGMembers, setTotalLGMembers] = useState(0);

  // --- SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);

  // --- MAIN FETCH FUNCTION ---
  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users') 
          .select('full_name, avatar_url') 
          .eq('id', user.id)
          .single();

        if (userData) {
          setFullName(userData.full_name || "Member");
          setAvatarUrl(userData.avatar_url);
        }
      }

      const { data: count } = await supabase.rpc('get_user_count');
      setMemberCount(count || 0);

      const { data: allItems } = await supabase.from('announcements').select('*');
      if (allItems) {
        setAllData(allItems);
        setAnnouncementCount(allItems.filter(i => i.category === 'announcement').length);
        setEventCount(allItems.filter(i => i.category === 'event').length);
        setLineupCount(allItems.filter(i => i.category === 'song-lineup').length);
      }

      // --- FETCH LIFEGROUP INSIGHTS ---
      const { count: groupsCount } = await supabase.from('lifegroup_updates').select('*', { count: 'exact', head: true });
      const { data: lgMembers } = await supabase.from('lifegroup_members').select('id');
      
      setTotalGroups(groupsCount || 0);
      setTotalLGMembers(lgMembers?.length || 0);

    } catch (e) {
      console.log("Dashboard fetch error:", e);
    }
  };

  // --- SEARCH LOGIC ---
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = allData.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, allData]);

  const handleSuggestionPress = (item: any) => {
    setSearchQuery("");
    setSuggestions([]);
    if (item.category === 'announcement') router.push('/(tabs)/announcements');
    else if (item.category === 'event') router.push('/(tabs)/events');
    else if (item.category === 'song-lineup') router.push('/(tabs)/song-lineups');
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 15000); 
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={[styles.content, isMobile && { paddingHorizontal: 20 }]}>
        
        {/* --- HEADER --- */}
        <Pressable style={styles.header} onPress={() => router.push('/(tabs)/profile')}>
          <View style={styles.userRow}>
             <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <User size={18} color={colors.primary} />
                )}
             </View>
             <View>
                <Text style={styles.welcomeText}>
                  {fullName ? `Welcome back, \n${fullName}!` : "Welcome back!"}
                </Text>
             </View>
          </View>
          <Text style={styles.dashboardTitle}>Church Overview</Text>
        </Pressable>

        {/* --- SEARCH BAR --- */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarContainer}>
            <Search size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search announcements, events..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionBox}>
              {suggestions.map((item, index) => (
                <Pressable key={index} style={styles.suggestionItem} onPress={() => handleSuggestionPress(item)}>
                  <Clock size={14} color="#CBD5E1" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.suggestionCategory}>{item.category.replace('-', ' ').toUpperCase()}</Text>
                  </View>
                  <ChevronRight size={14} color="#CBD5E1" />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* --- QUICK INSIGHTS CARDS --- */}
        <View style={[styles.statsGrid, isMobile && { flexDirection: 'column' }]}>
          <Pressable 
            style={[styles.statCard, { backgroundColor: '#0F172A' }]}
            onPress={() => router.push('/(tabs)/members')}
          >
            <View style={styles.statIconCircle}>
              <Users size={20} color="#0F172A" />
            </View>
            <Text style={[styles.statValue, { color: '#fff' }]}>{memberCount}</Text>
            <Text style={[styles.statLabel, { color: '#94A3B8' }]}>REGISTERED USERS</Text>
          </Pressable>
          
          <View style={[styles.statCard, { backgroundColor: '#F1F5F9' }]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#fff' }]}>
              <Clock size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>9:00 AM</Text>
            <Text style={styles.statLabel}>SUNDAY SERVICE</Text>
          </View>
        </View>

        {/* --- NEW LIFEGROUP INSIGHTS SECTION --- */}
        <View style={styles.lgInsightSection}>
          <Text style={styles.sectionTitle}>LIFEGROUP INSIGHTS</Text>
          <Pressable 
            style={styles.lgInsightCard}
            onPress={() => router.push('/(tabs)/lifegroup')}
          >
            <View style={styles.lgMainRow}>
                <View style={styles.lgDataPoint}>
                    <Text style={styles.lgValue}>{totalGroups}</Text>
                    <Text style={styles.lgLabel}>Groups</Text>
                </View>
                <View style={styles.lgDivider} />
                <View style={styles.lgDataPoint}>
                    <Text style={styles.lgValue}>{totalLGMembers}</Text>
                    <Text style={styles.lgLabel}>Total Attendees</Text>
                </View>
                <View style={styles.lgIconBadge}>
                    <TrendingUp size={16} color="#FFF" />
                </View>
            </View>
            <View style={styles.lgFooter}>
                <Heart size={14} color={colors.primary} />
                <Text style={styles.lgFooterText}>make every believer a deciple maker.</Text>
            </View>
          </Pressable>
        </View>

        {/* --- UPDATES SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MINISTRY UPDATES</Text>
          <View style={styles.actionGrid}>
            <Pressable style={styles.actionItem} onPress={() => router.push('/(tabs)/announcements')}>
              <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Megaphone size={20} color="#059669" />
              </View>
              <Text style={styles.actionText}>Announcements</Text>
              {announcementCount > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{announcementCount}</Text></View>
              )}
              <ChevronRight size={16} color="#CBD5E1" />
            </Pressable>

            <Pressable style={styles.actionItem} onPress={() => router.push('/(tabs)/song-lineups')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Music size={20} color="#DC2626" />
              </View>
              <Text style={styles.actionText}>Worship Setlist</Text>
              {lineupCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#DC2626' }]}><Text style={styles.badgeText}>{lineupCount}</Text></View>
              )}
              <ChevronRight size={16} color="#CBD5E1" />
            </Pressable>

            <Pressable style={styles.actionItem} onPress={() => router.push('/(tabs)/events')}>
              <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Calendar size={20} color="#2563EB" />
              </View>
              <Text style={styles.actionText}>Church Events</Text>
              {eventCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#2563EB' }]}><Text style={styles.badgeText}>{eventCount}</Text></View>
              )}
              <ChevronRight size={16} color="#CBD5E1" />
            </Pressable>
          </View>
        </View>

        {/* --- MAIN OBJECTIVE --- */}
        <View style={styles.objectiveSection}>
          <Text style={styles.sectionTitle}>MAIN OBJECTIVE</Text>
          <View style={styles.objectiveCard}>
            <Quote size={24} color={colors.primary} style={{ opacity: 0.3, marginBottom: 10 }} />
            <Text style={styles.objectiveQuote}>"We're here to serve, not to be served."</Text>
            <View style={styles.objectiveLine} />
          </View>
        </View>

        {/* --- FOOTER VERSE --- */}
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>"Let everything that has breath praise the Lord."</Text>
          <Text style={styles.verseRef}>PSALM 150:6</Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 40, paddingVertical: 40 },
  header: { marginBottom: 25 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarContainer: { 
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#F1F5F9', 
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  welcomeText: { fontSize: 16, color: '#0F172A', fontWeight: '700' },
  dashboardTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', marginTop: 5 },
  
  // --- SEARCH ---
  searchSection: { marginBottom: 30, zIndex: 10 },
  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 16,
    paddingHorizontal: 15, height: 55,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B' },
  suggestionBox: {
    position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, zIndex: 1000, padding: 8,
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderRadius: 10 },
  suggestionTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  suggestionCategory: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },

  // --- STATS ---
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statCard: { flex: 1, padding: 25, borderRadius: 24 },
  statIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  statValue: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1, marginTop: 4 },

  // --- NEW LIFEGROUP INSIGHT STYLES ---
  lgInsightSection: { marginBottom: 35 },
  lgInsightCard: { 
    backgroundColor: '#fff', borderRadius: 24, padding: 20, 
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 8
  },
  lgMainRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  lgDataPoint: { flex: 1, alignItems: 'center' },
  lgValue: { fontSize: 24, fontWeight: '900', color: colors.primary },
  lgLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginTop: 2, textTransform: 'uppercase' },
  lgDivider: { width: 1, height: 30, backgroundColor: '#F1F5F9' },
  lgIconBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  lgFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  lgFooterText: { fontSize: 11, fontWeight: '600', color: '#64748B', fontStyle: 'italic' },

  // --- REMAINING STYLES ---
  section: { marginBottom: 35 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 15 },
  actionGrid: { gap: 12 },
  actionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  actionText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#334155' },
  badge: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  objectiveSection: { marginBottom: 40 },
  objectiveCard: { backgroundColor: '#F8FAFC', padding: 30, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  objectiveQuote: { fontSize: 20, fontWeight: '800', color: '#1E293B', textAlign: 'center', fontStyle: 'italic', lineHeight: 28 },
  objectiveLine: { width: 40, height: 3, backgroundColor: colors.primary, marginTop: 20, borderRadius: 2 },
  verseCard: { padding: 40, alignItems: 'center', marginBottom: 50 },
  verseText: { fontSize: 15, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' },
  verseRef: { fontSize: 10, fontWeight: '900', color: '#CBD5E1', marginTop: 12, letterSpacing: 2 }
});