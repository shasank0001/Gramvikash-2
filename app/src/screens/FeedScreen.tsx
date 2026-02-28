import React, { useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import WeatherAlertStrip from '../components/WeatherAlertStrip';
import ChatBubble from '../components/ChatBubble';
import { useAppStore, HomeChatMessage } from '../store/useAppStore';
import { COLORS, FONTS } from '../constants/colors';
import { getCurrentLocation } from '../services/locationService';
import { fetchWeather } from '../services/apiService';
import {
  startRecording,
  stopRecording,
  transcribeAudioFile,
  parseIntent,
  speak,
  cancelRecording,
} from '../services/voiceService';
import { askCoPilotDirect, ChatMessage as GPTMessage } from '../services/openaiClient';
import { navigate } from '../navigation/navigationRef';

export default function FeedScreen() {
  const {
    weatherAlerts,
    setWeatherAlerts,
    location,
    setLocation,
    isOffline,
    setIsOffline,
    isListening,
    setIsListening,
    homeChatMessages,
    addHomeChatMessage,
    updateHomeChatMessage,
    clearHomeChat,
    user,
  } = useAppStore();

  const listRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initLocation();
    if (homeChatMessages.length === 0) {
      addHomeChatMessage({
        id: 'welcome',
        role: 'assistant',
        content:
          'Namaste! 🙏 I\'m your Gramvikash voice assistant.\n\nPress and hold the mic button to speak. You can:\n\n• 🌾 "Sell 50 kg wheat at ₹28"\n• 🏥 "My crop has yellow spots"\n• 📋 "Check government schemes"\n• 🆘 "Emergency help"\n• 🌤️ "What\'s the weather?"',
        timestamp: Date.now(),
      });
    }
  }, []);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
  }, [homeChatMessages]);

  // Mic animation
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
      Animated.loop(
        Animated.stagger(400, [
          Animated.sequence([
            Animated.timing(ripple1, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(ripple1, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple2, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(ripple2, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
      ripple1.setValue(0);
      ripple2.setValue(0);
    }
  }, [isListening]);

  const initLocation = async () => {
    let coords = location;
    if (!coords) {
      const loc = await getCurrentLocation();
      if (loc) {
        coords = { ...loc, radiusKm: 10 };
        setLocation(coords);
      }
    }
    if (coords) {
      try {
        const weatherData = await fetchWeather(coords.latitude, coords.longitude);
        setWeatherAlerts(weatherData.alerts ?? []);
        setIsOffline(false);
      } catch {
        setIsOffline(true);
      }
    }
  };

  const beginListening = async () => {
    try {
      setIsListening(true);
      await startRecording();
    } catch {
      setIsListening(false);
      speak('Microphone not available. Please check permissions.', user?.language ?? 'en');
    }
  };

  const endListening = async () => {
    setIsListening(false);
    const audioUri = await stopRecording();
    if (!audioUri) {
      speak('Could not capture audio. Please try again.', user?.language ?? 'en');
      return;
    }

    // Show loading bubble while transcribing
    const loadingId = `loading-${Date.now()}`;
    addHomeChatMessage({
      id: loadingId,
      role: 'user',
      content: '🎙️ Transcribing...',
      timestamp: Date.now(),
      isLoading: true,
    });

    try {
      const { text, language } = await transcribeAudioFile(audioUri);

      if (!text.trim()) {
        updateHomeChatMessage(loadingId, {
          content: '(Could not hear clearly)',
          isLoading: false,
        });
        addHomeChatMessage({
          id: `resp-${Date.now()}`,
          role: 'assistant',
          content: 'I couldn\'t hear you clearly. Please speak louder and try again.',
          timestamp: Date.now(),
        });
        speak('I could not hear you clearly. Please speak louder and try again.', user?.language ?? 'en');
        return;
      }

      // Update user bubble with actual transcript
      updateHomeChatMessage(loadingId, {
        content: text,
        isLoading: false,
      });

      // Show processing bubble
      const procId = `proc-${Date.now()}`;
      addHomeChatMessage({
        id: procId,
        role: 'assistant',
        content: 'Processing...',
        timestamp: Date.now(),
        isLoading: true,
      });

      // Parse intent
      const intent = await parseIntent(text, language, isOffline);

      // Build response content
      let responseContent = intent.speakResponse || 'Done.';
      let intentLabel: string = intent.action;

      // If it's a general question or crop diagnosis, get a richer AI response
      if (intent.action === 'DIAGNOSE_CROP' || intent.action === 'UNKNOWN') {
        try {
          const history: GPTMessage[] = homeChatMessages
            .filter((m) => m.role !== 'system' && !m.isLoading)
            .slice(-6)
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

          const aiReply = await askCoPilotDirect(text, undefined, history);
          responseContent = aiReply;
          intentLabel = intent.action === 'UNKNOWN' ? 'AI_ANSWER' : intentLabel;
        } catch {
          // Fall back to intent response
        }
      }

      // Update the processing bubble with actual response
      updateHomeChatMessage(procId, {
        content: responseContent,
        isLoading: false,
        intent: intentLabel,
      });

      // Handle navigation
      if (intent.action === 'SELL_CROP' && intent.params) {
        const p = intent.params as { crop?: string; price?: number; quantity?: number; unit?: string };
        const crop = p.crop ?? 'produce';
        const qty = p.quantity ?? 0;
        const unit = p.unit ?? 'kg';
        const price = p.price ?? 0;
        const CROP_ICONS: Record<string, string> = {
          wheat: '🌾', rice: '🌾', tomato: '🍅', onion: '🧅', potato: '🥔',
          soybean: '🌻', cotton: '🪡', maize: '🌽', garlic: '🧄', chilli: '🌶️',
          turmeric: '🟡', sugarcane: '🍬', coconut: '🥥', coriander: '🌿',
          dal: '🟢', pulses: '🟤',
        };
        const iconKey = Object.keys(CROP_ICONS).find((k) => crop.toLowerCase().includes(k));
        const icon = iconKey ? CROP_ICONS[iconKey] : '🌱';

        // Add listing to mandi
        const { addMandiListing } = useAppStore.getState();
        addMandiListing({
          id: `v-${Date.now()}`,
          authorId: user?.id ?? 'voice-user',
          authorName: user?.name ?? 'Farmer',
          authorTrust: user?.trustScore ?? 80,
          tag: 'mandi',
          text: `${icon} Selling ${crop}${qty > 0 ? ` – ${qty} ${unit} available` : ''}${price > 0 ? ` at ₹${price}/${unit}` : ''}. Fresh from farm. Listed via voice.`,
          timestamp: Date.now(),
          location: { lat: 19.076, lng: 72.877 },
          likes: 0,
          commentCount: 0,
          inventory: { total: qty || 100, remaining: qty || 100, unit },
          bids: [],
          aiAnalysis: price > 0 ? `Voice-listed at ₹${price}/${unit}` : 'Listed via voice command',
        });

        addHomeChatMessage({
          id: `nav-${Date.now()}`,
          role: 'system',
          content: `✅ ${crop} listing added to Mandi. Navigating...`,
          timestamp: Date.now(),
        });

        setTimeout(() => navigate('Mandi'), 1500);
      } else if (intent.screen && intent.action !== 'UNKNOWN' && intent.action !== 'DIAGNOSE_CROP') {
        addHomeChatMessage({
          id: `nav-${Date.now()}`,
          role: 'system',
          content: `Navigating to ${intent.screen}...`,
          timestamp: Date.now(),
        });
        setTimeout(() => navigate(intent.screen as any), 1500);
      }

      speak(responseContent, language ?? user?.language ?? 'en');
    } catch (err) {
      console.error('[FeedScreen] voice pipeline error:', err);
      updateHomeChatMessage(loadingId, {
        content: '(Voice processing failed)',
        isLoading: false,
      });
      addHomeChatMessage({
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong. Please check your internet and try again.',
        timestamp: Date.now(),
      });
      speak('Something went wrong. Please check your internet and try again.', user?.language ?? 'en');
    }
  };

  const rippleStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.2, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Gramvikash</Text>
            <Text style={styles.headerSub}>
              {isOffline ? '⚠️ Offline mode' : `📍 ${location ? `${location.radiusKm}km radius` : 'Locating...'}`}
            </Text>
          </View>
          <TouchableOpacity onPress={clearHomeChat} style={styles.clearBtn}>
            <MaterialIcons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Weather alerts */}
      <WeatherAlertStrip alerts={weatherAlerts} />

      {/* Chat messages */}
      <FlatList
        ref={listRef}
        data={homeChatMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="chat" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Start a conversation</Text>
            <Text style={styles.emptySubText}>Press and hold the mic button to speak</Text>
          </View>
        }
      />

      {/* Listening indicator */}
      {isListening && (
        <View style={styles.listeningBar}>
          <View style={styles.listeningDot} />
          <Text style={styles.listeningText}>Listening... release to send</Text>
        </View>
      )}

      {/* Bottom voice input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <View style={styles.inputHintContainer}>
            <MaterialIcons name="mic" size={18} color={COLORS.textLight} />
            <Text style={styles.inputHint}>
              {isListening ? '🔴 Recording...' : 'Hold mic to speak'}
            </Text>
          </View>

          {/* Mic button with ripple */}
          <View style={styles.micContainer}>
            {isListening && (
              <>
                <Animated.View style={[styles.ripple, rippleStyle(ripple1)]} />
                <Animated.View style={[styles.ripple, rippleStyle(ripple2)]} />
              </>
            )}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Pressable
                onPressIn={beginListening}
                onPressOut={endListening}
                style={({ pressed }) => [styles.micBtnWrapper, pressed && { opacity: 0.9 }]}
              >
                <LinearGradient
                  colors={
                    isListening
                      ? [COLORS.voice, COLORS.voiceActive]
                      : [COLORS.primary, COLORS.primaryLight]
                  }
                  style={styles.micBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons
                    name={isListening ? 'mic' : 'mic-none'}
                    size={28}
                    color="#fff"
                  />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const MIC_SIZE = 56;
const RIPPLE_SIZE = MIC_SIZE + 20;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  header: { paddingTop: 8, paddingBottom: 14, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  clearBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatList: { paddingTop: 12, paddingBottom: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '700' },
  emptySubText: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  listeningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.voice + '15',
  },
  listeningDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  listeningText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.voice,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  inputHintContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  micContainer: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnWrapper: {
    borderRadius: MIC_SIZE / 2,
  },
  micBtn: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  ripple: {
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    backgroundColor: COLORS.voice,
  },
});
