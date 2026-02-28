/**
 * VoiceButton — Floating Action Button for voice input.
 * Hold to record, release to process.
 * Shows animated "listening" ripple when active.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAppStore } from '../store/useAppStore';
import { useVoiceNavigator } from '../navigation/useVoiceNavigator';
import { COLORS } from '../constants/colors';

export default function VoiceButton() {
  const { isListening, voiceTranscript } = useAppStore();
  const { beginListening, endListening, cancelListening } = useVoiceNavigator();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // Pulse the main button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      // Ripple waves
      const rippleLoop = Animated.loop(
        Animated.stagger(400, [
          Animated.sequence([
            Animated.timing(ripple1, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(ripple1, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple2, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(ripple2, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      rippleLoop.start();
    } else {
      pulseAnim.setValue(1);
      ripple1.setValue(0);
      ripple2.setValue(0);
    }
  }, [isListening]);

  const rippleStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Transcript bubble */}
      {isListening && voiceTranscript ? (
        <View style={styles.transcriptBubble}>
          <Text style={styles.transcriptText} numberOfLines={2}>
            {voiceTranscript}
          </Text>
        </View>
      ) : null}

      {/* Listening label */}
      {isListening && (
        <View style={styles.listeningLabel}>
          <Text style={styles.listeningText}>🎙️ Listening... release to send</Text>
        </View>
      )}

      {/* Ripple rings */}
      {isListening && (
        <>
          <Animated.View style={[styles.ripple, rippleStyle(ripple1)]} />
          <Animated.View style={[styles.ripple, rippleStyle(ripple2)]} />
        </>
      )}

      {/* Main button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onPressIn={beginListening}
          onPressOut={endListening}
          onLongPress={() => {}} // already handled by PressIn
          delayLongPress={100}
          style={({ pressed }) => [styles.buttonWrapper, pressed && styles.buttonPressed]}
        >
          <LinearGradient
            colors={isListening ? [COLORS.voice, COLORS.voiceActive] : [COLORS.primary, COLORS.primaryLight]}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons
              name={isListening ? 'mic' : 'mic-none'}
              size={30}
              color="#fff"
            />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const BUTTON_SIZE = 68;
const RIPPLE_SIZE = BUTTON_SIZE + 20;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 82,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  buttonWrapper: {
    borderRadius: BUTTON_SIZE / 2,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  ripple: {
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    backgroundColor: COLORS.voice,
    bottom: (BUTTON_SIZE - RIPPLE_SIZE) / 2,
    left: (BUTTON_SIZE - RIPPLE_SIZE) / 2,
  },
  listeningLabel: {
    backgroundColor: COLORS.voice,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  listeningText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  transcriptBubble: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 280,
    marginBottom: 8,
  },
  transcriptText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
});
