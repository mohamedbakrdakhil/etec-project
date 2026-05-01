import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import EmptyState from '../../components/EmptyState';

const DAYS = [
  { key: 'lundi', label: 'Lun', full: 'Lundi' },
  { key: 'mardi', label: 'Mar', full: 'Mardi' },
  { key: 'mercredi', label: 'Mer', full: 'Mercredi' },
  { key: 'jeudi', label: 'Jeu', full: 'Jeudi' },
  { key: 'vendredi', label: 'Ven', full: 'Vendredi' },
  { key: 'samedi', label: 'Sam', full: 'Samedi' },
];

const DAY_JS_MAP: Record<number, string> = {
  0: 'dimanche',
  1: 'lundi',
  2: 'mardi',
  3: 'mercredi',
  4: 'jeudi',
  5: 'vendredi',
  6: 'samedi',
};

const MODULE_COLORS = [
  '#06D6A0', '#7C3AED', '#0EA5E9', '#F59E0B',
  '#EF4444', '#10B981', '#EC4899', '#8B5CF6',
];

function getModuleColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return MODULE_COLORS[hash % MODULE_COLORS.length];
}

export default function PlanningScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [ratingModal, setRatingModal] = useState<{ visible: boolean; session: any | null }>({
    visible: false,
    session: null,
  });
  const [selectedRating, setSelectedRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const todayKey = DAY_JS_MAP[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(
    DAYS.find(d => d.key === todayKey)?.key || 'lundi'
  );

  const fetchSessions = useCallback(async (day: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/planning?jour=${day}`);
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data?.seances || res.data?.data || []);
      setSessions(data);
    } catch (_) {
      setError('Impossible de charger le planning.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(selectedDay); }, [selectedDay]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessions(selectedDay);
    setRefreshing(false);
  }, [selectedDay, fetchSessions]);

  function openRating(session: any) {
    setSelectedRating(0);
    setRatingModal({ visible: true, session });
  }

  async function submitRating() {
    if (selectedRating === 0) {
      Alert.alert('Note requise', 'Veuillez sélectionner une note de 1 à 10.');
      return;
    }
    setSubmittingRating(true);
    try {
      await api.post('/planning/rate', {
        seance_id: ratingModal.session?.id,
        note: selectedRating,
      });
      Alert.alert('Merci !', 'Votre évaluation a été enregistrée.');
      setRatingModal({ visible: false, session: null });
    } catch (_) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'évaluation.');
    } finally {
      setSubmittingRating(false);
    }
  }

  const isEtudiant = user?.role === 'etudiant';
  const now = new Date();
  const currentHour = now.getHours() * 60 + now.getMinutes();

  function isPastSession(session: any): boolean {
    const timeStr = session.heureFin || session.heure_fin || '';
    if (!timeStr) return false;
    const parts = timeStr.split(':');
    if (parts.length < 2) return false;
    const sessionEnd = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return selectedDay === todayKey && sessionEnd < currentHour;
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Planning</Text>
        {loading && <ActivityIndicator size="small" color="#06D6A0" />}
      </View>

      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayScroll}
        style={styles.dayScrollContainer}
      >
        {DAYS.map((day) => {
          const isSelected = selectedDay === day.key;
          const isToday = day.key === todayKey;
          return (
            <TouchableOpacity
              key={day.key}
              style={[
                styles.dayChip,
                isSelected && styles.dayChipSelected,
                isToday && !isSelected && styles.dayChipToday,
              ]}
              onPress={() => setSelectedDay(day.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.dayChipLabel,
                isSelected && styles.dayChipLabelSelected,
                isToday && !isSelected && styles.dayChipLabelToday,
              ]}>
                {day.label}
              </Text>
              {isToday && (
                <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error !== '' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Sessions list */}
      <FlatList
        data={sessions}
        keyExtractor={(item, i) => String(item.id || i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              emoji="📅"
              title="Aucune séance"
              subtitle={`Pas de cours ce ${DAYS.find(d => d.key === selectedDay)?.full || selectedDay}`}
            />
          )
        }
        renderItem={({ item }) => {
          const isCancelled = item.annule || item.cancelled || item.statut === 'annule';
          const isPast = isPastSession(item);
          const moduleName = item.module?.nom || item.moduleName || 'Module';
          const color = getModuleColor(moduleName);
          const profName = item.professeur
            ? `${item.professeur.prenom} ${item.professeur.nom}`
            : item.profName || '';
          const groupeName = item.groupe?.nom || item.groupeName || '';

          return (
            <View style={[
              styles.sessionCard,
              isCancelled && styles.sessionCancelled,
            ]}>
              <View style={[styles.sessionBorder, { backgroundColor: isCancelled ? '#374151' : color }]} />
              <View style={styles.sessionBody}>
                <View style={styles.sessionTopRow}>
                  <Text style={[styles.sessionModule, isCancelled && styles.textMuted]} numberOfLines={1}>
                    {moduleName}
                  </Text>
                  {isCancelled && (
                    <View style={styles.cancelBadge}>
                      <Text style={styles.cancelBadgeText}>ANNULÉ</Text>
                    </View>
                  )}
                  {isPast && !isCancelled && isEtudiant && (
                    <TouchableOpacity
                      style={styles.rateButton}
                      onPress={() => openRating(item)}
                    >
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.rateButtonText}>Évaluer</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.sessionMeta}>
                  <Ionicons name="time-outline" size={13} color="#6B7280" />
                  <Text style={styles.sessionMetaText}>
                    {item.heureDebut || item.heure_debut || ''} – {item.heureFin || item.heure_fin || ''}
                  </Text>
                </View>

                {profName !== '' && (
                  <View style={styles.sessionMeta}>
                    <Ionicons name="person-outline" size={13} color="#6B7280" />
                    <Text style={styles.sessionMetaText}>{profName}</Text>
                  </View>
                )}

                <View style={styles.sessionBottomRow}>
                  {groupeName !== '' && (
                    <View style={styles.sessionTag}>
                      <Text style={styles.sessionTagText}>{groupeName}</Text>
                    </View>
                  )}
                  {item.salle && (
                    <View style={styles.sessionTag}>
                      <Ionicons name="location-outline" size={11} color="#9CA3AF" />
                      <Text style={styles.sessionTagText}>{item.salle}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Rating Modal */}
      <Modal
        visible={ratingModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setRatingModal({ visible: false, session: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Évaluer la séance</Text>
              <TouchableOpacity onPress={() => setRatingModal({ visible: false, session: null })}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalModule}>
              {ratingModal.session?.module?.nom || 'Module'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Donnez une note de 1 à 10 pour cette séance
            </Text>

            <View style={styles.ratingGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.ratingButton,
                    selectedRating === n && styles.ratingButtonSelected,
                    n <= 4 && styles.ratingBad,
                    n >= 5 && n <= 7 && styles.ratingMid,
                    n >= 8 && styles.ratingGood,
                    selectedRating === n && { borderWidth: 2, borderColor: '#06D6A0' },
                  ]}
                  onPress={() => setSelectedRating(n)}
                >
                  <Text style={[
                    styles.ratingButtonText,
                    selectedRating === n && { color: '#06D6A0', fontWeight: '800' },
                  ]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submittingRating && { opacity: 0.7 }]}
              onPress={submitRating}
              disabled={submittingRating}
            >
              {submittingRating ? (
                <ActivityIndicator color="#0A0F1E" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Envoyer l'évaluation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0F1E' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  dayScrollContainer: { maxHeight: 70 },
  dayScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  dayChip: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    minWidth: 52,
  },
  dayChipSelected: {
    backgroundColor: '#06D6A0',
    borderColor: '#06D6A0',
  },
  dayChipToday: {
    borderColor: '#06D6A060',
  },
  dayChipLabel: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  dayChipLabelSelected: { color: '#0A0F1E' },
  dayChipLabelToday: { color: '#06D6A0' },
  todayDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#06D6A0', marginTop: 3 },
  todayDotSelected: { backgroundColor: '#0A0F1E' },
  errorBanner: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#1F0E0E',
    borderRadius: 10,
    marginBottom: 8,
  },
  errorText: { color: '#EF4444', fontSize: 13 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  sessionCancelled: { opacity: 0.5 },
  sessionBorder: { width: 4 },
  sessionBody: { flex: 1, padding: 14 },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  sessionModule: { fontSize: 15, fontWeight: '700', color: '#F9FAFB', flex: 1 },
  textMuted: { color: '#6B7280' },
  cancelBadge: {
    backgroundColor: '#EF444420',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cancelBadgeText: { fontSize: 10, fontWeight: '800', color: '#EF4444', letterSpacing: 1 },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rateButtonText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  sessionMetaText: { fontSize: 12, color: '#9CA3AF' },
  sessionBottomRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  sessionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sessionTagText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  modalModule: { fontSize: 15, fontWeight: '600', color: '#06D6A0', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 24,
  },
  ratingButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  ratingButtonSelected: { backgroundColor: '#06D6A010' },
  ratingBad: { borderColor: '#EF444440' },
  ratingMid: { borderColor: '#F59E0B40' },
  ratingGood: { borderColor: '#06D6A040' },
  ratingButtonText: { fontSize: 16, fontWeight: '700', color: '#F9FAFB' },
  submitButton: {
    backgroundColor: '#06D6A0',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#0A0F1E' },
});
