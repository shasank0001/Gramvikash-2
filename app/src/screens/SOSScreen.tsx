import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, Text, TouchableOpacity,
  Animated, Alert, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import { triggerSOS } from '../services/apiService';
import { speak } from '../services/voiceService';
import { COLORS, FONTS } from '../constants/colors';

const PRESS_HOLD_MS = 3000;

export default function SOSScreen() {
  const { user, location } = useAppStore();
  const [activated, setActivated] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (activated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      Vibration.vibrate([0, 500, 300, 500], true);
    } else {
      pulseAnim.setValue(1);
      Vibration.cancel();
    }
    return () => Vibration.cancel();
  }, [activated]);

  const beginPress = () => {
    setCountdown(3);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    let count = 3;
    countdownInterval.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval.current!);
        setCountdown(null);
        fireSOS();
      }
    }, 1000);
  };

  const cancelPress = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    setCountdown(null);
    speak("SOS cancelled.");
  };

  const fireSOS = async () => {
    setActivated(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    speak(
      "SOS alert sent! Alerting your emergency contacts and nearby users now. Stay calm, help is on the way.",
      user?.language ?? 'en'
    );

    try {
      const contacts = user?.emergencyContacts ?? [];
      const message = `Emergency SOS from ${user?.name ?? 'Unknown'} at ${user?.village ?? 'unknown location'}`;
      if (location) {
        await triggerSOS(location.latitude, location.longitude, message, contacts);
      }
    } catch (err) {
      console.error('[SOS] trigger failed:', err);
    }
  };

  const cancelSOS = () => {
    Alert.alert('Cancel SOS?', 'Are you sure you want to cancel the emergency alert?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel SOS',
        style: 'destructive',
        onPress: () => {
          setActivated(false);
          speak("SOS alert cancelled. Stay safe.");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={activated ? ['#B71C1C', '#C62828'] : ['#1B6B2F', '#2E9E4F']}
        style={styles.container}
      >
        {!activated ? (
          <>
            <MaterialIcons name="emergency" size={60} color="rgba(255,255,255,0.6)" />
            <Text style={styles.title}>Emergency SOS</Text>
            <Text style={styles.subtitle}>
              Hold the red button for 3 seconds to alert your emergency contacts and nearby
              community members.
            </Text>

            {/* Countdown indicator */}
            {countdown !== null && (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
              </View>
            )}

            {/* Hold-to-activate SOS button */}
            <Animated.View style={{ transform: [{ scale: countdown !== null ? 1.06 : 1 }] }}>
              <TouchableOpacity
                style={styles.sosButton}
                onPressIn={beginPress}
                onPressOut={cancelPress}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[COLORS.danger, '#FF1744']} style={styles.sosGradient}>
                  <MaterialIcons name="emergency" size={44} color="#fff" />
                  <Text style={styles.sosBtnText}>HOLD FOR SOS</Text>
                  <Text style={styles.sosBtnSub}>{countdown !== null ? `Sending in ${countdown}s...` : 'Hold 3 seconds'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Emergency contacts summary */}
            <View style={styles.contactsCard}>
              <MaterialIcons name="people" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.contactsText}>
                {user?.emergencyContacts?.length
                  ? `Alerts ${user.emergencyContacts.length} emergency contact(s)`
                  : 'No emergency contacts set — go to Profile to add them'}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.activatedView}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.activatedIcon}>
                <MaterialIcons name="emergency" size={56} color="#fff" />
              </View>
            </Animated.View>
            <Text style={styles.activatedTitle}>🚨 SOS ACTIVE</Text>
            <Text style={styles.activatedText}>
              Emergency alert sent to your contacts. Help is being notified.
              Your location has been shared.
            </Text>
            <TouchableOpacity style={styles.cancelSOSBtn} onPress={cancelSOS}>
              <Text style={styles.cancelSOSText}>Cancel SOS</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 },
  title: { fontSize: FONTS.sizes.xxxl, fontWeight: '900', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
  countdownBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  countdownNumber: { fontSize: 36, fontWeight: '900', color: '#fff' },
  sosButton: { borderRadius: 80 },
  sosGradient: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    elevation: 12,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  sosBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  sosBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  contactsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  contactsText: { color: 'rgba(255,255,255,0.85)', fontSize: FONTS.sizes.sm, flex: 1 },
  activatedView: { alignItems: 'center', gap: 24 },
  activatedIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center',
    elevation: 16, shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 20,
  },
  activatedTitle: { fontSize: FONTS.sizes.xxxl, fontWeight: '900', color: '#fff' },
  activatedText: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 24 },
  cancelSOSBtn: {
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  cancelSOSText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },
});
