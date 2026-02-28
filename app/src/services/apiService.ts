import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auto-configured to your machine's local IP
export const BASE_URL = 'http://192.168.137.33:4000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Feed ──────────────────────────────────────────────────────────────────
export const fetchFeed = (lat: number, lng: number, radiusKm: number) =>
  api.get('/feed', { params: { lat, lng, radius: radiusKm } }).then((r) => r.data);

export const createPost = (payload: FormData) =>
  api.post('/feed/post', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const likePost = (postId: string) =>
  api.post(`/feed/post/${postId}/like`).then((r) => r.data);

// ── Mandi ─────────────────────────────────────────────────────────────────
export const fetchMandiListings = (lat: number, lng: number) =>
  api.get('/mandi', { params: { lat, lng } }).then((r) => r.data);

export const placeBid = (postId: string, amount: number, unit: string) =>
  api.post(`/mandi/${postId}/bid`, { amount, unit }).then((r) => r.data);

export const acceptBid = (postId: string, bidId: string) =>
  api.post(`/mandi/${postId}/bid/${bidId}/accept`).then((r) => r.data);

// ── Voice / AI ─────────────────────────────────────────────────────────────
export const transcribeAudio = (audioUri: string) => {
  const form = new FormData();
  form.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'voice.m4a' } as any);
  return api.post('/voice/transcribe', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data as { text: string; language: string });
};

export const parseVoiceIntent = (text: string, language: string) =>
  api.post('/voice/intent', { text, language }).then(
    (r) => r.data as { action: string; screen?: string; params?: Record<string, unknown>; speakResponse: string }
  );

export const synthesizeSpeech = (text: string, language: string) =>
  api.post('/voice/tts', { text, language }, { responseType: 'arraybuffer' }).then((r) => r.data);

// ── AI Co-Pilot ────────────────────────────────────────────────────────────
export const askCoPilot = (
  message: string,
  imageBase64?: string,
  history?: { role: string; content: string }[]
) =>
  api.post('/ai/copilot', { message, imageBase64, history }).then(
    (r) => r.data as { reply: string; diagnosis?: string; suggestions?: string[] }
  );

export const analyzeCropImage = (imageBase64: string, location: { lat: number; lng: number }) =>
  api.post('/ai/diagnose', { imageBase64, location }).then((r) => r.data);

// ── Schemes ────────────────────────────────────────────────────────────────
export const startSchemeSession = () =>
  api.post('/schemes/session').then((r) => r.data as { sessionId: string; question: string });

export const replySchemeSession = (sessionId: string, answer: string) =>
  api.post(`/schemes/session/${sessionId}/reply`, { answer }).then(
    (r) => r.data as { question?: string; result?: string; done: boolean }
  );

// ── Weather ────────────────────────────────────────────────────────────────
export const fetchWeather = (lat: number, lng: number) =>
  api.get('/weather', { params: { lat, lng } }).then((r) => r.data);

// ── SOS ────────────────────────────────────────────────────────────────────
export const triggerSOS = (lat: number, lng: number, message: string, contacts: string[]) =>
  api.post('/sos/trigger', { lat, lng, message, contacts }).then((r) => r.data);

// ── Auth ───────────────────────────────────────────────────────────────────
export const loginWithPhone = (phone: string, otp: string) =>
  api.post('/auth/verify', { phone, otp }).then((r) => r.data as { token: string; user: object });

export const requestOTP = (phone: string) =>
  api.post('/auth/otp', { phone }).then((r) => r.data);

export default api;
