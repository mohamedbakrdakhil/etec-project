import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import EmptyState from '../../components/EmptyState';

function gradeColor(note: number): string {
  if (note >= 14) return '#06D6A0';
  if (note >= 10) return '#F59E0B';
  return '#EF4444';
}

function gradeBg(note: number): string {
  if (note >= 14) return '#06D6A020';
  if (note >= 10) return '#F59E0B20';
  return '#EF444420';
}

function gradeLabel(note: number): string {
  if (note >= 16) return 'Très bien';
  if (note >= 14) return 'Bien';
  if (note >= 12) return 'Assez bien';
  if (note >= 10) return 'Passable';
  return 'Insuffisant';
}

export default function NotesScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bulletin, setBulletin] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedGroupe, setSelectedGroupe] = useState<string>('');
  const [groupes, setGroupes] = useState<any[]>([]);
  const [error, setError] = useState('');

  const isEtudiant = user?.role === 'etudiant';

  const fetchData = useCallback(async () => {
    setError('');
    try {
      if (isEtudiant) {
        const res = await api.get('/notes/bulletin');
        setBulletin(res.data);
      } else {
        // Prof or admin: load groupes first
        try {
          const gRes = await api.get('/groupes');
          const gData = Array.isArray(gRes.data) ? gRes.data : (gRes.data?.data || []);
          setGroupes(gData);
          if (gData.length > 0 && !selectedGroupe) {
            setSelectedGroupe(String(gData[0].id));
          }
        } catch (_) {}
      }
    } catch (err: any) {
      setError('Impossible de charger les notes.');
    } finally {
      setLoading(false);
    }
  }, [isEtudiant, selectedGroupe]);

  const fetchStudentNotes = useCallback(async (groupeId: string) => {
    if (!groupeId) return;
    setError('');
    try {
      const res = await api.get(`/notes?groupe_id=${groupeId}`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setStudents(data);
    } catch (_) {
      setStudents([]);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (!isEtudiant && selectedGroupe) fetchStudentNotes(selectedGroupe);
  }, [selectedGroupe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    if (!isEtudiant && selectedGroupe) await fetchStudentNotes(selectedGroupe);
    setRefreshing(false);
  }, [fetchData, fetchStudentNotes, selectedGroupe]);

  function getModules() {
    if (!bulletin) return [];
    if (Array.isArray(bulletin.modules)) return bulletin.modules;
    if (Array.isArray(bulletin.notes)) return bulletin.notes;
    return [];
  }

  function getMoyenne() {
    if (!bulletin) return null;
    if (typeof bulletin.moyenne === 'number') return bulletin.moyenne;
    if (typeof bulletin.moyenneGenerale === 'number') return bulletin.moyenneGenerale;
    const mods = getModules();
    if (mods.length > 0) {
      const sum = mods.reduce((acc: number, m: any) => acc + (parseFloat(m.moyenne || m.note || 0)), 0);
      return (sum / mods.length).toFixed(2);
    }
    return null;
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

  if (isEtudiant) {
    const modules = getModules();
    const moyenne = getMoyenne();

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes Notes</Text>
          {moyenne !== null && (
            <View style={[styles.avgBadge, { backgroundColor: gradeColor(Number(moyenne)) + '22' }]}>
              <Text style={[styles.avgValue, { color: gradeColor(Number(moyenne)) }]}>
                {Number(moyenne).toFixed(2)}/20
              </Text>
              <Text style={[styles.avgLabel, { color: gradeColor(Number(moyenne)) }]}>
                {gradeLabel(Number(moyenne))}
              </Text>
            </View>
          )}
        </View>

        {error !== '' && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={modules}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />}
          ListEmptyComponent={
            <EmptyState emoji="📊" title="Aucune note disponible" subtitle="Vos notes apparaîtront ici une fois saisies." />
          }
          renderItem={({ item }) => {
            const note = parseFloat(item.moyenne ?? item.note ?? 0);
            const coef = item.coefficient || item.coef || 1;
            return (
              <View style={styles.moduleCard}>
                <View style={[styles.colorBar, { backgroundColor: gradeColor(note) }]} />
                <View style={styles.moduleContent}>
                  <Text style={styles.moduleName}>
                    {item.module?.nom || item.nom || item.intitule || 'Module'}
                  </Text>
                  {coef > 1 && (
                    <Text style={styles.coefText}>Coefficient {coef}</Text>
                  )}
                </View>
                <View style={[styles.gradeChip, { backgroundColor: gradeBg(note) }]}>
                  <Text style={[styles.gradeValue, { color: gradeColor(note) }]}>
                    {note.toFixed(2)}
                  </Text>
                  <Text style={[styles.gradeSlash, { color: gradeColor(note) + '80' }]}>/20</Text>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    );
  }

  // Admin / Prof view
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Notes</Text>
      </View>

      {/* Groupe selector */}
      {groupes.length > 0 && (
        <View style={styles.groupeRow}>
          <FlatList
            horizontal
            data={groupes}
            keyExtractor={(g) => String(g.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.groupeChip,
                  selectedGroupe === String(item.id) && styles.groupeChipActive,
                ]}
                onPress={() => setSelectedGroupe(String(item.id))}
              >
                <Text style={[
                  styles.groupeChipText,
                  selectedGroupe === String(item.id) && styles.groupeChipTextActive,
                ]}>
                  {item.nom || item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FlatList
        data={students}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />}
        ListEmptyComponent={
          <EmptyState emoji="📊" title="Aucune note" subtitle="Sélectionnez un groupe pour voir les notes." />
        }
        renderItem={({ item }) => {
          const note = parseFloat(item.moyenne ?? item.note ?? 0);
          const studentName = item.etudiant
            ? `${item.etudiant.prenom} ${item.etudiant.nom}`
            : `${item.prenom || ''} ${item.nom || ''}`.trim() || 'Étudiant';
          return (
            <View style={styles.studentCard}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>
                  {studentName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{studentName}</Text>
                <Text style={styles.studentModule}>{item.module?.nom || ''}</Text>
              </View>
              <View style={[styles.gradeChip, { backgroundColor: gradeBg(note) }]}>
                <Text style={[styles.gradeValue, { color: gradeColor(note) }]}>
                  {note.toFixed(2)}
                </Text>
                <Text style={[styles.gradeSlash, { color: gradeColor(note) + '80' }]}>/20</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  avgBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  avgValue: { fontSize: 18, fontWeight: '800' },
  avgLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  errorBanner: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#1F0E0E',
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: { color: '#EF4444', fontSize: 13 },
  list: { padding: 20, gap: 10, paddingBottom: 40 },
  moduleCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
    alignItems: 'center',
  },
  colorBar: { width: 4, alignSelf: 'stretch' },
  moduleContent: { flex: 1, padding: 14 },
  moduleName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  coefText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  gradeChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  gradeValue: { fontSize: 18, fontWeight: '800' },
  gradeSlash: { fontSize: 12, fontWeight: '600' },
  groupeRow: { marginBottom: 8 },
  groupeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  groupeChipActive: { backgroundColor: '#06D6A020', borderColor: '#06D6A0' },
  groupeChipText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  groupeChipTextActive: { color: '#06D6A0' },
  studentCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSmallText: { fontSize: 16, fontWeight: '700', color: '#7C3AED' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  studentModule: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
