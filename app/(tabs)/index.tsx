import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [memberCount, setMemberCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchCount = async () => {
        const { data } = await supabase.rpc('get_user_count');
        setMemberCount(data || 0);
      };
      fetchCount();
    }, [])
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        
        {/* --- HERO SECTION --- */}
        <View style={styles.heroSection}>
          <Text style={styles.churchName}>GREAT AWAKENING CHURCH</Text>
          <Text style={styles.heroHeadline}>
            A community built on faith, hope, and unconditional love.
          </Text>
          
        </View>

        {/* --- MISSION SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.label}>OUR MISSION</Text>
          <Text style={styles.bodyText}>
            (eample)
            To spread the gospel of Jesus Christ, making disciples of all nations, 
            and empowering every believer to serve with a heart of compassion 
            and excellence in every area of life.
          </Text>
        </View>

        {/* --- VISION SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.label}>OUR VISION</Text>
          <Text style={styles.bodyText}>
            (example)
            We envision a transformed generation united in spirit, 
            growing in the knowledge of God, and becoming a light 
            of hope to the broken and the lost.
          </Text>
        </View>

        {/* --- GOALS SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.label}>MINISTRY GOALS</Text>
          
          <View style={styles.goalItem}>
            <Text style={styles.goalTitle}>Spiritual Maturity</Text>
            <Text style={styles.goalDesc}>Make every believer to be a deciple maker.</Text>
          </View>

          <View style={styles.goalItem}>
            <Text style={styles.goalTitle}>Community Engagement</Text>
            <Text style={styles.goalDesc}>Being a catalyst for positive change through local outreach and support programs.</Text>
          </View>

          <View style={styles.goalItem}>
            <Text style={styles.goalTitle}>Holistic Development</Text>
            <Text style={styles.goalDesc}>Supporting the growth of the mind, body, and spirit of our church family.</Text>
          </View>
        </View>

        {/* --- STATS & ACTION --- */}
        <View style={styles.footer}>
          <Text style={styles.memberStat}>
            {memberCount} SOULS IN THE MINISTRY
          </Text>
          
          <Pressable onPress={() => router.push('/announcements')} style={styles.linkBtn}>
            <Text style={styles.linkText}>VIEW LATEST UPDATES —</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/members')} style={styles.linkBtn}>
            <Text style={styles.linkText}>MEET THE MINISTRY TEAM —</Text>
          </Pressable>
        </View>

        {/* --- VERSE --- */}
        <View style={styles.verseSection}>
          <Text style={styles.verseText}>
            "Let everything that has breath praise the Lord."
          </Text>
          <Text style={styles.verseRef}>PSALM 150:6</Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  content: { 
    paddingHorizontal: 30, 
    paddingVertical: 60 
  },
  
  // HERO
  heroSection: { 
    marginBottom: 60 
  },
  churchName: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: colors.primary, 
    letterSpacing: 4, 
    marginBottom: 15 
  },
  heroHeadline: { 
    fontSize: 32, 
    fontWeight: '300', 
    color: '#1A1A1A', 
    lineHeight: 42 
  },
  line: { 
    width: 40, 
    height: 2, 
    backgroundColor: '#000', 
    marginTop: 30 
  },

  // SECTIONS
  section: { 
    marginBottom: 50 
  },
  label: { 
    fontSize: 11, 
    fontWeight: '900', 
    color: '#A0A0A0', 
    letterSpacing: 2, 
    marginBottom: 15 
  },
  bodyText: { 
    fontSize: 18, 
    fontWeight: '400', 
    color: '#333333', 
    lineHeight: 28 
  },

  // GOALS
  goalItem: { 
    marginBottom: 25 
  },
  goalTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1A1A1A', 
    marginBottom: 4 
  },
  goalDesc: { 
    fontSize: 14, 
    color: '#666666', 
    lineHeight: 20 
  },

  // FOOTER / ACTIONS
  footer: { 
    marginTop: 40, 
    paddingTop: 40, 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0' 
  },
  memberStat: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#1A1A1A', 
    marginBottom: 25, 
    letterSpacing: 1 
  },
  linkBtn: { 
    marginBottom: 15 
  },
  linkText: { 
    fontSize: 13, 
    fontWeight: '900', 
    color: colors.primary 
  },

  // VERSE
  verseSection: { 
    marginTop: 60, 
    alignItems: 'center' 
  },
  verseText: { 
    fontSize: 15, 
    color: '#999999', 
    fontStyle: 'italic', 
    textAlign: 'center' 
  },
  verseRef: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: '#CCCCCC', 
    marginTop: 10, 
    letterSpacing: 2 
  }
});