import React, { useEffect, useState, useCallback } from "react";
import { 
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, 
  ActivityIndicator, useWindowDimensions, Modal,
  KeyboardAvoidingView, Platform, RefreshControl, FlatList 
} from "react-native";
import { supabase } from "@/constant/supabase";
import { colors } from "@/constant/colors";
import { useFocusEffect } from "expo-router";
import { Plus, Trash2, X, Users, UserPlus, AlertCircle, CheckCircle2, Undo2 } from "lucide-react-native";

export default function LifeGroupScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // INLINE STATUS STATES
  const [formStatus, setFormStatus] = useState<{msg: string, type: 'error' | 'success' | null}>({ msg: "", type: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // MAIN MODAL STATES
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [agenda, setAgenda] = useState("");
  const [saving, setSaving] = useState(false);

  // MEMBERS MODAL STATES
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [newMemberName, setNewMemberName] = useState("");

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('ministry').eq('id', user.id).single();
        setIsAdmin(data?.ministry === "LifeGroup Leader");
      }
    } catch (error) { console.error(error); }
  };

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('lifegroup_updates')
        .select(`*, lifegroup_members (count)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) { console.error(error.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { checkUserRole(); fetchRecords(); }, []));

  const handleSaveRecord = async () => {
    setFormStatus({ msg: "", type: null });
    if (!groupName || !leaderName) {
      return setFormStatus({ msg: "Please fill up required fields.", type: 'error' });
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.from('lifegroup_updates').insert([
        { group_name: groupName, leader_name: leaderName, description: agenda }
      ]);
      if (error) throw error;
      
      setFormStatus({ msg: "Saved successfully!", type: 'success' });
      setTimeout(() => { resetForm(); fetchRecords(); }, 1200);
    } catch (error: any) {
      setFormStatus({ msg: error.message, type: 'error' });
    } finally { setSaving(false); }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from('lifegroup_updates').delete().eq('id', id);
      if (error) throw error;
      setDeletingId(null);
      fetchRecords();
    } catch (error: any) { console.error(error.message); }
  };

  const resetForm = () => {
    setGroupName(""); setLeaderName(""); setAgenda(""); 
    setFormStatus({ msg: "", type: null });
    setIsModalVisible(false);
  };

  const fetchMembers = async (groupId: string) => {
    const { data, error } = await supabase
      .from('lifegroup_members')
      .select('*')
      .eq('group_id', groupId)
      .order('full_name', { ascending: true });
    if (!error) setMembers(data || []);
  };

  const addMember = async () => {
    if (!newMemberName || !selectedGroupId) return;
    const { error } = await supabase.from('lifegroup_members').insert([{ group_id: selectedGroupId, full_name: newMemberName }]);
    if (!error) { setNewMemberName(""); fetchMembers(selectedGroupId); fetchRecords(); }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase.from('lifegroup_members').delete().eq('id', id);
      if (error) throw error;
      setDeletingMemberId(null);
      fetchMembers(selectedGroupId!);
      fetchRecords();
    } catch (error: any) { console.error(error.message); }
  };

  if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View><Text style={styles.title}>Lifegroup Attendance</Text><Text style={styles.subtitle}>Ministry Logs</Text></View>
        {isAdmin && (
          <Pressable style={styles.addBtn} onPress={() => setIsModalVisible(true)}>
            <Plus size={22} color="#FFF" />
          </Pressable>
        )}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchRecords} />} contentContainerStyle={styles.content}>
        {records.map((item) => (
          <View key={item.id} style={styles.recordCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupText}>{item.group_name}</Text>
                <Text style={styles.leaderText}>Leader: {item.leader_name}</Text>
              </View>
              {isAdmin && (
                <View style={styles.actionRow}>
                  {deletingId === item.id ? (
                    <View style={styles.confirmDeleteRow}>
                      <Pressable onPress={() => setDeletingId(null)} style={styles.cancelDelBtn}><Undo2 size={16} color="#E11D48" /></Pressable>
                      <Pressable onPress={() => handleDeleteRecord(item.id)} style={styles.confirmDelBtn}><Trash2 size={16} color="#FFF" /></Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.deleteBtn} onPress={() => setDeletingId(item.id)}>
                      <Trash2 size={18} color="#FDA4AF" />
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            <View style={styles.agendaSection}>
              <Text style={styles.agendaLabel}>AGENDA</Text>
              <Text style={styles.agendaText}>{item.description || "No agenda details provided."}</Text>
            </View>

            <View style={styles.cardFooter}>
              <Pressable style={styles.memberBadge} onPress={() => { setSelectedGroupId(item.id); fetchMembers(item.id); setIsMemberModalVisible(true); }}>
                <Users size={14} color={colors.primary} />
                <Text style={styles.badgeText}>{item.lifegroup_members?.[0]?.count || 0} Members</Text>
              </Pressable>
              <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL: ADD RECORD */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>New LifeGroup Log</Text><Pressable onPress={resetForm}><X size={24} color="#000" /></Pressable></View>
            
            {formStatus.msg ? (
              <View style={[styles.inlineStatus, formStatus.type === 'error' ? styles.statusError : styles.statusSuccess]}>
                {formStatus.type === 'error' ? <AlertCircle size={16} color="#ef4444" /> : <CheckCircle2 size={16} color="#22c55e" />}
                <Text style={[styles.statusMsg, { color: formStatus.type === 'error' ? "#ef4444" : "#22c55e" }]}>{formStatus.msg}</Text>
              </View>
            ) : null}

            <TextInput style={styles.input} placeholder="Group Name" value={groupName} onChangeText={setGroupName} />
            <TextInput style={styles.input} placeholder="Leader Name" value={leaderName} onChangeText={setLeaderName} />
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="What was the agenda?" multiline value={agenda} onChangeText={setAgenda} />
            
            <Pressable style={styles.saveBtn} onPress={handleSaveRecord} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Record</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: MEMBERS */}
      <Modal visible={isMemberModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attendance List</Text>
              <Pressable onPress={() => { setIsMemberModalVisible(false); setDeletingMemberId(null); }}><X size={24} color="#000" /></Pressable>
            </View>
            {isAdmin && (
              <View style={styles.addMemberBox}>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Name" value={newMemberName} onChangeText={setNewMemberName} />
                  <Pressable style={styles.smallAddBtn} onPress={addMember}><UserPlus size={20} color="#FFF" /></Pressable>
              </View>
            )}
            <FlatList data={members} keyExtractor={(m) => m.id} renderItem={({ item }) => (
                <View style={styles.memberItem}>
                    <Text style={styles.memberName}>{item.full_name}</Text>
                    {isAdmin && (
                      <View>
                        {deletingMemberId === item.id ? (
                          <View style={styles.memberConfirmBox}>
                            <Pressable onPress={() => setDeletingMemberId(null)} style={styles.memberCancelBtn}><X size={14} color="#64748B" /></Pressable>
                            <Pressable onPress={() => deleteMember(item.id)} style={styles.memberDeleteConfirmBtn}><Trash2 size={14} color="#FFF" /></Pressable>
                          </View>
                        ) : (
                          <Pressable onPress={() => setDeletingMemberId(item.id)} style={styles.memberDelBtn}><Trash2 size={16} color="#FDA4AF" /></Pressable>
                        )}
                      </View>
                    )}
                </View>
            )} ListEmptyComponent={<Text style={styles.emptyText}>No members yet.</Text>} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerMobile: { padding: 20, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 11, color: '#94A3B8', fontWeight: '800' },
  addBtn: { backgroundColor: colors.primary, width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 15 },
  
  recordCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  groupText: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  leaderText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  
  // INLINE DELETE STYLES (Records)
  actionRow: { minWidth: 40, alignItems: 'flex-end' },
  confirmDeleteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 5, borderRadius: 10, borderWidth: 1, borderColor: '#FEE2E2' },
  cancelDelBtn: { padding: 4 },
  confirmDelBtn: { backgroundColor: '#E11D48', padding: 8, borderRadius: 8 },
  deleteBtn: { padding: 10, backgroundColor: '#FFF1F2', borderRadius: 12 },

  agendaSection: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  agendaLabel: { fontSize: 10, fontWeight: '900', color: colors.primary, marginBottom: 4 },
  agendaText: { fontSize: 14, color: '#475569', lineHeight: 20 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F9FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  dateText: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 25, padding: 25, width: '90%', maxWidth: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  
  inlineStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1 },
  statusError: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  statusSuccess: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  statusMsg: { fontSize: 13, fontWeight: '700' },

  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', fontWeight: '600' },
  saveBtn: { backgroundColor: colors.primary, padding: 18, borderRadius: 15, alignItems: 'center', minHeight: 55, justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },

  // MEMBER LIST STYLES
  addMemberBox: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  smallAddBtn: { backgroundColor: colors.primary, width: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  memberName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#334155' },
  memberDelBtn: { padding: 8, backgroundColor: '#FFF1F2', borderRadius: 10 },
  memberConfirmBox: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#F1F5F9', padding: 4, borderRadius: 10 },
  memberCancelBtn: { padding: 4 },
  memberDeleteConfirmBtn: { backgroundColor: '#E11D48', padding: 6, borderRadius: 8 },
  
  emptyText: { textAlign: 'center', marginTop: 30, color: '#94A3B8' }
});