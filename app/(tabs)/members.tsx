import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Platform, Modal, Alert, useWindowDimensions } from "react-native";
import { supabase } from "@/constant/supabase"; 
import { colors } from "@/constant/colors"; 
import { useFocusEffect, useRouter } from "expo-router"; 
import { X, Mail, Phone, Trash2, Check, RotateCcw, ChevronDown } from "lucide-react-native";

const INSTRUMENTS = ["Worship Leader", "Keyboardist", "Lead Guitarist", "Acoustic Guitarist", "Bassist", "Drummer", "Vocalist"];

export default function WorshipTeamScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const statusWidth = isMobile ? 65 : 120;
  const actionWidth = isMobile ? 85 : 140;

  const [dutyList, setDutyList] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Realtime & Delete States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  // Form State
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isNameOpen, setIsNameOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const isPtrs = currentUserProfile?.ministry === "Ptr's";
  const isSpecificAdmin = currentUserProfile?.email === "charlenemaearnuco@gmail.com" || currentUserProfile?.email === "chris.arnuco12@gmail.com";
  const canManageLineup = isPtrs || isSpecificAdmin;

  const getToday = () => new Date().toISOString().split('T')[0];

  // REALTIME LOGIC - Sinisiguro nitong laging updated ang listahan
  const refreshEverything = useCallback(async () => {
    await fetchUserData(); 
    await fetchDatesFromAnnouncements();
    await fetchDutyList();
  }, []);

  useFocusEffect(useCallback(() => { refreshEverything(); }, [refreshEverything]));

  useEffect(() => {
    const dutyChannel = supabase.channel('rt-duty')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_roster' }, (payload) => {
        console.log("Change received!", payload);
        fetchDutyList(); // Re-fetch kapag may nagbago sa database
      })
      .subscribe();
    return () => { supabase.removeChannel(dutyChannel); };
  }, []);

  const fetchDatesFromAnnouncements = async () => {
    const today = getToday();
    const { data } = await supabase.from("announcements").select("target_date").eq("category", "song-lineup").gte("target_date", today).order("target_date", { ascending: true });
    if (data) {
      const dates = Array.from(new Set(data.map(item => item.target_date))).filter(Boolean) as string[];
      setAvailableDates(dates);
      if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0]);
    }
  };

  const fetchDutyList = async () => {
    const { data } = await supabase.from('duty_roster').select('*').order('created_at', { ascending: false });
    if (data) setDutyList(data);
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (profile) setCurrentUserProfile(profile);
    }
    const { data: users } = await supabase.from('users').select('*');
    if (users) setRegisteredUsers(users);
    setLoading(false);
  };

  const addToDuty = async () => {
    if (!canManageLineup) return Alert.alert("Access Denied", "Admin only.");
    if (!selectedName || !selectedRole || !selectedDate) return Alert.alert("Required", "Please fill all fields.");
    const { error } = await supabase.from('duty_roster').insert([{ 
      full_name: selectedName, role: selectedRole, availability: 'Pending', service_date: selectedDate 
    }]);
    if (!error) { 
      setSelectedName(""); setSelectedRole(""); 
      // fetchDutyList() is handled by realtime subscription
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('duty_roster').update({ availability: newStatus }).eq('id', id);
    if (!error) { setOpenDropdownId(null); }
  };

  // DELETE WITH CONFIRMATION
  const executeDelete = async (id: string) => {
    const { error } = await supabase.from('duty_roster').delete().eq('id', id);
    if (!error) { setDeletingId(null); }
  };

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, !isMobile && { maxWidth: 1100, alignSelf: 'center', width: '100%' }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.titleText}>Worship Team Registry</Text>

        {/* --- ADD TO LINEUP FORM --- */}
        {canManageLineup && (
          <View style={[styles.schedulingBox, { zIndex: 10000 }]}>
            <Text style={styles.boxTitle}>ADD TO LINEUP (ADMIN ACCESS)</Text>
            <View style={[styles.formRow, isMobile && { flexDirection: 'column' }]}>
              {/* DATE PICKER */}
              <View style={styles.inputWrapper}>
                <Pressable style={styles.formDropdown} onPress={() => {setIsDateOpen(!isDateOpen); setIsNameOpen(false); setIsRoleOpen(false);}}>
                  <Text style={styles.selectedText} numberOfLines={1}>{selectedDate || "Select Date"}</Text>
                  <ChevronDown size={14} color="#64748B" />
                </Pressable>
                {isDateOpen && (
                  <View style={styles.floatingMenu}>
                    {availableDates.map(d => (
                      <Pressable key={d} style={styles.menuItem} onPress={() => { setSelectedDate(d); setIsDateOpen(false); }}><Text style={styles.menuItemText}>{d}</Text></Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* MEMBER PICKER */}
              <View style={styles.inputWrapper}>
                <Pressable style={styles.formDropdown} onPress={() => {setIsNameOpen(!isNameOpen); setIsDateOpen(false); setIsRoleOpen(false);}}>
                  <Text style={styles.selectedText} numberOfLines={1}>{selectedName || "Select Member"}</Text>
                  <ChevronDown size={14} color="#64748B" />
                </Pressable>
                {isNameOpen && (
                  <View style={styles.floatingMenu}>
                    <ScrollView style={{maxHeight: 200}} nestedScrollEnabled>
                      {registeredUsers.map((u, i) => (
                        <Pressable key={i} style={styles.menuItem} onPress={() => { setSelectedName(u.full_name); setIsNameOpen(false); }}><Text style={styles.menuItemText}>{u.full_name}</Text></Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* ROLE PICKER */}
              <View style={styles.inputWrapper}>
                <Pressable style={styles.formDropdown} onPress={() => {setIsRoleOpen(!isRoleOpen); setIsDateOpen(false); setIsNameOpen(false);}}>
                  <Text style={styles.selectedText} numberOfLines={1}>{selectedRole || "Select Role"}</Text>
                  <ChevronDown size={14} color="#64748B" />
                </Pressable>
                {isRoleOpen && (
                  <View style={styles.floatingMenu}>
                    {INSTRUMENTS.map(role => (
                      <Pressable key={role} style={styles.menuItem} onPress={() => { setSelectedRole(role); setIsRoleOpen(false); }}><Text style={styles.menuItemText}>{role}</Text></Pressable>
                    ))}
                  </View>
                )}
              </View>

              <Pressable style={[styles.addBtn, {backgroundColor: colors.primary}, isMobile && { height: 45 }]} onPress={addToDuty}>
                <Text style={styles.addBtnText}>ADD TO LINEUP</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* --- TEAM LIST TABLE --- */}
        {availableDates.map((date) => {
          const members = dutyList.filter(d => d.service_date === date);
          if (members.length === 0) return null; 
          return (
            <View key={date} style={styles.dateSection}>
              <View style={styles.dateHeaderLabel}><Text style={styles.dateHeaderText}>{date}</Text></View>
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={styles.thName}>MEMBER</Text>
                  <Text style={[styles.thStatus, { width: statusWidth }]}>STATUS</Text>
                  <Text style={[styles.thAction, { width: actionWidth }]}>ACTION</Text>
                </View>

                {members.map((item) => {
                    const isOpen = openDropdownId === item.id;
                    const isConfirmingDelete = deletingId === item.id;
                    const userMatch = registeredUsers.find(u => u.full_name === item.full_name);
                    const avatarUri = userMatch?.avatar_url;

                    return (
                      <View key={item.id} style={[styles.tableRow, isOpen && { zIndex: 999 }, isConfirmingDelete && {backgroundColor: '#FFF1F2'}]}>
                        {/* Name Col */}
                        <Pressable style={styles.nameCol} onPress={() => {
                            const user = registeredUsers.find(u => u.full_name === item.full_name);
                            if(user) { setSelectedUserProfile(user); setIsProfileModalVisible(true); }
                        }}>
                          <View style={[styles.avatarWrapper, isMobile && { width: 28, height: 28 }]}>
                            {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarMiniImage} /> : <View style={styles.avatarInitialBox}><Text style={styles.avatarInitialText}>{item.full_name[0]}</Text></View>}
                          </View>
                          <View style={styles.nameTextWrapper}>
                            <Text style={[styles.memberName, { fontSize: isMobile ? 10 : 14 }]} numberOfLines={1}>{item.full_name}</Text>
                            <Text style={[styles.roleSubtext, { fontSize: isMobile ? 8 : 11 }]} numberOfLines={1}>{item.role}</Text>
                          </View>
                        </Pressable>

                        {/* Status Col */}
                        <View style={[styles.statusCol, { width: statusWidth }]}>
                          <Text style={[styles.statusLabel, { color: item.availability === 'Available' ? '#16A34A' : item.availability === 'Unavailable' ? '#DC2626' : '#94A3B8', fontSize: isMobile ? 8 : 12 }]}>
                            {item.availability.toUpperCase()}
                          </Text>
                        </View>

                        {/* Action Col with Confirmation */}
                        <View style={[styles.actionCol, { width: actionWidth }]}>
                          {isConfirmingDelete ? (
                            <View style={styles.actionGroup}>
                              <Pressable onPress={() => executeDelete(item.id)} style={[styles.confirmBtn, {backgroundColor: '#16A34A'}]}><Check size={12} color="#FFF" /></Pressable>
                              <Pressable onPress={() => setDeletingId(null)} style={[styles.confirmBtn, {backgroundColor: '#94A3B8'}]}><RotateCcw size={12} color="#FFF" /></Pressable>
                            </View>
                          ) : (
                            <View style={styles.actionGroup}>
                              {item.full_name === currentUserProfile?.full_name && (
                                  <View>
                                      <Pressable onPress={() => setOpenDropdownId(isOpen ? null : item.id)} style={styles.editBtn}>
                                          <Text style={[styles.editBtnText, { fontSize: isMobile ? 8 : 11 }]}>{isOpen ? "X" : "EDIT"}</Text>
                                      </Pressable>
                                      {isOpen && (
                                          <View style={styles.tableFloatingMenu}>
                                              <Pressable style={styles.menuItem} onPress={() => updateStatus(item.id, 'Available')}><Text style={styles.menuItemText}>AVAILABLE</Text></Pressable>
                                              <Pressable style={styles.menuItem} onPress={() => updateStatus(item.id, 'Unavailable')}><Text style={styles.menuItemText}>UNAVAILABLE</Text></Pressable>
                                          </View>
                                      )}
                                  </View>
                              )}
                              {canManageLineup && (
                                  <Pressable onPress={() => setDeletingId(item.id)} style={styles.deleteBtn}>
                                      <Trash2 size={isMobile ? 12 : 16} color="#DC2626" />
                                  </Pressable>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    )
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 15 },
  titleText: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 20 },
  schedulingBox: { padding: 15, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 25, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, elevation: 3 },
  boxTitle: { fontSize: 10, fontWeight: '800', color: colors.primary, marginBottom: 12 },
  formRow: { flexDirection: 'row', gap: 10 },
  inputWrapper: { flex: 1, position: 'relative' },
  formDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F8FAFC', height: 45 },
  selectedText: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  floatingMenu: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, zIndex: 10001, elevation: 5 },
  menuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuItemText: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  addBtn: { paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '800', fontSize: 11 },

  dateSection: { marginBottom: 30 },
  dateHeaderLabel: { backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  dateHeaderText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  tableCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  thName: { flex: 1, fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  thStatus: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textAlign: 'center' },
  thAction: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textAlign: 'right' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  nameCol: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statusCol: { alignItems: 'center', justifyContent: 'center' },
  actionCol: { alignItems: 'flex-end' },
  avatarWrapper: { width: 34, height: 34, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  avatarMiniImage: { width: '100%', height: '100%' },
  avatarInitialBox: { width: '100%', height: '100%', backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitialText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  nameTextWrapper: { marginLeft: 10, flex: 1 },
  memberName: { fontWeight: '700', color: '#1E293B' },
  roleSubtext: { color: '#64748B' },
  statusLabel: { fontWeight: '900' },
  actionGroup: { flexDirection: 'row', gap: 6 },
  editBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  editBtnText: { fontWeight: '800', color: '#475569' },
  deleteBtn: { padding: 6, borderRadius: 6, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' },
  confirmBtn: { padding: 6, borderRadius: 6, width: 30, alignItems: 'center' },
  tableFloatingMenu: { position: 'absolute', top: 35, right: 0, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, zIndex: 1000, width: 130, elevation: 10 },
});