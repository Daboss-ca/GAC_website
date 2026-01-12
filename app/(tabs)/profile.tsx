import { colors } from "@/constant/colors";
import { supabase } from "@/constant/supabase";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { Calendar, Edit2, Mail, MapPin, Phone, Save, User, Camera, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updatingInfo, setUpdatingInfo] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    age: "",
    address: "",
    phone: "",
    birthDate: "", 
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
        if (data) {
          // Safety: Check kung exist ang avatar_url
          const avatarUrl = data.avatar_url ? `${data.avatar_url}?t=${new Date().getTime()}` : null;
          
          setProfile({ ...data, avatar_url: avatarUrl });
          setForm({
            age: data.age?.toString() || "",
            address: data.address || "",
            phone: data.phone || "",
            birthDate: data.birth_date || "",
          });
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUpdatingAvatar(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // 2. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { 
          upsert: true, 
          contentType: blob.type 
        });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const cleanUrl = publicUrl.split('?')[0];

      // 4. Update Database
      const { error: dbError } = await supabase
        .from("users")
        .update({ avatar_url: cleanUrl })
        .eq("id", user.id);

      if (dbError) {
        console.error("Database Update Error:", dbError);
        throw new Error("Hindi ma-save ang link. Siguraduhin na may 'avatar_url' column sa users table.");
      }

      // 5. Update Local State
      setProfile((prev: any) => ({ 
        ...prev, 
        avatar_url: `${cleanUrl}?t=${new Date().getTime()}` 
      }));
      
      if (Platform.OS !== 'web') Alert.alert("Success", "Photo updated!");

    } catch (error: any) {
      console.error("Detailed Upload Error:", error);
      Alert.alert("Error", error.message || "Failed to upload image");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleUpdateInfo = async () => {
    setUpdatingInfo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        age: parseInt(form.age) || null,
        address: form.address,
        phone: form.phone,
        birth_date: form.birthDate,
      };

      const { error } = await supabase.from("users").update(payload).eq("id", user?.id);

      if (!error) {
        setProfile((prev: any) => ({ ...prev, ...payload }));
        setIsEditing(false);
        if (Platform.OS !== 'web') Alert.alert("Success", "Details saved!");
      } else {
        throw error;
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setUpdatingInfo(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setForm({ ...form, birthDate: selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(',', '') });
    }
  };

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <View style={styles.unifiedCard}>
          <View style={styles.headerInner}>
            <Pressable onPress={pickImage} disabled={updatingAvatar}>
              <View style={styles.avatarCircle}>
                {updatingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : profile?.avatar_url ? (
                  <Image 
                    key={profile.avatar_url}
                    source={{ uri: profile.avatar_url }} 
                    style={styles.avatarImage}
                    // @ts-ignore
                    crossOrigin="anonymous" 
                  />
                ) : (
                  <Text style={styles.avatarText}>{profile?.full_name?.charAt(0)}</Text>
                )}
                <View style={styles.cameraBadge}>
                  <Camera size={10} color="#fff" />
                </View>
              </View>
            </Pressable>
            
            <View style={styles.headerInfo}>
               <Text style={styles.userName}>{profile?.full_name || "Member Name"}</Text>
               <View style={styles.badge}><Text style={styles.badgeText}>{profile?.ministry?.toUpperCase() || "MINISTRY"}</Text></View>
               {updatingAvatar && <Text style={styles.updatingText}>Updating photo...</Text>}
            </View>
          </View>

          <View style={styles.dividerLarge} />

          <View style={styles.actionRow}>
            <Text style={styles.sectionTitle}>INFORMATIONS</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {isEditing && (
                <Pressable style={[styles.editBtn, {backgroundColor: '#EF4444'}]} onPress={() => setIsEditing(false)}>
                  <X size={14} color="#fff" />
                  <Text style={styles.editBtnText}>CANCEL</Text>
                </Pressable>
              )}
              <Pressable 
                style={[styles.editBtn, isEditing && {backgroundColor: colors.primary}]} 
                onPress={() => isEditing ? handleUpdateInfo() : setIsEditing(true)}
                disabled={updatingInfo}
              >
                {updatingInfo ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    {isEditing ? <Save size={14} color="#fff" /> : <Edit2 size={14} color="#fff" />}
                    <Text style={styles.editBtnText}>{isEditing ? "SAVE" : "EDIT INFO"}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.tableBody}>
            {/* ... (Dito yung User, Email, Birthday rows mo - parehas lang sila) ... */}
            <View style={styles.row}>
              <View style={styles.labelCol}><User size={14} color="#94A3B8" /><Text style={styles.labelText}>NAME</Text></View>
              <View style={styles.valueCol}><Text style={styles.staticText}>{profile?.full_name}</Text></View>
            </View>
            <View style={styles.row}>
              <View style={styles.labelCol}><Mail size={14} color="#94A3B8" /><Text style={styles.labelText}>EMAIL</Text></View>
              <View style={styles.valueCol}><Text style={styles.staticText}>{profile?.email}</Text></View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCol}><Calendar size={14} color={colors.primary} /><Text style={styles.labelText}>BIRTHDAY</Text></View>
              <View style={styles.valueCol}>
                {isEditing ? (
                  Platform.OS === 'web' ? (
                    <input title="date" type="date" style={webInputStyle} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                  ) : (
                    <Pressable onPress={() => setShowDatePicker(true)} style={styles.inputWrapper}>
                      <Text style={[styles.valueText, { color: colors.primary }]}>{form.birthDate || "Select Birthday"}</Text>
                    </Pressable>
                  )
                ) : <Text style={styles.valueText}>{form.birthDate || "---"}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCol}><Calendar size={14} color={colors.primary} /><Text style={styles.labelText}>AGE</Text></View>
              <View style={styles.valueCol}>
                {isEditing ? <TextInput style={styles.input} value={form.age} onChangeText={(t) => setForm({...form, age: t})} keyboardType="numeric" /> : <Text style={styles.valueText}>{form.age || "---"}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCol}><Phone size={14} color={colors.primary} /><Text style={styles.labelText}>PHONE</Text></View>
              <View style={styles.valueCol}>
                {isEditing ? <TextInput style={styles.input} value={form.phone} onChangeText={(t) => setForm({...form, phone: t})} keyboardType="phone-pad" /> : <Text style={styles.valueText}>{form.phone || "---"}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCol}><MapPin size={14} color={colors.primary} /><Text style={styles.labelText}>ADDRESS</Text></View>
              <View style={styles.valueCol}>
                {isEditing ? <TextInput style={styles.input} value={form.address} onChangeText={(t) => setForm({...form, address: t})} multiline /> : <Text style={styles.valueText}>{form.address || "---"}</Text>}
              </View>
            </View>
          </View>
        </View>

        {showDatePicker && Platform.OS !== 'web' && (
          <DateTimePicker value={new Date()} mode="date" display="default" onChange={onDateChange} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const webInputStyle = { 
  border: '1px solid #E2E8F0', borderRadius: '4px', padding: '8px', fontSize: '13px', color: '#0F172A', width: '100%', outline: 'none'
} as any;

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F8FAFC", paddingBottom: 40 },
  unifiedCard: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  headerInner: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#F1F5F9' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0F172A', padding: 5, borderRadius: 10, borderWidth: 2, borderColor: '#fff', zIndex: 10 },
  headerInfo: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#64748B' },
  updatingText: { fontSize: 10, color: colors.primary, marginTop: 4, fontWeight: '600' },
  dividerLarge: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  editBtnText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  tableBody: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F8FAFC', minHeight: 60 },
  labelCol: { width: 110, backgroundColor: '#FBFDFF', padding: 15, flexDirection: 'row', alignItems: 'center', gap: 8, borderRightWidth: 1, borderRightColor: '#F8FAFC' },
  labelText: { fontSize: 9, fontWeight: '800', color: '#94A3B8' },
  valueCol: { flex: 1, padding: 15, justifyContent: 'center' },
  valueText: { fontSize: 13, color: '#1E293B', fontWeight: '600' },
  staticText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  input: { fontSize: 13, color: colors.primary, fontWeight: '700', padding: 0 },
  inputWrapper: { width: '100%', minHeight: 40, justifyContent: 'center' }
});