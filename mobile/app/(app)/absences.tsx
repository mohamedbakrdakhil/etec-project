import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import EmptyState from '../../components/EmptyState';

export default function AbsencesScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [absences, setAbsences] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState('');

  const isEtudiant = user?.role === 'etudiant';
  const isAdmin = user?.role === 'admin' || user?.role === 'developpeur';
  const isProf = user?.role === 'professeur';

  const fetchData = useCallback(async () => {
    setError('');
    try {
      if (isEtudiant) {
        const res = await api.get('/absences/summary');
        const data = Array.isArray(res.data) ? res.data : (res.data?.absences || res.data?.data || []);
        setSummary(data);
      } else if (isAdmin) {
        const res = await api.get('/absences');
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.absences || []);
        setAbsences(data);
      } else if (isProf) {
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const today = dayNames[new Date().getDay()];
        const res = await api.get(`/planning?jour=${today}`);
        const data = Array.isArray(res.data) ? res.data : (res.data?.seances || res.data?.data || []);
        setSessions(data);
      }
    } catch (err: any) {
      setError('Impossible de charger les absences.');
    } finally {
      setLoading(false);
    }
  }, [isEtudiant, isAdmin, isProf]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  function handleRecordAttendance(session: any) {
    Alert.alert(
      'Enregistrer les absences',
      `Séance: ${session.module?.nom || 'Module'}\n${session.heureDebut || ''} – ${session.heureFin || ''}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Enregistrer',
          onPress: async () => {
            try {
              await api.post('/absences/record', { seance_id: session.id });
              Alert.alert('Succès', 'Absences enregistrées.');
            } catch (_) {
              Alert.alert('Erreur', 'Impossible d\'enregistrer les absences.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#06D6A0" />
        </View>
      </SafeAreaView>
    );
  }

  // ETUDIANT: Summary table
  if (isEtudiant) {
    const total = summary.reduce((acc, m) => acc + (m.total || 0), 0);
    const justified = summary.reduce((acc, m) => acc + (m.justifiees || m.justified || 0), 0);
    const unjustified = total - justified;

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes Absences</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: '#EF444440' }]}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: '#06D6A040' }]}>
            <Text style={[styles.summaryValue, { color: '#06D6A0' }]}>{justified}</Text>
            <Text style={styles.summaryLabel}>Justifiées</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: '#F59E0B40' }]}>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{unjustified}</Text>
            <Text style={styles.summaryLabel}>Non just.</Text>
          </View>
        </View>

        {error !== '' && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={summary}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />}
          ListEmptyComponent={
            <EmptyState emoji="✅" title="Aucune absence" subtitle="Félicitations, vous n'avez aucune absence enregistrée." />
          }
          renderItem={({ item }) => {
            const tot = item.total || 0;
            const just = item.justifiees || item.justified || 0;
            const unjust = tot - just;
            return (
              <View style={styles.absenceModuleCard}>
                <View style={styles.moduleRow}>
                  <Ionicons name="book-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.moduleName} numberOfLines={1}>
                    {item.module?.nom || item.moduleName || item.nom || 'Module'}
                  </Text>
                </View>
                <View style={styles.absenceStats}>
                  <View style={styles.absenceStat}>
                    <Text style={[styles.absenceStatValue, { color: '#EF4444' }]}>{tot}</Text>
                    <Text style={styles.absenceStatLabel}>Total</Text>
                  </View>
                  <View style={styles.absenceDivider} />
                  <View style={styles.absenceStat}>
                    <Text style={[styles.absenceStatValue, { color: '#06D6A0' }]}>{just}</Text>
                    <Text style={styles.absenceStatLabel}>Justifiées</Text>
                  </View>
                  <View style={styles.absenceDivider} />
                  <View style={styles.absenceStat}>
                    <Text style={[styles.absenceStatValue, { color: '#F59E0B' }]}>{unjust}</Text>
                    <Text style={styles.absenceStatLabel}>Non just.</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    );
  }

  // ADMIN: Full list
  if (isAdmin) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Absences</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{absences.length}</Text>
          </View>
        </View>

        {error !== '' && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={absences}
          keyExtractor={(item, i) => String(item.id || i)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />}
          ListEmptyComponent={
            <EmptyState emoji="📋" title="Aucune absence" subtitle="Toutes les absences apparaîtront ici." />
          }
          renderItem={({ item }) => {
            const studentName = item.etudiant
              ? `${item.etudiant.prenom} ${item.etudiant.nom}`
              : `${item.prenom || ''} ${item.nom || ''}`.trim() || 'Étudiant';
            const moduleName = item.module?.nom || item.moduleName || item.seance?.module?.nom || '';
            const date = item.date || item.created_at?.split('T')[0] || '';
            const isJustified = item.justifiee || item.justified || item.justifie;

            return (
              <View style={styles.absenceCard}>
                <View style={styles.absenceCardLeft}>
                  <Text style={styles.absenceDate}>{date}</Text>
                  <Text style={styles.absenceStudent}>{studentName}</Text>
                  {moduleName && <Text style={styles.absenceModule}>{moduleName}</Text>}
                </View>
                <View style={[
                  styles.justifiedBadge,
                  { backgroundColor: isJustified ? '#06D6A020' : '#EF444420' }
                ]}>
                  <Text style={[
                    styles.justifiedText,
                    { color: isJustified ? '#06D6A0' : '#EF4444' }
                  ]}>
                    {isJustified ? 'Justifiée' : 'Non just.'}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    );
  }

  // PROF: Today's sessions → record attendance
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Présences</Text>
      </View>
      <Text style={styles.subheader}>Séances d'aujourd'hui</Text>

      {error !== '' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={sessions}
        keyExtractor={(item, i) => String(item.id || i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />}
        ListEmptyComponent={
          <EmptyState emoji="📅" title="Aucune séance" subtitle="Vous n'avez pas de séance aujourd'hui." />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sessionCard}
            onPress={() => handleRecordAttendance(item)}
            activeOpacity={0.8}
          >
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionModule}>{item.module?.nom || 'Module'}</Text>
              <Text style={styles.sessionTime}>
                {item.heureDebut || item.heure_debut || ''} – {item.heureFin || item.heure_fin || ''}
              </Text>
              <Text style={styles.sessionGroupe}>{item.groupe?.nom || ''}</Text>
            </View>
            <View style={styles.recordButton}>
              <Ionicons name="checkbox-outline" size={20} color="#06D6A0" />
              <Text style={styles.recordText}>Présence</Text>
            </View>
          </TouchableOpacity>
        )}
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
    paddingBottom: 4,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  subheader: { fontSize: 13, color: '#9CA3AF', paddingHorizontal: 20, marginBottom: 8 },
  countBadge: {
    backgroundColor: '#06D6A020',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 13, fontWeight: '700', color: '#06D6A0' },
  errorBanner: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#1F0E0E',
    borderRadius: 10,
    marginBottom: 8,
  },
  errorText: { color: '#EF4444', fontSize: 13 },
  list: { padding: 20, gap: 10, paddingBottom: 40 },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
    marginTop: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  absenceModuleCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 14,
  },
  moduleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  moduleName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB', flex: 1 },
  absenceStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  absenceStat: { alignItems: 'center' },
  absenceStatValue: { fontSize: 20, fontWeight: '800' },
  absenceStatLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  absenceDivider: { width: 1, height: 32, backgroundColor: '#374151' },
  absenceCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  absenceCardLeft: { flex: 1 },
  absenceDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  absenceStudent: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  absenceModule: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  justifiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 10,
  },
  justifiedText: { fontSize: 12, fontWeight: '700' },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: { flex: 1 },
  sessionModule: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  sessionTime: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  sessionGroupe: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  recordButton: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#06D6A015',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recordText: { fontSize: 11, fontWeight: '600', color: '#06D6A0' },
});
