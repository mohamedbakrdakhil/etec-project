import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import Constants from 'expo-constants';

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

function getAvatarColors(role: string): [string, string] {
  switch (role) {
    case 'developpeur': return ['#7C3AED', '#4C1D95'];
    case 'admin': return ['#0EA5E9', '#0369A1'];
    case 'professeur': return ['#06D6A0', '#047857'];
    default: return ['#F59E0B', '#B45309'];
  }
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  }

  if (!user) return null;

  const initials = `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase();
  const [avatarStart, avatarEnd] = getAvatarColors(user.role);
  const roleColor = getRoleBadgeColor(user.role);

  const version = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: roleColor }]}>
            <View style={[styles.avatar, { backgroundColor: avatarStart }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.name}>{user.prenom} {user.nom}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '22', borderColor: roleColor + '44' }]}>
            <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
            <Text style={[styles.roleText, { color: roleColor }]}>
              {getRoleLabel(user.role)}
            </Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.card}>
            <InfoRow icon="person-outline" label="Prénom" value={user.prenom} />
            <View style={styles.separator} />
            <InfoRow icon="person-outline" label="Nom" value={user.nom} />
            <View style={styles.separator} />
            <InfoRow icon="mail-outline" label="Email" value={user.email} />
            <View style={styles.separator} />
            <InfoRow icon="shield-checkmark-outline" label="Rôle" value={getRoleLabel(user.role)} valueColor={roleColor} />
            <View style={styles.separator} />
            <InfoRow icon="key-outline" label="ID utilisateur" value={`#${user.id}`} valueColor="#6B7280" />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#7C3AED20' }]}>
                  <Ionicons name="moon-outline" size={18} color="#7C3AED" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Thème sombre</Text>
                  <Text style={styles.settingHint}>Mode sombre activé par défaut</Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={22} color="#06D6A0" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#0EA5E920' }]}>
                  <Ionicons name="notifications-outline" size={18} color="#0EA5E9" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <Text style={styles.settingHint}>Bientôt disponible</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.etecBranding}>
            <Text style={[styles.brandE, { color: '#06D6A0' }]}>E</Text>
            <Text style={[styles.brandT, { color: '#F9FAFB' }]}>T</Text>
            <Text style={[styles.brandE2, { color: '#7C3AED' }]}>E</Text>
            <Text style={[styles.brandC, { color: '#0EA5E9' }]}>C</Text>
          </View>
          <Text style={styles.footerText}>École des Techniques Économiques et Commerciales</Text>
          <Text style={styles.footerVersion}>Version {version} · Fès, Maroc</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color="#6B7280" style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0F1E' },
  container: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#F9FAFB' },
  name: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 4 },
  email: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  roleDot: { width: 7, height: 7, borderRadius: 3.5 },
  roleText: { fontSize: 13, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  separator: { height: 1, backgroundColor: '#1F2937', marginHorizontal: 16 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIcon: { marginRight: 10 },
  infoLabel: { fontSize: 13, color: '#9CA3AF', flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#F9FAFB', maxWidth: '50%', textAlign: 'right' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '600', color: '#F9FAFB' },
  settingHint: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderColor: '#EF444430',
    borderRadius: 14,
    height: 52,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  footer: { alignItems: 'center', paddingTop: 16, gap: 6 },
  etecBranding: { flexDirection: 'row', marginBottom: 4 },
  brandE: { fontSize: 18, fontWeight: '900' },
  brandT: { fontSize: 18, fontWeight: '900' },
  brandE2: { fontSize: 18, fontWeight: '900' },
  brandC: { fontSize: 18, fontWeight: '900' },
  footerText: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  footerVersion: { fontSize: 10, color: '#374151' },
});
