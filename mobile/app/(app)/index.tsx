import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const { width: W } = Dimensions.get('window');
const DAYS_FR = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const MONTHS_FR = ['jan','fév','mars','avr','mai','juin','juil','aoû','sep','oct','nov','déc'];
const DAY_COLORS = ['#06D6A0','#7C3AED','#0EA5E9','#F59E0B','#EF4444','#EC4899'];

function getRoleColor(r: string) { return ({ developpeur:'#7C3AED',admin:'#0EA5E9',professeur:'#06D6A0',etudiant:'#F59E0B' } as any)[r]||'#9CA3AF'; }
function getRoleLabel(r: string) { return ({ developpeur:'Développeur',admin:'Admin',professeur:'Professeur',etudiant:'Étudiant' } as any)[r]||r; }
function getRoleEmoji(r: string) { return ({ developpeur:'⚡',admin:'🛡️',professeur:'📚',etudiant:'🎓' } as any)[r]||'👤'; }

function AnimCounter({ value, color }: { value: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: value, duration: 900, useNativeDriver: false }).start();
    const id = anim.addListener(({ value: v }) => setDisp(Math.round(v)));
    return () => anim.removeListener(id);
  }, [value]);
  return <Text style={[st.statValue, { color }]}>{disp}</Text>;
}

