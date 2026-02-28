/**
 * VoiceService
 * Handles audio recording, STT (direct Whisper API), and TTS (expo-speech).
 */
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { whisperTranscribe, parseIntent as openaiParseIntent } from './openaiClient';
import { LOCAL_INTENT_KEYWORDS, VoiceIntent } from '../constants/intents';

let recording: Audio.Recording | null = null;
let isRecordingActive = false;

// ── Recording ─────────────────────────────────────────────────────────────

export async function requestMicPermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function startRecording(): Promise<void> {
  // If a stale recording exists, clean it up first
  if (recording || isRecordingActive) {
    try {
      await recording?.stopAndUnloadAsync();
    } catch (_) {}
    recording = null;
    isRecordingActive = false;
    await new Promise((r) => setTimeout(r, 300));
  }

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recording = rec;
    isRecordingActive = true;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (err) {
    console.error('[VoiceService] startRecording error:', err);
    isRecordingActive = false;
    throw err;
  }
}

export async function stopRecording(): Promise<string | null> {
  if (!recording) return null;
  const rec = recording;
  recording = null;
  isRecordingActive = false;
  try {
    await rec.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = rec.getURI();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return uri ?? null;
  } catch (err) {
    console.error('[VoiceService] stopRecording error:', err);
    return null;
  }
}

export async function cancelRecording(): Promise<void> {
  if (!recording) return;
  const rec = recording;
  recording = null;
  isRecordingActive = false;
  try {
    await rec.stopAndUnloadAsync();
  } catch (_) {}
  try {
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  } catch (_) {}
}

// ── Speech-to-Text (Direct Whisper) ──────────────────────────────────────

/**
 * Transcribes audio directly via OpenAI Whisper.
 * No server hop — works on any network.
 */
export async function transcribeAudioFile(uri: string): Promise<{ text: string; language: string }> {
  try {
    const result = await whisperTranscribe(uri);
    console.log('[STT] transcribed:', result.text, '| lang:', result.language);
    return result;
  } catch (err) {
    console.error('[STT] Whisper error:', err);
    return { text: '', language: 'en' };
  }
}

// ── Intent Parsing ────────────────────────────────────────────────────────

export async function parseIntent(
  text: string,
  language: string,
  _isOffline: boolean,
): Promise<VoiceIntent> {
  if (!text.trim()) return localIntentFallback(text);
  try {
    const intent = await openaiParseIntent(text, language);
    return intent as VoiceIntent;
  } catch (err) {
    console.warn('[VoiceService] parseIntent API failed, using local fallback:', err);
    return localIntentFallback(text);
  }
}

export function localIntentFallback(text: string): VoiceIntent {
  const lower = text.toLowerCase();
  for (const { patterns, intent } of LOCAL_INTENT_KEYWORDS) {
    if (patterns.some((p) => p.test(lower))) return intent;
  }
  return {
    action: 'UNKNOWN',
    speakResponse: "I didn't understand that. Please speak clearly and try again.",
  };
}

// ── Text-to-Speech ────────────────────────────────────────────────────────

export function speak(text: string, language = 'en'): void {
  if (!text.trim()) return;
  // Stop any ongoing speech first
  Speech.stop();

  const langMap: Record<string, string> = {
    en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN',
    te: 'te-IN', ta: 'ta-IN', kn: 'kn-IN', bn: 'bn-IN',
  };
  Speech.speak(text, {
    language: langMap[language] ?? 'en-IN',
    pitch: 1.0,
    rate: 0.85,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

// ── Audio Playback ────────────────────────────────────────────────────────

let soundObj: Audio.Sound | null = null;

export async function playAudioUrl(url: string): Promise<void> {
  if (soundObj) {
    await soundObj.unloadAsync();
    soundObj = null;
  }
  const { sound } = await Audio.Sound.createAsync({ uri: url });
  soundObj = sound;
  await sound.playAsync();
}

export async function stopAudio(): Promise<void> {
  if (soundObj) {
    await soundObj.stopAsync();
    await soundObj.unloadAsync();
    soundObj = null;
  }
}
