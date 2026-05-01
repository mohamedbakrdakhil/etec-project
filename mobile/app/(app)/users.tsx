import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import EmptyState from '../../components/EmptyState';

const ROLE_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'etudiant', label: 'Étudiants' },
  { key: 'professeur', label: 'Professeurs' },
  { key: 'admin', label: 'Admins' },
];

function getRoleColor(role: string): string {
  switch (role) {
    case 'developpeur': return '#7C3AED';
    case 'admin': return '#0EA5E9';
    case 'professeur': return '#06D6A0';
    case 'etudiant': return '#F59E0B';
    default: return '#9CA3AF';
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'developpeur': return 'Dev';
    case 'admin': return 'Admin';
    case 'professeur': return 'Prof';
    case 'etudiant': return 'Étudiant';
    default: return role;
  }
}

export default function UsersScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/users');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.users || []);
      setUsers(data);
      setFiltered(data);
    } catch (_) {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    let result = users;
    if (roleFilter) result = result.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [users, roleFilter, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#06D6A0" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Utilisateurs</Text>
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
          placeholder="Rechercher..."
          placeholderTextColor="#6B7280"
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role filter */}
      <View style={styles.filterRow}>
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
      </View>

      {error !== '' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => String(item.id || i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />}
        ListEmptyComponent={
          <EmptyState emoji="👥" title="Aucun utilisateur" subtitle="Modifiez votre recherche ou vos filtres." />
        }
        renderItem={({ item }) => {
          const name = `${item.prenom || ''} ${item.nom || ''}`.trim() || item.email;
          const initials = `${(item.prenom || ' ').charAt(0)}${(item.nom || ' ').charAt(0)}`.toUpperCase();
          const roleColor = getRoleColor(item.role);

          return (
            <View style={styles.userCard}>
              <View style={[styles.avatar, { backgroundColor: roleColor + '25' }]}>
                <Text style={[styles.avatarText, { color: roleColor }]}>{initials}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{name}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
                <Text style={[styles.roleText, { color: roleColor }]}>
                  {getRoleLabel(item.role)}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0F1E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#F9FAFB', flex: 1 },
  countBadge: {
    backgroundColor: '#06D6A020',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 13, fontWeight: '700', color: '#06D6A0' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#F9FAFB', paddingVertical: 0 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  filterChipActive: { backgroundColor: '#06D6A020', borderColor: '#06D6A0' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  filterTextActive: { color: '#06D6A0' },
  errorBanner: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#1F0E0E',
    borderRadius: 10,
    marginBottom: 8,
  },
  errorText: { color: '#EF4444', fontSize: 13 },
  list: { padding: 20, gap: 10, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  userEmail: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '700' },
});
