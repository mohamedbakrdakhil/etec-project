import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={[styles.logo, { color: '#06D6A0' }]}>E</Text>
          <Text style={[styles.logo, { color: '#F9FAFB' }]}>T</Text>
          <Text style={[styles.logo, { color: '#7C3AED' }]}>E</Text>
          <Text style={[styles.logo, { color: '#0EA5E9' }]}>C</Text>
        </Animated.View>
        <ActivityIndicator
          size="large"
          color="#06D6A0"
          style={styles.spinner}
        />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0F1E' },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
  },
  spinner: {
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    letterSpacing: 1,
  },
});
