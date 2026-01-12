import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Platform, Modal, Alert } from "react-native";
import { supabase } from "@/constant/supabase"; 
import { colors } from "@/constant/colors"; 
import { useFocusEffect, useRouter } from "expo-router"; 
import { X, Mail, Phone, Calendar, MapPin, Trash2, Check, RotateCcw } from "lucide-react-native";

const INSTRUMENTS = ["Worship Leader", "Keyboardist", "Lead Guitarist", "Acoustic Guitarist", "Bassist", "Drummer", "Vocalist"];

export default function WorshipTeamScreen() {
  const router = useRouter();
  const [dutyList, setDutyList] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // States para sa Inline Deletion at Loading
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // States para sa Profile Modal
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  // States para sa Lineup Form
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isNameOpen, setIsNameOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // ADMIN ACCESS LOGIC
  const isPtrs = currentUserProfile?.ministry === "Ptr's";
  const isSpecificAdmin = currentUserProfile?.email === "charlenemaearnuco@gmail.com" || currentUserProfile?.email === "chris.arnuco12@gmail.com";
  const canManageLineup = isPtrs || isSpecificAdmin;

  const getToday = () => new Date().toISOString().split('T')[0];

  const refreshEverything = useCallback(async () => {
    await fetchUserData(); 
    await fetchDatesFromAnnouncements();
    await fetchDutyList();
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      refreshEverything();
    }, [refreshEverything])
  );

  useEffect(() => {
    const dutyChannel = supabase.channel('rt-duty')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_roster' }, () => {
        refreshEverything(); 
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
    if (users) {
      const updatedUsers = users.map(u => ({
        ...u,
        avatar_url: u.avatar_url ? `${u.avatar_url}?t=${new Date().getTime()}` : null
      }));
      setRegisteredUsers(updatedUsers);
    }
    setLoading(false);
  };

  const handleMemberClick = (fullName: string) => {
    if (fullName === currentUserProfile?.full_name) {
      router.push("/profile");
    } else {
      const user = registeredUsers.find(u => u.full_name === fullName);
      if (user) {
        setSelectedUserProfile(user);
        setIsProfileModalVisible(true);
      }
    }
  };

  const addToDuty = async () => {
    if (!canManageLineup) return Alert.alert("Access Denied", "Admin only.");
    if (!selectedName || !selectedRole || !selectedDate) return Alert.alert("Required", "Please fill all fields.");
    const { error } = await supabase.from('duty_roster').insert([{ 
      full_name: selectedName, 
      role: selectedRole, 
      availability: 'Pending', 
      service_date: selectedDate 
    }]);
    if (!error) { 
      setSelectedName(""); setSelectedRole(""); setIsNameOpen(false); setIsRoleOpen(false);
      refreshEverything(); 
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('duty_roster').update({ availability: newStatus }).eq('id', id);
    if (!error) { setOpenDropdownId(null); fetchDutyList(); }
  };

  // EXECUTE DELETE WITH SKELETON
  const executeDelete = async (id: string) => {
    setIsProcessingId(id); // Simulan ang Skeleton Loading
    const { error } = await supabase.from('duty_roster').delete().eq('id', id);
    
    if (!error) {
        setTimeout(() => { // Konting delay para sa visual effect
            setDeletingId(null);
            setIsProcessingId(null);
            refreshEverything();
        }, 600);
    } else {
        setIsProcessingId(null);
        Alert.alert("Error", "Could not delete entry.");
    }
  };

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.titleText}>Worship Team Registry</Text>

        {canManageLineup && (
          <View style={[styles.schedulingBox, { zIndex: 10000 }]}>
            <Text style={styles.boxTitle}>ADD TO LINEUP (ADMIN ACCESS)</Text>
            <View style={styles.formRow}>
              {/* DATE DROPDOWN */}
              <View style={[styles.dropdownWrapper, { zIndex: isDateOpen ? 1000 : 1 }]}>
                <Pressable style={styles.formDropdown} onPress={() => {setIsDateOpen(!isDateOpen); setIsNameOpen(false); setIsRoleOpen(false);}}>
                  <Text style={styles.selectedText}>{selectedDate || "Date"}</Text>
                </Pressable>
                {isDateOpen && (
                  <View style={styles.floatingMenu}>
                    {availableDates.map(d => (
                      <Pressable key={d} style={styles.menuItem} onPress={() => { setSelectedDate(d); setIsDateOpen(false); }}>
                        <Text style={styles.menuItemText}>{d}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* MEMBER DROPDOWN */}
              <View style={[styles.dropdownWrapper, { zIndex: isNameOpen ? 1000 : 1 }]}>
                <Pressable style={styles.formDropdown} onPress={() => {setIsNameOpen(!isNameOpen); setIsDateOpen(false); setIsRoleOpen(false);}}>
                  <Text style={styles.selectedText}>{selectedName || "Member"}</Text>
                </Pressable>
                {isNameOpen && (
                  <View style={styles.floatingMenu}>
                    <ScrollView style={{maxHeight: 150}} nestedScrollEnabled>
                      {registeredUsers.map((u, i) => (
                        <Pressable key={i} style={styles.menuItem} onPress={() => { setSelectedName(u.full_name); setIsNameOpen(false); }}>
                          <Text style={styles.menuItemText}>{u.full_name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* ROLE DROPDOWN */}
              <View style={[styles.dropdownWrapper, { zIndex: isRoleOpen ? 1000 : 1 }]}>
                <Pressable style={styles.formDropdown} onPress={() => {setIsRoleOpen(!isRoleOpen); setIsDateOpen(false); setIsNameOpen(false);}}>
                  <Text style={styles.selectedText}>{selectedRole || "Role"}</Text>
                </Pressable>
                {isRoleOpen && (
                  <View style={styles.floatingMenu}>
                    {INSTRUMENTS.map(role => (
                      <Pressable key={role} style={styles.menuItem} onPress={() => { setSelectedRole(role); setIsRoleOpen(false); }}>
                        <Text style={styles.menuItemText}>{role}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              <Pressable style={[styles.addBtn, {backgroundColor: colors.primary}]} onPress={addToDuty}>
                <Text style={styles.addBtnText}>ADD</Text>
              </Pressable>
            </View>
          </View>
        )}

        {availableDates.map((date) => {
          const members = dutyList.filter(d => d.service_date === date);
          if (members.length === 0) return null; 
          return (
            <View key={date} style={styles.dateSection}>
              <View style={styles.dateHeaderLabel}><Text style={styles.dateHeaderText}>{date}</Text></View>
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 3 }]}>TEAM MEMBER</Text>
                  <Text style={[styles.th, { flex: 2, textAlign: 'center' }]}>STATUS</Text>
                  <Text style={[styles.th, { flex: 1.8, textAlign: 'right' }]}>ACTION</Text>
                </View>
                {members.map((item) => {
                    const isOpen = openDropdownId === item.id;
                    const isConfirmingDelete = deletingId === item.id;
                    const isBeingDeleted = isProcessingId === item.id;
                    const userMatch = registeredUsers.find(u => u.full_name === item.full_name);
                    const avatarUri = userMatch?.avatar_url;

                    // SKELETON UI STATE
                    if (isBeingDeleted) {
                        return (
                            <View key={item.id} style={[styles.tableRow, styles.skeletonRow]}>
                                <View style={{flex: 3, flexDirection: 'row', alignItems: 'center'}}>
                                    <View style={styles.skeletonAvatar} />
                                    <View style={{marginLeft: 10, flex: 1}}>
                                        <View style={styles.skeletonTextLong} />
                                        <View style={styles.skeletonTextShort} />
                                    </View>
                                </View>
                                <View style={{flex: 2, alignItems: 'center'}}><View style={styles.skeletonBadge} /></View>
                                <View style={{flex: 1.8, alignItems: 'flex-end'}}><ActivityIndicator size="small" color="#DC2626" /></View>
                            </View>
                        );
                    }

                    return (
                      <View key={item.id} style={[
                        styles.tableRow, 
                        isOpen && { zIndex: 100 },
                        isConfirmingDelete && { backgroundColor: '#FFF1F2' }
                      ]}>
                        
                        <Pressable 
                          style={{flex: 3, flexDirection: 'row', alignItems: 'center'}}
                          onPress={() => handleMemberClick(item.full_name)}
                        >
                          <View style={styles.avatarMiniFrame}>
                            {avatarUri ? (
                              <Image source={{ uri: avatarUri }} style={styles.avatarMiniImage} resizeMode="cover" />
                            ) : (
                              <View style={styles.avatarInitialBox}>
                                <Text style={styles.avatarInitialText}>{item.full_name ? item.full_name[0] : '?'}</Text>
                              </View>
                            )}
                          </View>
                          <View style={{marginLeft: 10, flex: 1}}>
                            <Text style={styles.memberName} numberOfLines={1}>{item.full_name}</Text>
                            <Text style={styles.roleSubtext}>{item.role}</Text>
                          </View>
                        </Pressable>

                        <View style={{flex: 2, alignItems: 'center'}}>
                          {isConfirmingDelete ? (
                            <Text style={styles.confirmDeleteText}>REMOVE?</Text>
                          ) : (
                            <Text style={[styles.statusLabel, { color: item.availability === 'Available' ? '#16A34A' : item.availability === 'Unavailable' ? '#DC2626' : '#94A3B8' }]}>
                              {item.availability.toUpperCase()}
                            </Text>
                          )}
                        </View>

                        <View style={{flex: 1.8, flexDirection: 'row', justifyContent: 'flex-end', gap: 6}}>
                          {isConfirmingDelete ? (
                            <View style={{flexDirection: 'row', gap: 6}}>
                                <Pressable onPress={() => executeDelete(item.id)} style={styles.confirmBtn}>
                                    <Check size={14} color="#FFF" />
                                </Pressable>
                                <Pressable onPress={() => setDeletingId(null)} style={styles.cancelBtn}>
                                    <RotateCcw size={14} color="#475569" />
                                </Pressable>
                            </View>
                          ) : (
                            <>
                                {item.full_name === currentUserProfile?.full_name && (
                                    <View>
                                        <Pressable onPress={() => setOpenDropdownId(isOpen ? null : item.id)} style={styles.editBtn}>
                                            <Text style={styles.editBtnText}>{isOpen ? "X" : "EDIT"}</Text>
                                        </Pressable>
                                        {isOpen && (
                                            <View style={styles.tableFloatingMenu}>
                                                <Pressable style={styles.menuItem} onPress={() => updateStatus(item.id, 'Available')}>
                                                    <Text style={[styles.menuItemText, {color: '#16A34A'}]}>AVAILABLE</Text>
                                                </Pressable>
                                                <Pressable style={styles.menuItem} onPress={() => updateStatus(item.id, 'Unavailable')}>
                                                    <Text style={[styles.menuItemText, {color: '#DC2626'}]}>UNAVAILABLE</Text>
                                                </Pressable>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {canManageLineup && (
                                    <Pressable 
                                        onPress={() => { setDeletingId(item.id); setOpenDropdownId(null); }} 
                                        style={[styles.editBtn, {borderColor: '#FEE2E2', backgroundColor: '#FEF2F2'}]}
                                    >
                                        <Trash2 size={12} color="#DC2626" />
                                    </Pressable>
                                )}
                            </>
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

      {/* --- PROFILE INFORMATION MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={isProfileModalVisible} onRequestClose={() => setIsProfileModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Information</Text>
              <Pressable onPress={() => setIsProfileModalVisible(false)}><X size={20} color="#64748B" /></Pressable>
            </View>
            <View style={styles.modalProfileContent}>
              <View style={styles.modalAvatarCircle}>
                 {selectedUserProfile?.avatar_url ? (
                   <Image source={{ uri: selectedUserProfile.avatar_url }} style={styles.modalAvatarImg} resizeMode="cover" />
                 ) : ( <Text style={styles.modalAvatarInitial}>{selectedUserProfile?.full_name?.charAt(0)}</Text> )}
              </View>
              <Text style={styles.modalName}>{selectedUserProfile?.full_name}</Text>
              <View style={styles.modalBadge}><Text style={styles.modalBadgeText}>{selectedUserProfile?.ministry?.toUpperCase()}</Text></View>
            </View>
            <View style={styles.modalInfoList}>
              <InfoRow icon={<Mail size={14} color={colors.primary} />} label="EMAIL" value={selectedUserProfile?.email} />
              <InfoRow icon={<Phone size={14} color={colors.primary} />} label="PHONE" value={selectedUserProfile?.phone || "N/A"} />
              <InfoRow icon={<Calendar size={14} color={colors.primary} />} label="BIRTHDAY" value={selectedUserProfile?.birth_date || "N/A"} />
              <InfoRow icon={<MapPin size={14} color={colors.primary} />} label="ADDRESS" value={selectedUserProfile?.address || "N/A"} />
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setIsProfileModalVisible(false)}><Text style={styles.closeBtnText}>CLOSE</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const InfoRow = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <View style={styles.modalRow}>
    <View style={styles.modalLabelGroup}>{icon}<Text style={styles.modalLabelText}>{label}</Text></View>
    <Text style={styles.modalValueText} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20 },
  titleText: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 20 },
  schedulingBox: { padding: 15, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: colors.primary, marginBottom: 25, borderStyle: 'dashed' },
  boxTitle: { fontSize: 9, fontWeight: '800', color: colors.primary, marginBottom: 10 },
  formRow: { flexDirection: 'row', gap: 6 },
  dropdownWrapper: { flex: 1, position: 'relative' },
  formDropdown: { borderWidth: 1, borderColor: '#E2E8F0', padding: 10, borderRadius: 8, backgroundColor: '#F8FAFC', height: 40, justifyContent: 'center' },
  selectedText: { fontSize: 10, fontWeight: '700' },
  floatingMenu: { position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, zIndex: 9999, elevation: 5 },
  menuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuItemText: { fontSize: 11, fontWeight: '700' },
  addBtn: { paddingHorizontal: 15, borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  dateSection: { marginBottom: 30 },
  dateHeaderLabel: { backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  dateHeaderText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  tableCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  th: { fontSize: 9, fontWeight: '800', color: '#94A3B8' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center', backgroundColor: '#FFF' },
  avatarMiniFrame: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1F5F9', overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  avatarMiniImage: { width: '100%', height: '100%' },
  avatarInitialBox: { width: '100%', height: '100%', backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitialText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  memberName: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  roleSubtext: { fontSize: 10, color: '#64748B' },
  statusLabel: { fontSize: 10, fontWeight: '900' },
  editBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  editBtnText: { fontSize: 9, fontWeight: '800', color: '#475569' },
  tableFloatingMenu: { position: 'absolute', top: 35, right: 0, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, zIndex: 150, width: 140, elevation: 10 },
  
  // DELETE & SKELETON STYLES
  confirmDeleteText: { fontSize: 9, fontWeight: '900', color: '#DC2626' },
  confirmBtn: { backgroundColor: '#DC2626', padding: 8, borderRadius: 8 },
  cancelBtn: { backgroundColor: '#E2E8F0', padding: 8, borderRadius: 8 },
  skeletonRow: { opacity: 0.6, backgroundColor: '#F1F5F9' },
  skeletonAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E2E8F0' },
  skeletonTextLong: { width: '80%', height: 10, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 6 },
  skeletonTextShort: { width: '40%', height: 8, backgroundColor: '#E2E8F0', borderRadius: 4 },
  skeletonBadge: { width: 50, height: 12, backgroundColor: '#E2E8F0', borderRadius: 10 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8' },
  modalProfileContent: { alignItems: 'center', marginBottom: 25 },
  modalAvatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 12 },
  modalAvatarImg: { width: '100%', height: '100%' },
  modalAvatarInitial: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  modalName: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  modalBadgeText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  modalInfoList: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 15, gap: 15 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalLabelText: { fontSize: 9, fontWeight: '800', color: '#94A3B8' },
  modalValueText: { fontSize: 13, fontWeight: '700', color: '#1E293B', flex: 1, textAlign: 'right', marginLeft: 20 },
  closeBtn: { backgroundColor: '#0F172A', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  closeBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' }
});