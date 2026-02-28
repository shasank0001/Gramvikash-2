/**
 * useVoiceNavigator
 * Voice pipeline:
 *   1. Record → 2. Whisper STT (direct OpenAI) → 3. GPT-4o intent → 4. Navigate + Speak
 */
import { useCallback } from 'react';
import { useAppStore, Post } from '../store/useAppStore';
import {
  startRecording,
  stopRecording,
  transcribeAudioFile,
  parseIntent,
  speak,
  cancelRecording,
} from '../services/voiceService';
import { navigate } from './navigationRef';
import { ScreenTarget } from '../constants/intents';

export function useVoiceNavigator() {
  const {
    isOffline,
    setIsListening,
    setVoiceTranscript,
    setLastVoiceIntent,
    user,
    addMandiListing,
  } = useAppStore();

  const beginListening = useCallback(async () => {
    try {
      setIsListening(true);
      await startRecording();
    } catch (err) {
      setIsListening(false);
      speak('Microphone not available. Please check permissions.', user?.language ?? 'en');
    }
  }, [user]);

  const endListening = useCallback(async () => {
    setIsListening(false);

    // Step 1: Stop recording and get audio URI
    const audioUri = await stopRecording();
    if (!audioUri) {
      speak('Could not capture audio. Please try again.', user?.language ?? 'en');
      return;
    }

    speak('Listening...', user?.language ?? 'en');

    try {
      // Step 2: Transcribe via Whisper (direct API call)
      const { text, language } = await transcribeAudioFile(audioUri);
      setVoiceTranscript(text);

      if (!text.trim()) {
        speak(
          'I could not hear you clearly. Please speak louder and try again.',
          user?.language ?? 'en',
        );
        return;
      }

      // Step 3: Parse intent via GPT-4o (direct API call)
      speak('Got it, processing...', user?.language ?? 'en');
      const intent = await parseIntent(text, language, isOffline);
      setLastVoiceIntent(intent.action);

      // Step 4: Handle special intents
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
        const newListing: Post = {
          id: `v-${Date.now()}`,
          authorId: user?.id ?? 'voice-user',
          authorName: user?.name ?? 'Farmer',
          authorTrust: user?.trustScore ?? 80,
          tag: 'mandi',
          text: `${icon} Selling ${crop}${qty > 0 ? ` – ${qty} ${unit} available` : ''}${price > 0 ? ` at ₹${price}/${unit}` : ''}. Fresh from farm, direct pickup. Added via voice.`,
          timestamp: Date.now(),
          location: { lat: 19.076, lng: 72.877 },
          likes: 0,
          commentCount: 0,
          inventory: { total: qty || 100, remaining: qty || 100, unit },
          bids: [],
          aiAnalysis: price > 0 ? `Voice-listed at ₹${price}/${unit}` : 'Listed via voice command',
        };
        addMandiListing(newListing);
        navigate('Mandi' as ScreenTarget);
      } else if (intent.screen) {
        // Step 5: Navigate to screen (for other intents)
        navigate(intent.screen as ScreenTarget);
      }

      // Step 6: Speak the response
      const response = intent.speakResponse || 'Done.';
      speak(response, language ?? user?.language ?? 'en');
    } catch (err) {
      console.error('[useVoiceNavigator] pipeline error:', err);
      speak(
        'Something went wrong. Please check your internet and try again.',
        user?.language ?? 'en',
      );
    }
  }, [isOffline, user]);

  const cancelListening = useCallback(async () => {
    setIsListening(false);
    await cancelRecording();
  }, []);

  return { beginListening, endListening, cancelListening };
}

