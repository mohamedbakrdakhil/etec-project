import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import EmptyState from '../../components/EmptyState';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  { key: 'etudiant', label: 'Étudiant', color: '#F59E0B' },
  { key: 'professeur', label: 'Professeur', color: '#06D6A0' },
  { key: 'admin', label: 'Admin', color: '#0EA5E9' },
  { key: 'developpeur', label: 'Développeur', color: '#7C3AED' },
];

const ROLE_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'etudiant', label: 'Étudiants' },
  { key: 'professeur', label: 'Professeurs' },
  { key: 'admin', label: 'Admins' },
  { key: 'developpeur', label: 'Devs' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleColor(role: string): string {
  return ROLES.find((r) => r.key === role)?.color ?? '#9CA3AF';
}

function getRoleLabel(role: string): string {
  return ROLES.find((r) => r.key === role)?.label ?? role;
}

function getInitials(prenom: string, nom: string): string {
  return `${(prenom || ' ').charAt(0)}${(nom || ' ').charAt(0)}`.toUpperCase();
}

// ─── User Form Modal ───────────────────────────────────────────────────────────

interface UserFormProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editUser?: any | null;
}

function UserFormModal({ visible, onClose, onSaved, editUser }: UserFormProps) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('etudiant');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!editUser;

  useEffect(() => {
    if (visible) {
      if (editUser) {
        setPrenom(editUser.prenom || '');
        setNom(editUser.nom || '');
        setEmail(editUser.email || '');
        setRole(editUser.role || 'etudiant');
        setPassword('');
      } else {
        setPrenom('');
        setNom('');
        setEmail('');
        setRole('etudiant');
        setPassword('');
      }
      setError('');
    }
  }, [visible, editUser]);

  const handleSave = async () => {
    if (!prenom.trim() || !nom.trim() || !email.trim()) {
      setError('Prénom, nom et email sont obligatoires.');
      return;
    }
    if (!isEdit && !password.trim()) {
      setError('Le mot de passe est obligatoire pour un nouvel utilisateur.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: any = { prenom: prenom.trim(), nom: nom.trim(), email: email.trim(), role };
      if (password.trim()) payload.password = password.trim();

      if (isEdit) {
        await api.put(`/users/${editUser.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de la sauvegarde.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {error !== '' && (
              <View style={styles.formError}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.formErrorText}>{error}</Text>
              </View>
            )}

            {/* Prénom */}
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Prénom"
              placeholderTextColor="#4B5563"
              autoCapitalize="words"
            />

            {/* Nom */}
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Nom de famille"
              placeholderTextColor="#4B5563"
              autoCapitalize="words"
            />

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="exemple@etec.ma"
              placeholderTextColor="#4B5563"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Rôle */}
            <Text style={styles.label}>Rôle</Text>
            <View style={styles.rolePills}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.rolePill,
                    role === r.key && { backgroundColor: r.color + '25', borderColor: r.color },
                  ]}
                  onPress={() => setRole(r.key)}
                >
                  {role === r.key && (
                    <View style={[styles.rolePillDot, { backgroundColor: r.color }]} />
                  )}
                  <Text style={[styles.rolePillText, role === r.key && { color: r.color }]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mot de passe */}
            <Text style={styles.label}>
              Mot de passe{isEdit ? ' (laisser vide pour ne pas changer)' : ''}
            </Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={isEdit ? '••••••••' : 'Mot de passe requis'}
              placeholderTextColor="#4B5563"
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#0A0F1E" />
              ) : (
                <>
                  <Ionicons name={isEdit ? 'checkmark-circle' : 'person-add'} size={18} color="#0A0F1E" />
                  <Text style={styles.saveBtnText}>
                    {isEdit ? 'Enregistrer' : 'Créer l\'utilisateur'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UsersScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);

  const fabScale = useRef(new Animated.Value(1)).current;

  const fetchUsers = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/users');
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.users || [];
      setUsers(data);
    } catch (_) {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let result = users;
    if (roleFilter) result = result.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        `${u.prenom} ${u.nom} ${u.email} ${u.role}`.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [users, roleFilter, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const handleDelete = (item: any) => {
    const name = `${item.prenom || ''} ${item.nom || ''}`.trim() || item.email;
    Alert.alert(
      'Supprimer l\'utilisateur',
      `Voulez-vous vraiment supprimer "${name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/${item.id}`);
              setUsers((prev) => prev.filter((u) => u.id !== item.id));
            } catch (err: any) {
              Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de supprimer cet utilisateur.');
            }
          },
        },
      ]
    );
  };

  const openEdit = (item: any) => {
    setEditUser(item);
    setModalVisible(true);
  };

  const openAdd = () => {
    setEditUser(null);
    setModalVisible(true);
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const onSaved = () => {
    fetchUsers();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#06D6A0" />
          <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Utilisateurs</Text>
          <Text style={styles.subtitle}>{filtered.length} membre{filtered.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par nom, email, rôle..."
          placeholderTextColor="#4B5563"
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {ROLE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, roleFilter === f.key && styles.filterChipActive]}
            onPress={() => setRoleFilter(f.key)}
          >
            <Text style={[styles.filterText, roleFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error banner */}
      {error !== '' && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* User list */}
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => String(item.id || i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />
        }
        ListEmptyComponent={
          <EmptyState
            emoji="👥"
            title="Aucun utilisateur"
            subtitle={search || roleFilter ? 'Modifiez votre recherche ou vos filtres.' : 'Aucun utilisateur enregistré.'}
          />
        }
        renderItem={({ item }) => {
          const name = `${item.prenom || ''} ${item.nom || ''}`.trim() || item.email;
          const initials = getInitials(item.prenom || '', item.nom || '');
          const roleColor = getRoleColor(item.role);

          return (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() => openEdit(item)}
              onLongPress={() => handleDelete(item)}
              activeOpacity={0.75}
            >
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: roleColor + '22' }]}>
                <Text style={[styles.avatarText, { color: roleColor }]}>{initials}</Text>
              </View>

              {/* Info */}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{name}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>

              {/* Role badge */}
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '18' }]}>
                <Text style={[styles.roleText, { color: roleColor }]}>
                  {getRoleLabel(item.role)}
                </Text>
              </View>

              {/* Edit icon */}
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEdit(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="create-outline" size={18} color="#6B7280" />
              </TouchableOpacity>

              {/* Delete icon */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={17} color="#EF444460" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity style={styles.fabInner} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#0A0F1E" />
        </TouchableOpacity>
      </Animated.View>

      {/* Form Modal */}
      <UserFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={onSaved}
        editUser={editUser}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0F1E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#F9FAFB' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  countBadge: {
    backgroundColor: '#06D6A018',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#06D6A030',
  },
  countText: { fontSize: 14, fontWeight: '800', color: '#06D6A0' },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#F9FAFB', paddingVertical: 0 },

  // Filters
  filterScroll: { marginBottom: 12 },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  filterChipActive: { backgroundColor: '#06D6A018', borderColor: '#06D6A0' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#06D6A0' },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#1F0E0E',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  errorText: { color: '#EF4444', fontSize: 13, flex: 1 },

  // List
  list: { padding: 20, gap: 10, paddingBottom: 100 },

  // User card
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 12,
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '800' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  userEmail: { fontSize: 11, color: '#6B7280', marginTop: 3 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  editBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 4,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    shadowColor: '#06D6A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#06D6A0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal / Bottom sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#1F2937',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form
  label: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 6, marginTop: 14, letterSpacing: 0.5 },
  input: {
    backgroundColor: '#0A0F1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    color: '#F9FAFB',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rolePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0A0F1E',
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 6,
  },
  rolePillDot: { width: 7, height: 7, borderRadius: 3.5 },
  rolePillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F0E0E',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  formErrorText: { color: '#EF4444', fontSize: 13, flex: 1 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06D6A0',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#0A0F1E' },
});
