import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/LoadingScreen';

type TabConfig = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

function getTabsForRole(role: string): TabConfig[] {
  if (role === 'developpeur' || role === 'admin') {
    return [
      { name: 'index', title: 'Dashboard', icon: 'grid-outline', iconFocused: 'grid' },
      { name: 'users', title: 'Utilisateurs', icon: 'people-outline', iconFocused: 'people' },
      { name: 'absences', title: 'Absences', icon: 'calendar-outline', iconFocused: 'calendar' },
      { name: 'planning', title: 'Planning', icon: 'time-outline', iconFocused: 'time' },
      { name: 'profile', title: 'Plus', icon: 'ellipsis-horizontal-outline', iconFocused: 'ellipsis-horizontal' },
    ];
  }
  if (role === 'professeur') {
    return [
      { name: 'index', title: 'Dashboard', icon: 'home-outline', iconFocused: 'home' },
      { name: 'notes', title: 'Notes', icon: 'school-outline', iconFocused: 'school' },
      { name: 'absences', title: 'Absences', icon: 'calendar-outline', iconFocused: 'calendar' },
      { name: 'planning', title: 'Planning', icon: 'time-outline', iconFocused: 'time' },
      { name: 'profile', title: 'Profil', icon: 'person-outline', iconFocused: 'person' },
    ];
  }
  // etudiant
  return [
    { name: 'index', title: 'Accueil', icon: 'home-outline', iconFocused: 'home' },
    { name: 'notes', title: 'Notes', icon: 'school-outline', iconFocused: 'school' },
    { name: 'absences', title: 'Absences', icon: 'calendar-outline', iconFocused: 'calendar' },
    { name: 'planning', title: 'Planning', icon: 'time-outline', iconFocused: 'time' },
    { name: 'profile', title: 'Profil', icon: 'person-outline', iconFocused: 'person' },
  ];
}

export default function AppLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  if (loading || !user) return <LoadingScreen />;

  const tabs = getTabsForRole(user.role);
  const allScreens = ['index', 'notes', 'absences', 'planning', 'profile', 'users'];
  const activeNames = tabs.map(t => t.name);
  const hiddenScreens = allScreens.filter(s => !activeNames.includes(s));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#374151',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#06D6A0',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
      {hiddenScreens.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null }}
        />
      ))}
    </Tabs>
  );
}
