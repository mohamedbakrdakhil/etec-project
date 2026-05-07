import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
  TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import EmptyState from '../../components/EmptyState';

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAY_COLORS = ['#06D6A0', '#7C3AED', '#0EA5E9', '#F59E0B', '#EF4444', '#EC4899'];
const DAY_SHORT = ['L', 'M', 'Me', 'J', 'V', 'S'];

function timeToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function fmt(t: string) { return t ? t.slice(0, 5) : ''; }
function getDuration(a: string, b: string) {
  const d = timeToMinutes(b) - timeToMinutes(a);
  if (d <= 0) return '';
  const h = Math.floor(d / 60), m = d % 60;
  return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h${m}`;
}

export default function PlanningScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seances, setSeances] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return ({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 } as any)[d] ?? 0;
  });

  const [showModal, setShowModal] = useState(false);
  const [editSeance, setEditSeance] = useState<any>(null);
  const [form, setForm] = useState<any>({ jour: 'lundi', heureDebut: '08:00', heureFin: '10:00', salle: '', module_id: '', groupe_id: '', professeur_id: '' });
  const [modules, setModules] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'developpeur';

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/planning');
      const data = Array.isArray(res.data) ? res.data : (res.data?.seances || res.data?.data || []);
      setSeances(data);
      if (canEdit) {
        const [mR, gR, uR] = await Promise.allSettled([api.get('/modules'), api.get('/groupes'), api.get('/users?role=professeur')]);
        if (mR.status === 'fulfilled') { const d = mR.value.data; setModules(Array.isArray(d) ? d : (d?.data || [])); }
        if (gR.status === 'fulfilled') { const d = gR.value.data; setGroupes(Array.isArray(d) ? d : (d?.data || [])); }
        if (uR.status === 'fulfilled') { const d = uR.value.data; setProfs(Array.isArray(d) ? d : (d?.data || d?.users || [])); }
      }
    } catch { setError('Impossible de charger le planning.'); }
    finally { setLoading(false); }
  }, [canEdit]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }, [fetchData]);

  const daySeances = seances
    .filter(s => (s.jour || '').toLowerCase() === DAYS[selectedDay])
    .sort((a, b) => timeToMinutes(a.heureDebut || a.heure_debut) - timeToMinutes(b.heureDebut || b.heure_debut));

  function openAdd() {
    setEditSeance(null);
    setForm({ jour: DAYS[selectedDay], heureDebut: '08:00', heureFin: '10:00', salle: '', module_id: modules[0]?.id ? String(modules[0].id) : '', groupe_id: groupes[0]?.id ? String(groupes[0].id) : '', professeur_id: profs[0]?.id ? String(profs[0].id) : '' });
    setShowModal(true);
  }
  function openEdit(s: any) {
    setEditSeance(s);
    setForm({ jour: s.jour || 'lundi', heureDebut: fmt(s.heureDebut || s.heure_debut || '08:00'), heureFin: fmt(s.heureFin || s.heure_fin || '10:00'), salle: s.salle || '', module_id: String(s.module?.id || s.module_id || ''), groupe_id: String(s.groupe?.id || s.groupe_id || ''), professeur_id: String(s.professeur?.id || s.professeur_id || '') });
    setShowModal(true);
  }
  async function handleSave() {
    setSaving(true);
    try {
      const payload = { jour: form.jour, heure_debut: form.heureDebut, heure_fin: form.heureFin, salle: form.salle, module_id: Number(form.module_id), groupe_id: Number(form.groupe_id), professeur_id: Number(form.professeur_id) };
      if (editSeance) await api.put(`/planning/${editSeance.id}`, payload);
      else await api.post('/planning', payload);
      setShowModal(false);
      await fetchData();
    } catch (e: any) { Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de sauvegarder.'); }
    finally { setSaving(false); }
  }
  async function handleDelete(s: any) {
    Alert.alert('Supprimer', `${s.module?.nom || 'Séance'} - ${fmt(s.heureDebut || s.heure_debut)}`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { try { await api.delete(`/planning/${s.id}`); await fetchData(); } catch { Alert.alert('Erreur', 'Impossible de supprimer.'); } } },
    ]);
  }

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color="#06D6A0" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Planning</Text>
        {canEdit && <TouchableOpacity style={styles.addBtn} onPress={openAdd}><Ionicons name="add" size={22} color="#0A0F1E" /></TouchableOpacity>}
      </View>

      {/* Day tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayBar}>
        {DAYS.map((day, i) => {
          const isToday = ({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 } as any)[new Date().getDay()] === i;
          const count = seances.filter(s => (s.jour || '').toLowerCase() === day).length;
          const active = selectedDay === i;
          return (
            <TouchableOpacity key={day} style={[styles.dayChip, active && { backgroundColor: DAY_COLORS[i] + '20', borderColor: DAY_COLORS[i] }]} onPress={() => setSelectedDay(i)}>
              <Text style={[styles.dayShort, active && { color: DAY_COLORS[i] }]}>{DAY_SHORT[i]}</Text>
              <Text style={[styles.dayLabel, active && { color: DAY_COLORS[i] }]}>{DAYS_FR[i]}</Text>
              {count > 0 && <View style={[styles.dayCount, { backgroundColor: active ? DAY_COLORS[i] : '#374151' }]}><Text style={[styles.dayCountText, active && { color: '#0A0F1E' }]}>{count}</Text></View>}
              {isToday && <View style={[styles.todayDot, { backgroundColor: active ? DAY_COLORS[i] : '#6B7280' }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />} showsVerticalScrollIndicator={false}>
        {error !== '' && <View style={styles.errorBanner}><Ionicons name="wifi-outline" size={14} color="#F59E0B" /><Text style={styles.errorText}>{error}</Text></View>}
        {daySeances.length === 0
          ? <EmptyState emoji="📅" title="Pas de séances" subtitle={`Aucune séance le ${DAYS_FR[selectedDay]}`} />
          : daySeances.map((s, idx) => {
            const color = DAY_COLORS[selectedDay];
            const debut = fmt(s.heureDebut || s.heure_debut);
            const fin = fmt(s.heureFin || s.heure_fin);
            const profName = s.professeur ? `${s.professeur.prenom} ${s.professeur.nom}` : '';
            return (
              <View key={s.id || idx} style={[styles.card, { borderLeftColor: color }]}>
                <View style={styles.timeCol}>
                  <Text style={[styles.timeStart, { color }]}>{debut}</Text>
                  <View style={[styles.timeLine, { backgroundColor: color + '40' }]} />
                  <Text style={styles.timeEnd}>{fin}</Text>
                  <Text style={[styles.duration, { color }]}>{getDuration(s.heureDebut || s.heure_debut, s.heureFin || s.heure_fin)}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.moduleName} numberOfLines={2}>{s.module?.nom || s.moduleName || 'Module'}</Text>
                  <View style={styles.chips}>
                    {(s.groupe?.nom || s.groupeName) && <Chip icon="people-outline" label={s.groupe?.nom || s.groupeName} />}
                    {s.salle && <Chip icon="location-outline" label={s.salle} />}
                    {profName && <Chip icon="person-outline" label={profName} />}
                  </View>
                </View>
                {canEdit && (
                  <View style={styles.actionsCol}>
                    <TouchableOpacity onPress={() => openEdit(s)} style={styles.actionBtn}><Ionicons name="pencil" size={14} color="#0EA5E9" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(s)} style={styles.actionBtn}><Ionicons name="trash" size={14} color="#EF4444" /></TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editSeance ? 'Modifier la séance' : 'Nouvelle séance'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#9CA3AF" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Label>Jour</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {DAYS.map((d, i) => <TouchableOpacity key={d} style={[styles.pill, form.jour === d && styles.pillActive]} onPress={() => setForm((f: any) => ({ ...f, jour: d }))}><Text style={[styles.pillText, form.jour === d && { color: '#06D6A0' }]}>{DAYS_FR[i]}</Text></TouchableOpacity>)}
                </View>
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Label>Début</Label><TextInput style={styles.input} value={form.heureDebut} onChangeText={v => setForm((f: any) => ({ ...f, heureDebut: v }))} placeholder="08:00" placeholderTextColor="#6B7280" /></View>
                <View style={{ flex: 1 }}><Label>Fin</Label><TextInput style={styles.input} value={form.heureFin} onChangeText={v => setForm((f: any) => ({ ...f, heureFin: v }))} placeholder="10:00" placeholderTextColor="#6B7280" /></View>
              </View>
              <Label>Salle</Label>
              <TextInput style={styles.input} value={form.salle} onChangeText={v => setForm((f: any) => ({ ...f, salle: v }))} placeholder="Ex: A1" placeholderTextColor="#6B7280" />
              <SelectRow label="Module" items={modules} value={form.module_id} onSelect={(id: string) => setForm((f: any) => ({ ...f, module_id: id }))} getLabel={(m: any) => m.nom || m.name} />
              <SelectRow label="Groupe" items={groupes} value={form.groupe_id} onSelect={(id: string) => setForm((f: any) => ({ ...f, groupe_id: id }))} getLabel={(g: any) => g.nom || g.name} />
              <SelectRow label="Professeur" items={profs} value={form.professeur_id} onSelect={(id: string) => setForm((f: any) => ({ ...f, professeur_id: id }))} getLabel={(p: any) => `${p.prenom} ${p.nom}`} />
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#0A0F1E" /> : <Text style={styles.saveBtnText}>{editSeance ? 'Enregistrer' : 'Ajouter'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Chip({ icon, label }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1F2937', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
      <Ionicons name={icon} size={11} color="#9CA3AF" />
      <Text style={{ fontSize: 11, color: '#9CA3AF' }} numberOfLines={1}>{label}</Text>
    </View>
  );
}
function Label({ children }: any) {
  return <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8, letterSpacing: 0.5 }}>{children}</Text>;
}
function SelectRow({ label, items, value, onSelect, getLabel }: any) {
  return (
    <>
      <Label>{label}</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {items.map((item: any) => (
            <TouchableOpacity key={item.id} style={[{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#374151', backgroundColor: '#0A0F1E', maxWidth: 140 }, value === String(item.id) && { borderColor: '#06D6A0', backgroundColor: '#06D6A010' }]} onPress={() => onSelect(String(item.id))}>
              <Text style={[{ fontSize: 12, fontWeight: '600', color: '#9CA3AF' }, value === String(item.id) && { color: '#06D6A0' }]} numberOfLines={1}>{getLabel(item)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0F1E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#06D6A0', justifyContent: 'center', alignItems: 'center' },
  dayBar: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  dayChip: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: '#374151', backgroundColor: '#111827', minWidth: 52, position: 'relative' },
  dayShort: { fontSize: 15, fontWeight: '800', color: '#6B7280' },
  dayLabel: { fontSize: 9, color: '#6B7280', marginTop: 1 },
  dayCount: { position: 'absolute', top: 3, right: 3, width: 15, height: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dayCountText: { fontSize: 9, fontWeight: '700', color: '#F9FAFB' },
  todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1C1A0E', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#F59E0B30', marginBottom: 4 },
  errorText: { color: '#F59E0B', fontSize: 13, flex: 1 },
  card: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 16, borderWidth: 1, borderColor: '#374151', borderLeftWidth: 4, minHeight: 90 },
  timeCol: { width: 65, padding: 12, alignItems: 'center', justifyContent: 'space-between', borderRightWidth: 1, borderRightColor: '#1F2937' },
  timeStart: { fontSize: 13, fontWeight: '800' },
  timeLine: { flex: 1, width: 2, marginVertical: 4, borderRadius: 1 },
  timeEnd: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  duration: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  cardBody: { flex: 1, padding: 12 },
  moduleName: { fontSize: 15, fontWeight: '700', color: '#F9FAFB', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionsCol: { justifyContent: 'center', gap: 8, paddingRight: 10 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: '#00000090', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  input: { backgroundColor: '#0A0F1E', borderWidth: 1, borderColor: '#374151', borderRadius: 12, paddingHorizontal: 14, height: 48, color: '#F9FAFB', fontSize: 15, marginBottom: 16 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#374151', backgroundColor: '#0A0F1E' },
  pillActive: { borderColor: '#06D6A0', backgroundColor: '#06D6A010' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  saveBtn: { backgroundColor: '#06D6A0', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#0A0F1E' },
});