function StatCard({ icon, value, label, color, onPress }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };
  return (
    <TouchableOpacity onPress={press} activeOpacity={1} style={{ width: (W - 52) / 2 }}>
      <Animated.View style={[st.statCard, { transform: [{ scale }] }]}>
        <View style={[st.statIconBg, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        {typeof value === 'number'
          ? <AnimCounter value={value} color={color} />
          : <Text style={[st.statValue, { color }]}>{value ?? '—'}</Text>}
        <Text style={st.statLabel}>{label}</Text>
        <View style={[st.statBar, { backgroundColor: color + '25' }]}>
          <View style={[st.statBarFill, { backgroundColor: color }]} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function QuickBtn({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={st.quickBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={[st.quickIcon, { backgroundColor: color + '18', borderColor: color + '50' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={st.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SessionCard({ session, color }: { session: any; color: string }) {
  const debut = (session.heureDebut || session.heure_debut || '').slice(0, 5);
  const fin = (session.heureFin || session.heure_fin || '').slice(0, 5);
  return (
    <View style={[st.sessCard, { borderLeftColor: color }]}>
      <View style={[st.sessTimeBox, { backgroundColor: color + '15' }]}>
        <Text style={[st.sessStart, { color }]}>{debut}</Text>
        <Text style={st.sessArrow}>↓</Text>
        <Text style={[st.sessEnd, { color: color + 'BB' }]}>{fin}</Text>
      </View>
      <View style={st.sessBody}>
        <Text style={st.sessModule} numberOfLines={2}>{session.module?.nom || session.moduleName || 'Module'}</Text>
        {!!(session.groupe?.nom || session.groupeName) && (
          <View style={st.sessMeta}><Ionicons name="people-outline" size={12} color="#9CA3AF" /><Text style={st.sessMetaTxt}>{session.groupe?.nom || session.groupeName}</Text></View>
        )}
        {!!session.salle && (
          <View style={st.sessMeta}><Ionicons name="location-outline" size={12} color="#9CA3AF" /><Text style={st.sessMetaTxt}>{session.salle}</Text></View>
        )}
      </View>
    </View>
  );
}

function GradeRing({ value }: { value: number | null }) {
  const color = value === null ? '#374151' : value >= 14 ? '#06D6A0' : value >= 10 ? '#F59E0B' : '#EF4444';
  const label = value === null ? 'Aucune note' : value >= 14 ? 'Bien' : value >= 10 ? 'Passable' : 'Insuffisant';
  return (
    <View style={st.ringWrap}>
      <View style={[st.ring, { borderColor: color }]}>
        <Text style={[st.ringVal, { color }]}>{value !== null ? value.toFixed(1) : '—'}</Text>
        <Text style={st.ringSlash}>/20</Text>
      </View>
      <Text style={[st.ringLabel, { color }]}>{label}</Text>
      <Text style={st.ringDesc}>Moyenne générale</Text>
    </View>
  );
}

function NoteRow({ item }: { item: any }) {
  const note = parseFloat(item.moyenne ?? item.note ?? 0);
  const color = note >= 14 ? '#06D6A0' : note >= 10 ? '#F59E0B' : '#EF4444';
  const pct = `${Math.min(note / 20, 1) * 100}%`;
  return (
    <View style={st.noteRow}>
      <Text style={st.noteModName} numberOfLines={1}>{item.module?.nom || item.nom || item.intitule || 'Module'}</Text>
      <View style={st.noteBarRow}>
        <View style={[st.noteBar, { backgroundColor: color + '25' }]}>
          <View style={[st.noteBarFill, { backgroundColor: color, width: pct as any }]} />
        </View>
        <Text style={[st.noteVal, { color }]}>{note.toFixed(1)}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [bulletin, setBulletin] = useState<any>(null);
  const [absenceSummary, setAbsenceSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const now = new Date();
  const dateStr = `${DAYS_FR[now.getDay()]} ${now.getDate()} ${MONTHS_FR[now.getMonth()]}`;
  const greet = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';
  const roleColor = getRoleColor(user?.role || '');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      if (user.role === 'admin' || user.role === 'developpeur') {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } else if (user.role === 'professeur') {
        const days = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
        const res = await api.get(`/planning?jour=${days[now.getDay()]}`);
        setSessions(Array.isArray(res.data) ? res.data : (res.data?.seances || res.data?.data || []));
      } else {
        const [bR, aR] = await Promise.allSettled([api.get('/notes/bulletin'), api.get('/absences/summary')]);
        if (bR.status === 'fulfilled') setBulletin(bR.value.data);
        if (aR.status === 'fulfilled') setAbsenceSummary(aR.value.data);
      }
    } catch { setError('Impossible de charger les données.'); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }, [fetchData]);

  const isAdmin = user?.role === 'admin' || user?.role === 'developpeur';
  const isProf = user?.role === 'professeur';
  const todayColor = DAY_COLORS[Math.max(0, now.getDay() - 1)] || '#06D6A0';

  function getMoy(): number | null {
    if (!bulletin) return null;
    if (typeof bulletin.moyenne === 'number') return bulletin.moyenne;
    if (typeof bulletin.moyenneGenerale === 'number') return bulletin.moyenneGenerale;
    const mods: any[] = bulletin.modules || bulletin.notes || [];
    if (!mods.length) return null;
    return mods.reduce((a: number, m: any) => a + parseFloat(m.moyenne || m.note || 0), 0) / mods.length;
  }
  function getTotalAbs(): number {
    if (!absenceSummary) return 0;
    if (typeof absenceSummary.total === 'number') return absenceSummary.total;
    const arr = Array.isArray(absenceSummary) ? absenceSummary : (absenceSummary.absences || []);
    return arr.reduce((a: number, x: any) => a + (x.total || 0), 0);
  }
  const modules: any[] = bulletin?.modules || bulletin?.notes || [];

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView
        contentContainerStyle={st.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06D6A0" />}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <Animated.View style={[st.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[st.heroBg, { backgroundColor: roleColor + '12' }]} />
          <View style={st.heroRow}>
            <View style={st.heroLeft}>
              <Text style={st.heroDate}>{dateStr}</Text>
              <Text style={st.heroGreet}>{greet} 👋</Text>
              <Text style={[st.heroName, { color: roleColor }]}>{user?.prenom} {user?.nom}</Text>
            </View>
            <View style={[st.avatar, { backgroundColor: roleColor + '22', borderColor: roleColor + '55' }]}>
              <Text style={st.avatarEmoji}>{getRoleEmoji(user?.role || '')}</Text>
              <View style={[st.avatarBadge, { backgroundColor: roleColor }]}>
                <Text style={st.avatarBadgeTxt}>{(user?.prenom || '?').charAt(0)}</Text>
              </View>
            </View>
          </View>
          <View style={[st.rolePill, { backgroundColor: roleColor + '18', borderColor: roleColor + '45' }]}>
            <View style={[st.roleDot, { backgroundColor: roleColor }]} />
            <Text style={[st.roleText, { color: roleColor }]}>{getRoleLabel(user?.role || '')}</Text>
          </View>
        </Animated.View>

        {error !== '' && (
          <View style={st.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#F59E0B" />
            <Text style={st.errorTxt}>{error}</Text>
            <TouchableOpacity onPress={fetchData}><Text style={st.retryTxt}>Réessayer</Text></TouchableOpacity>
          </View>
        )}

        {/* ADMIN / DEV */}
        {isAdmin && (
          <>
            <Text style={st.section}>Vue d'ensemble</Text>
            <View style={st.grid}>
              <StatCard icon="people" value={stats?.etudiants ?? stats?.students} label="Étudiants" color="#06D6A0" onPress={() => router.push('/(app)/users')} />
              <StatCard icon="person" value={stats?.professeurs ?? stats?.profs} label="Professeurs" color="#7C3AED" onPress={() => router.push('/(app)/users')} />
              <StatCard icon="albums" value={stats?.groupes ?? stats?.groups} label="Groupes" color="#0EA5E9" />
              <StatCard icon="book" value={stats?.filieres} label="Filières" color="#F59E0B" />
              <StatCard icon="library" value={stats?.modules} label="Modules" color="#EF4444" />
              <StatCard icon="time" value={stats?.seances ?? stats?.sessions} label="Séances" color="#10B981" onPress={() => router.push('/(app)/planning')} />
            </View>
            <Text style={st.section}>Accès rapides</Text>
            <View style={st.quickRow}>
              <QuickBtn icon="people" label="Utilisateurs" color="#7C3AED" onPress={() => router.push('/(app)/users')} />
              <QuickBtn icon="calendar-outline" label="Absences" color="#EF4444" onPress={() => router.push('/(app)/absences')} />
              <QuickBtn icon="time-outline" label="Planning" color="#0EA5E9" onPress={() => router.push('/(app)/planning')} />
            </View>
          </>
        )}

        {/* PROF */}
        {isProf && (
          <>
            <View style={st.sectionRow}>
              <Text style={st.section}>Aujourd'hui</Text>
              <View style={[st.countBadge, { backgroundColor: todayColor + '20' }]}>
                <Text style={[st.countTxt, { color: todayColor }]}>{sessions.length} séance{sessions.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            {sessions.length === 0
              ? <View style={st.emptyDay}><Text style={st.emptyEmoji}>☀️</Text><Text style={st.emptyTitle}>Journée libre !</Text><Text style={st.emptyText}>Aucune séance programmée aujourd'hui</Text></View>
              : sessions.map((ss, i) => <SessionCard key={ss.id || i} session={ss} color={DAY_COLORS[i % DAY_COLORS.length]} />)
            }
            <Text style={st.section}>Accès rapides</Text>
            <View style={st.quickRow}>
              <QuickBtn icon="school-outline" label="Notes" color="#06D6A0" onPress={() => router.push('/(app)/notes')} />
              <QuickBtn icon="calendar-outline" label="Absences" color="#EF4444" onPress={() => router.push('/(app)/absences')} />
              <QuickBtn icon="time-outline" label="Planning" color="#0EA5E9" onPress={() => router.push('/(app)/planning')} />
            </View>
          </>
        )}

        {/* ÉTUDIANT */}
        {!isAdmin && !isProf && (
          <>
            <View style={st.etuTop}>
              <GradeRing value={getMoy()} />
              <View style={st.etuRight}>
                <View style={st.absCard}>
                  <Ionicons name="calendar" size={22} color="#EF4444" />
                  <Text style={[st.absVal, { color: '#EF4444' }]}>{getTotalAbs()}</Text>
                  <Text style={st.absLbl}>Absences</Text>
                </View>
                <View style={[st.absCard, { backgroundColor: '#06D6A010', borderColor: '#06D6A030' }]}>
                  <Ionicons name="library-outline" size={22} color="#06D6A0" />
                  <Text style={[st.absVal, { color: '#06D6A0' }]}>{modules.length}</Text>
                  <Text style={st.absLbl}>Modules</Text>
                </View>
              </View>
            </View>
            {modules.length > 0 && (
              <>
                <Text style={st.section}>Mes notes</Text>
                <View style={st.notesList}>
                  {modules.map((m: any, i: number) => <NoteRow key={i} item={m} />)}
                </View>
              </>
            )}
            <Text style={st.section}>Accès rapides</Text>
            <View style={st.quickRow}>
              <QuickBtn icon="school-outline" label="Notes" color="#06D6A0" onPress={() => router.push('/(app)/notes')} />
              <QuickBtn icon="calendar-outline" label="Absences" color="#EF4444" onPress={() => router.push('/(app)/absences')} />
              <QuickBtn icon="time-outline" label="Planning" color="#0EA5E9" onPress={() => router.push('/(app)/planning')} />
            </View>
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060B18' },
  scroll: { paddingBottom: 32 },
  hero: { margin: 16, borderRadius: 24, padding: 20, backgroundColor: '#0D1525', borderWidth: 1, borderColor: '#1E2A3A', overflow: 'hidden' },
  heroBg: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroLeft: { flex: 1 },
  heroDate: { fontSize: 12, color: '#6B7280', letterSpacing: 0.5, marginBottom: 4 },
  heroGreet: { fontSize: 14, color: '#9CA3AF', marginBottom: 4 },
  heroName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 28 },
  avatarBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#060B18' },
  avatarBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#060B18' },
  rolePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 6 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1A0E', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 8, gap: 8, borderWidth: 1, borderColor: '#F59E0B30' },
  errorTxt: { flex: 1, fontSize: 13, color: '#F59E0B' },
  retryTxt: { fontSize: 12, color: '#06D6A0', fontWeight: '700' },
  section: { fontSize: 17, fontWeight: '800', color: '#F9FAFB', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  countBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countTxt: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  statCard: { backgroundColor: '#0D1525', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1E2A3A' },
  statIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 12 },
  statBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  statBarFill: { height: 4, borderRadius: 2, width: '60%' },
  quickRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  quickBtn: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: { width: 58, height: 58, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },
  sessCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#0D1525', borderRadius: 18, borderWidth: 1, borderColor: '#1E2A3A', borderLeftWidth: 4, flexDirection: 'row', overflow: 'hidden' },
  sessTimeBox: { width: 68, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 2 },
  sessStart: { fontSize: 14, fontWeight: '800' },
  sessArrow: { fontSize: 10, color: '#4B5563' },
  sessEnd: { fontSize: 12, fontWeight: '600' },
  sessBody: { flex: 1, padding: 14, justifyContent: 'center' },
  sessModule: { fontSize: 15, fontWeight: '700', color: '#F9FAFB', marginBottom: 6 },
  sessMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sessMetaTxt: { fontSize: 12, color: '#9CA3AF' },
  emptyDay: { marginHorizontal: 16, backgroundColor: '#0D1525', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#1E2A3A', marginBottom: 4 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#F9FAFB', marginBottom: 4 },
  emptyText: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  etuTop: { flexDirection: 'row', marginHorizontal: 16, gap: 12, alignItems: 'center', marginTop: 8 },
  ringWrap: { alignItems: 'center', gap: 6 },
  ring: { width: 120, height: 120, borderRadius: 60, borderWidth: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1525' },
  ringVal: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  ringSlash: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  ringLabel: { fontSize: 13, fontWeight: '700' },
  ringDesc: { fontSize: 11, color: '#6B7280' },
  etuRight: { flex: 1, gap: 10 },
  absCard: { backgroundColor: '#1A0E0E', borderWidth: 1, borderColor: '#EF444430', borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  absVal: { fontSize: 26, fontWeight: '900' },
  absLbl: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  notesList: { marginHorizontal: 16, backgroundColor: '#0D1525', borderRadius: 20, borderWidth: 1, borderColor: '#1E2A3A', overflow: 'hidden' },
  noteRow: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E2A3A' },
  noteModName: { fontSize: 13, fontWeight: '700', color: '#E5E7EB', marginBottom: 8 },
  noteBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  noteBarFill: { height: 6, borderRadius: 3 },
  noteVal: { fontSize: 14, fontWeight: '800', width: 32 },
});
