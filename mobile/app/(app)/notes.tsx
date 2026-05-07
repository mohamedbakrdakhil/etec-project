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
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import EmptyState from '../../components/EmptyState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function getInitials(prenom: string, nom: string): string {
  return `${(prenom || ' ').charAt(0)}${(nom || ' ').charAt(0)}`.toUpperCase();
}

// ─── Note Form Modal ──────────────────────────────────────────────────────────

interface NoteFormProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  student: any | null;
  modules: any[];
  existingNote?: any | null;
}

function NoteFormModal({ visible, onClose, onSaved, student, modules, existingNote }: NoteFormProps) {
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!existingNote;

  useEffect(() => {
    if (visible) {
      if (existingNote) {
        const mod = modules.find((m) => m.id === (existingNote.module_id || existingNote.module?.id));
        setSelectedModule(mod || null);
        setNoteValue(String(existingNote.note ?? ''));
        setCoefficient(String(existingNote.coefficient ?? '1'));
      } else {
        setSelectedModule(modules.length > 0 ? modules[0] : null);
        setNoteValue('');
        setCoefficient('1');
      }
      setError('');
    }
  }, [visible, existingNote, modules]);

  const handleSave = async () => {
    if (!selectedModule) {
      setError('Veuillez sélectionner un module.');
      return;
    }
    const noteNum = parseFloat(noteValue);
    if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
      setError('La note doit être entre 0 et 20.');
      return;
    }
    const coefNum = parseFloat(coefficient);
    if (isNaN(coefNum) || coefNum <= 0) {
      setError('Le coefficient doit être un nombre positif.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        etudiant_id: student?.id,
        module_id: selectedModule.id,
        note: noteNum,
        coefficient: coefNum,
      };
      if (isEdit) {
        await api.put(`/notes/${existingNote.id}`, payload);
      } else {
        await api.post('/notes', payload);
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

  const studentName = student
    ? `${student.prenom || ''} ${student.nom || ''}`.trim() || student.email
    : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>
                {isEdit ? 'Modifier la note' : 'Ajouter une note'}
              </Text>
              {studentName !== '' && (
                <Text style={styles.sheetSubtitle}>{studentName}</Text>
              )}
            </View>
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

            {/* Module selector */}
            <Text style={styles.label}>Module</Text>
            {modules.length === 0 ? (
              <View style={styles.emptyModules}>
                <Text style={styles.emptyModulesText}>Aucun module disponible</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {modules.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.modulePill,
                      selectedModule?.id === m.id && styles.modulePillActive,
                    ]}
                    onPress={() => setSelectedModule(m)}
                  >
                    <Text style={[
                      styles.modulePillText,
                      selectedModule?.id === m.id && styles.modulePillTextActive,
                    ]}>
                      {m.nom || m.intitule || m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Note */}
            <Text style={styles.label}>Note (0 – 20)</Text>
            <TextInput
              style={styles.input}
              value={noteValue}
              onChangeText={setNoteValue}
              placeholder="Ex: 14.5"
              placeholderTextColor="#4B5563"
              keyboardType="decimal-pad"
            />

            {/* Live grade preview */}
            {noteValue !== '' && !isNaN(parseFloat(noteValue)) && (
              <View style={[
                styles.gradePreview,
                { backgroundColor: gradeColor(parseFloat(noteValue)) + '18' },
              ]}>
                <Text style={[styles.gradePreviewValue, { color: gradeColor(parseFloat(noteValue)) }]}>
                  {parseFloat(noteValue).toFixed(2)}/20
                </Text>
                <Text style={[styles.gradePreviewLabel, { color: gradeColor(parseFloat(noteValue)) }]}>
                  {gradeLabel(parseFloat(noteValue))}
                </Text>
              </View>
            )}

            {/* Coefficient */}
            <Text style={styles.label}>Coefficient</Text>
            <TextInput
              style={styles.input}
              value={coefficient}
              onChangeText={setCoefficient}
              placeholder="Ex: 2"
              placeholderTextColor="#4B5563"
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#0A0F1E" />
              ) : (
                <>
                  <Ionicons name={isEdit ? 'checkmark-circle' : 'add-circle'} size={18} color="#0A0F1E" />
                  <Text style={styles.saveBtnText}>
                    {isEdit ? 'Enregistrer' : 'Ajouter la note'}
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

// ─── Student Note Card (prof/admin view) ──────────────────────────────────────

interface StudentCardProps {
  student: any;
  notes: any[];
  modules: any[];
  onAddNote: (student: any) => void;
  onEditNote: (student: any, note: any) => void;
  onDeleteNote: (note: any) => void;
}

function StudentNoteCard({ student, notes, modules, onAddNote, onEditNote, onDeleteNote }: StudentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const name = `${student.prenom || ''} ${student.nom || ''}`.trim() || student.email || 'Étudiant';
  const initials = getInitials(student.prenom || '', student.nom || '');
  const moyenne =
    notes.length > 0
      ? notes.reduce((sum, n) => sum + parseFloat(n.note || 0), 0) / notes.length
      : null;

  return (
    <View style={styles.studentCard}>
      {/* Card header */}
      <TouchableOpacity
        style={styles.studentCardHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
      >
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>{initials}</Text>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{name}</Text>
          <Text style={styles.studentMeta}>
            {notes.length} note{notes.length !== 1 ? 's' : ''}
            {moyenne !== null ? ` · moy. ${moyenne.toFixed(2)}/20` : ''}
          </Text>
        </View>

        {moyenne !== null && (
          <View style={[styles.avgChip, { backgroundColor: gradeColor(moyenne) + '20' }]}>
            <Text style={[styles.avgChipText, { color: gradeColor(moyenne) }]}>
              {moyenne.toFixed(2)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addNoteBtn}
          onPress={() => onAddNote(student)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add-circle" size={26} color="#06D6A0" />
        </TouchableOpacity>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#6B7280"
        />
      </TouchableOpacity>

      {/* Expanded notes */}
      {expanded && (
        <View style={styles.notesExpanded}>
          {notes.length === 0 ? (
            <Text style={styles.noNotesText}>Aucune note saisie</Text>
          ) : (
            notes.map((n) => {
              const noteNum = parseFloat(n.note || 0);
              const modName =
                modules.find((m) => m.id === (n.module_id || n.module?.id))?.nom ||
                n.module?.nom ||
                n.module?.intitule ||
                'Module';
              return (
                <View key={n.id} style={styles.noteRow}>
                  <View style={[styles.noteColorDot, { backgroundColor: gradeColor(noteNum) }]} />
                  <Text style={styles.noteModuleName} numberOfLines={1}>
                    {modName}
                  </Text>
                  {n.coefficient && Number(n.coefficient) !== 1 && (
                    <Text style={styles.noteCoef}>×{n.coefficient}</Text>
                  )}
                  <View style={[styles.gradeChip, { backgroundColor: gradeBg(noteNum) }]}>
                    <Text style={[styles.gradeValue, { color: gradeColor(noteNum) }]}>
                      {noteNum.toFixed(2)}
                    </Text>
                    <Text style={[styles.gradeSlash, { color: gradeColor(noteNum) + '80' }]}>
                      /20
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onEditNote(student, n)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="create-outline" size={16} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDeleteNote(n)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="trash-outline" size={15} color="#EF444460" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotesScreen() {
  const { user } = useAuth();
  const isEtudiant = user?.role === 'etudiant';

  // Shared
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Etudiant
  const [bulletin, setBulletin] = useState<any>(null);

  // Prof / Admin
  const [groupes, setGroupes] = useState<any[]>([]);
  const [selectedGroupe, setSelectedGroupe] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [studentNotes, setStudentNotes] = useState<Record<number, any[]>>({});
  const [modules, setModules] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [activeNote, setActiveNote] = useState<any | null>(null);

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchBulletin = useCallback(async () => {
    try {
      const res = await api.get('/notes/bulletin');
      setBulletin(res.data);
    } catch (_) {
      setError('Impossible de charger votre bulletin.');
    }
  }, []);

  const fetchGroupes = useCallback(async () => {
    try {
      const res = await api.get('/groupes');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setGroupes(data);
      if (data.length > 0) setSelectedGroupe(String(data[0].id));
    } catch (_) {
      setError('Impossible de charger les groupes.');
    }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      const res = await api.get('/modules');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setModules(data);
    } catch (_) {}
  }, []);

  const fetchStudentsWithNotes = useCallback(async (groupeId: string) => {
    if (!groupeId) return;
    setLoadingStudents(true);
    setError('');
    try {
      // Fetch students in group
      const sRes = await api.get(`/groupes/${groupeId}/etudiants`);
      const sData = Array.isArray(sRes.data) ? sRes.data : sRes.data?.data || [];
      setStudents(sData);

      // Fetch notes for each student (in parallel)
      const notesMap: Record<number, any[]> = {};
      await Promise.all(
        sData.map(async (s: any) => {
          try {
            const nRes = await api.get(`/notes?etudiant_id=${s.id}`);
            const nData = Array.isArray(nRes.data) ? nRes.data : nRes.data?.data || [];
            notesMap[s.id] = nData;
          } catch (_) {
            notesMap[s.id] = [];
          }
        })
      );
      setStudentNotes(notesMap);
    } catch (_) {
      setStudents([]);
      setError('Impossible de charger les étudiants.');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      if (isEtudiant) {
        await fetchBulletin();
      } else {
        await Promise.all([fetchGroupes(), fetchModules()]);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isEtudiant && selectedGroupe) {
      fetchStudentsWithNotes(selectedGroupe);
    }
  }, [selectedGroupe]);

  // ── Refresh ────────────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError('');
    if (isEtudiant) {
      await fetchBulletin();
    } else {
      await fetchStudentsWithNotes(selectedGroupe);
    }
    setRefreshing(false);
  }, [isEtudiant, selectedGroupe, fetchBulletin, fetchStudentsWithNotes]);

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleAddNote = (student: any) => {
    setActiveStudent(student);
    setActiveNote(null);
    setModalVisible(true);
  };

  const handleEditNote = (student: any, note: any) => {
    setActiveStudent(student);
    setActiveNote(note);
    setModalVisible(true);
  };

  const handleDeleteNote = (note: any) => {
    Alert.alert(
      'Supprimer la note',
      'Voulez-vous vraiment supprimer cette note ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/notes/${note.id}`);
              // Refresh notes for this student
              await fetchStudentsWithNotes(selectedGroupe);
            } catch (err: any) {
              Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de supprimer la note.');
            }
          },
        },
      ]
    );
  };

  const onNoteSaved = () => {
    fetchStudentsWithNotes(selectedGroupe);
  };

  // ── Bulletin helpers ───────────────────────────────────────────────────────

  function getBulletinModules(): any[] {
    if (!bulletin) return [];
    if (Array.isArray(bulletin.modules)) return bulletin.modules;
    if (Array.isArray(bulletin.notes)) return bulletin.notes;
    return [];
  }

  function getMoyenne(): number | null {
    if (!bulletin) return null;
    if (typeof bulletin.moyenne === 'number') return bulletin.moyenne;
    if (typeof bulletin.moyenneGenerale === 'number') return bulletin.moyenneGenerale;
    const mods = getBulletinModules();
    if (mods.length === 0) return null;
    const sum = mods.reduce((acc: number, m: any) => acc + parseFloat(m.moyenne ?? m.note ?? 0), 0);
    return sum / mods.length;
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#06D6A0" />
          <Text style={styles.loadingText}>Chargement des notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── ETUDIANT view ──────────────────────────────────────────────────────────

  if (isEtudiant) {
    const mods = getBulletinModules();
    const moyenne = getMoyenne();

    return (
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mon Bulletin</Text>
            <Text style={styles.subtitle}>{mods.length} module{mods.length !== 1 ? 's' : ''}</Text>
          </View>
          {moyenne !== null && (
            <View style={[styles.avgBadge, { backgroundColor: gradeColor(moyenne) + '20' }]}>
              <Text style={[styles.avgBadgeValue, { color: gradeColor(moyenne) }]}>
                {moyenne.toFixed(2)}/20
              </Text>
              <Text style={[styles.avgBadgeLabel, { color: gradeColor(moyenne) + 'CC' }]}>
                {gradeLabel(moyenne)}
              </Text>
            </View>
          )}
        </View>

        {error !== '' && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={mods}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />
          }
          ListEmptyComponent={
            <EmptyState
              emoji="📊"
              title="Aucune note disponible"
              subtitle="Vos notes apparaîtront ici une fois saisies par vos professeurs."
            />
          }
          renderItem={({ item }) => {
            const note = parseFloat(item.moyenne ?? item.note ?? 0);
            const coef = item.coefficient || item.coef || 1;
            return (
              <View style={styles.moduleCard}>
                <View style={[styles.colorBar, { backgroundColor: gradeColor(note) }]} />
                <View style={styles.moduleContent}>
                  <Text style={styles.moduleName}>
                    {item.module?.nom || item.module?.intitule || item.nom || item.intitule || 'Module'}
                  </Text>
                  {coef > 1 && (
                    <Text style={styles.coefText}>Coefficient {coef}</Text>
                  )}
                  <Text style={[styles.gradeLabelText, { color: gradeColor(note) + 'CC' }]}>
                    {gradeLabel(note)}
                  </Text>
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

  // ── PROF / ADMIN / DEV view ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notes</Text>
          <Text style={styles.subtitle}>
            {loadingStudents ? 'Chargement...' : `${students.length} étudiant${students.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={onRefresh}
          disabled={refreshing || loadingStudents}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#06D6A0" />
          ) : (
            <Ionicons name="refresh-outline" size={20} color="#06D6A0" />
          )}
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error !== '' && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Groupe chips */}
      {groupes.length > 0 && (
        <View style={styles.groupeWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupeRow}
          >
            {groupes.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.groupeChip,
                  selectedGroupe === String(g.id) && styles.groupeChipActive,
                ]}
                onPress={() => setSelectedGroupe(String(g.id))}
              >
                <Text style={[
                  styles.groupeChipText,
                  selectedGroupe === String(g.id) && styles.groupeChipTextActive,
                ]}>
                  {g.nom || g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Students list */}
      {loadingStudents ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#06D6A0" />
          <Text style={styles.loadingText}>Chargement des étudiants...</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />
          }
          ListEmptyComponent={
            groupes.length === 0 ? (
              <EmptyState
                emoji="📋"
                title="Aucun groupe"
                subtitle="Aucun groupe n'est configuré dans le système."
              />
            ) : (
              <EmptyState
                emoji="👥"
                title="Aucun étudiant"
                subtitle="Ce groupe ne contient pas encore d'étudiants."
              />
            )
          }
          renderItem={({ item }) => (
            <StudentNoteCard
              student={item}
              notes={studentNotes[item.id] || []}
              modules={modules}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
            />
          )}
        />
      )}

      {/* Note form modal */}
      <NoteFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={onNoteSaved}
        student={activeStudent}
        modules={modules}
        existingNote={activeNote}
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
  refreshIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#06D6A015',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#06D6A030',
  },

  // Average badge (etudiant header)
  avgBadge: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  avgBadgeValue: { fontSize: 20, fontWeight: '800' },
  avgBadgeLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginTop: 1 },

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
  list: { padding: 20, gap: 10, paddingBottom: 60 },

  // Module card (etudiant)
  moduleCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    overflow: 'hidden',
    alignItems: 'center',
  },
  colorBar: { width: 4, alignSelf: 'stretch' },
  moduleContent: { flex: 1, padding: 14 },
  moduleName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  coefText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  gradeLabelText: { fontSize: 11, fontWeight: '600', marginTop: 3 },
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

  // Groupe selector
  groupeWrapper: { marginBottom: 8 },
  groupeRow: { paddingHorizontal: 20, gap: 8 },
  groupeChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  groupeChipActive: { backgroundColor: '#06D6A018', borderColor: '#06D6A0' },
  groupeChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  groupeChipTextActive: { color: '#06D6A0' },

  // Student card
  studentCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    overflow: 'hidden',
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7C3AED22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSmallText: { fontSize: 15, fontWeight: '800', color: '#7C3AED' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  studentMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  avgChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  avgChipText: { fontSize: 13, fontWeight: '800' },
  addNoteBtn: { padding: 2 },

  // Expanded notes
  notesExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    padding: 12,
    gap: 8,
  },
  noNotesText: { color: '#4B5563', fontSize: 13, textAlign: 'center', paddingVertical: 6 },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0A0F1E',
    borderRadius: 10,
    padding: 10,
  },
  noteColorDot: { width: 8, height: 8, borderRadius: 4 },
  noteModuleName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#E5E7EB' },
  noteCoef: { fontSize: 11, color: '#6B7280' },

  // Modal / Bottom sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  sheetSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.5,
  },
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
  emptyModules: {
    backgroundColor: '#0A0F1E',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  emptyModulesText: { color: '#4B5563', fontSize: 13 },
  modulePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0A0F1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  modulePillActive: { backgroundColor: '#06D6A018', borderColor: '#06D6A0' },
  modulePillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  modulePillTextActive: { color: '#06D6A0' },
  gradePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  gradePreviewValue: { fontSize: 20, fontWeight: '800' },
  gradePreviewLabel: { fontSize: 13, fontWeight: '600' },
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
