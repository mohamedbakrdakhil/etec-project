import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'developpeur': return '#7C3AED';
    case 'admin': return '#0EA5E9';
    case 'professeur': return '#06D6A0';
    default: return '#F59E0B';
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'developpeur': return 'Développeur';
    case 'admin': return 'Administrateur';
    case 'professeur': return 'Professeur';
    case 'etudiant': return 'Étudiant';
    default: return role;
  }
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [bulletin, setBulletin] = useState<any>(null);
  const [absenceSummary, setAbsenceSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const now = new Date();
  const dateStr = `${DAYS_FR[now.getDay()]} ${now.getDate()} ${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`;

  const fetchData = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      if (user.role === 'admin' || user.role === 'developpeur') {
        const res = await api.get('/dashboard/stats');
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStats(res.data);
      } else if (user.role === 'professeur') {
        try {
          const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
          const today = dayNames[now.getDay()];
          const res = await api.get(`/planning?jour=${today}`);
          const data = Array.isArray(res.data) ? res.data : (res.data?.seances || res.data?.data || []);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSessions(data);
        } catch (_) {
          setSessions([]);
        }
      } else if (user.role === 'etudiant') {
        const [bRes, aRes] = await Promise.allSettled([
          api.get('/notes/bulletin'),
          api.get('/absences/summary'),
        ]);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (bRes.status === 'fulfilled') setBulletin(bRes.value.data);
        if (aRes.status === 'fulfilled') setAbsenceSummary(aRes.value.data);
      }
    } catch (err: any) {
      setError('Impossible de charger les données.');
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const isAdminOrDev = user?.role === 'admin' || user?.role === 'developpeur';
  const isProf = user?.role === 'professeur';
  const isEtudiant = user?.role === 'etudiant';

  function getMoyenne() {
    if (!bulletin) return null;
    if (typeof bulletin.moyenne === 'number') return bulletin.moyenne;
    if (typeof bulletin.moyenneGenerale === 'number') return bulletin.moyenneGenerale;
    if (Array.isArray(bulletin.modules) && bulletin.modules.length > 0) {
      const sum = bulletin.modules.reduce((acc: number, m: any) => acc + (m.moyenne || 0), 0);
      return (sum / bulletin.modules.length).toFixed(2);
    }
    return null;
  }

  function getTotalAbsences() {
    if (!absenceSummary) return null;
    if (typeof absenceSummary.total === 'number') return absenceSummary.total;
    if (Array.isArray(absenceSummary.absences)) {
      return absenceSummary.absences.reduce((acc: number, a: any) => acc + (a.total || 0), 0);
    }
    if (Array.isArray(absenceSummary)) {
      return absenceSummary.reduce((acc: number, a: any) => acc + (a.total || 0), 0);
    }
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.greeting}>
              Bonjour, <Text style={styles.greetingName}>{user?.prenom}</Text> 👋
            </Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user?.role || '') + '22' }]}>
            <Text style={[styles.roleText, { color: getRoleBadgeColor(user?.role || '') }]}>
              {getRoleLabel(user?.role || '')}
            </Text>
          </View>
        </View>

        {error !== '' && (
          <View style={styles.errorBanner}>
            <Ionicons name="wifi-outline" size={16} color="#F59E0B" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* ADMIN / DEV: Stats Grid */}
        {isAdminOrDev && (
          <>
            <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="people"
                value={stats?.etudiants ?? stats?.students ?? '—'}
                label="Étudiants"
                color="#06D6A0"
              />
              <StatCard
                icon="person"
                value={stats?.professeurs ?? stats?.professors ?? stats?.profs ?? '—'}
                label="Professeurs"
                color="#7C3AED"
              />
              <StatCard
                icon="albums"
                value={stats?.groupes ?? stats?.groups ?? '—'}
                label="Groupes"
                color="#0EA5E9"
              />
              <StatCard
                icon="book"
                value={stats?.filieres ?? stats?.filières ?? '—'}
                label="Filières"
                color="#F59E0B"
              />
              <StatCard
                icon="library"
                value={stats?.modules ?? '—'}
                label="Modules"
                color="#EF4444"
              />
              <StatCard
                icon="calendar"
                value={stats?.seances ?? stats?.sessions ?? '—'}
                label="Séances"
                color="#10B981"
              />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.quickActions}>
              <QuickAction icon="people" label="Utilisateurs" color="#7C3AED" onPress={() => router.push('/(app)/users')} />
              <QuickAction icon="calendar" label="Absences" color="#EF4444" onPress={() => router.push('/(app)/absences')} />
              <QuickAction icon="time" label="Planning" color="#0EA5E9" onPress={() => router.push('/(app)/planning')} />
            </View>
          </>
        )}

        {/* PROF: Today's sessions */}
        {isProf && (
          <>
            <Text style={styles.sectionTitle}>Séances d'aujourd'hui</Text>
            {sessions.length === 0 ? (
              <EmptyState
                emoji="📅"
                title="Aucune séance aujourd'hui"
                subtitle="Votre journée est libre"
              />
            ) : (
              sessions.map((session: any, idx: number) => (
                <SessionCard key={session.id || idx} session={session} />
              ))
            )}
          </>
        )}

        {/* ETUDIANT: Stats */}
        {isEtudiant && (
          <>
            <Text style={styles.sectionTitle}>Mon résumé</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="school"
                value={getMoyenne() !== null ? String(getMoyenne()) : '—'}
                label="Moyenne générale"
                color="#06D6A0"
              />
              <StatCard
                icon="calendar"
                value={getTotalAbsences() !== null ? String(getTotalAbsences()) : '—'}
                label="Absences"
                color="#EF4444"
              />
            </View>

            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.quickActions}>
              <QuickAction icon="school" label="Mes notes" color="#06D6A0" onPress={() => router.push('/(app)/notes')} />
              <QuickAction icon="calendar" label="Absences" color="#EF4444" onPress={() => router.push('/(app)/absences')} />
              <QuickAction icon="time" label="Planning" color="#0EA5E9" onPress={() => router.push('/(app)/planning')} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.quickActionCard, { borderColor: color + '40' }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SessionCard({ session }: { session: any }) {
  const isCancelled = session.annule || session.cancelled || session.statut === 'annule';
  return (
    <View style={[styles.sessionCard, isCancelled && styles.sessionCardCancelled]}>
      <View style={[styles.sessionBorder, { backgroundColor: '#06D6A0' }]} />
      <View style={styles.sessionContent}>
        <View style={styles.sessionRow}>
          <Text style={[styles.sessionModule, isCancelled && styles.textMuted]}>
            {session.module?.nom || session.moduleName || 'Module'}
          </Text>
          {isCancelled && (
            <View style={styles.cancelBadge}>
              <Text style={styles.cancelBadgeText}>ANNULÉ</Text>
            </View>
          )}
        </View>
        <Text style={styles.sessionMeta}>
          {session.heureDebut || session.heure_debut || ''} – {session.heureFin || session.heure_fin || ''} · {session.groupe?.nom || session.groupeName || ''}
        </Text>
        {session.salle && <Text style={styles.sessionMeta}>Salle: {session.salle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0F1E' },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  dateText: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#F9FAFB' },
  greetingName: { color: '#06D6A0' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1A0E',
    borderWidth: 1,
    borderColor: '#F59E0B30',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorBannerText: { fontSize: 13, color: '#F59E0B', flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textAlign: 'center' },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
    overflow: 'hidden',
  },
  sessionCardCancelled: { opacity: 0.5 },
  sessionBorder: { width: 4 },
  sessionContent: { flex: 1, padding: 14 },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sessionModule: { fontSize: 15, fontWeight: '700', color: '#F9FAFB', flex: 1 },
  sessionMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  textMuted: { color: '#6B7280' },
  cancelBadge: { backgroundColor: '#EF444420', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cancelBadgeText: { fontSize: 10, fontWeight: '700', color: '#EF4444', letterSpacing: 1 },
});
