# 🌱 Gramvikash — Voice-First Rural Farming Platform

A voice-first, hyper-local community and AI assistance platform for Indian farmers.

---

## Architecture

```
gramvikash/
├── app/                    # React Native (Expo) mobile frontend
│   ├── src/
│   │   ├── components/     # VoiceButton, PostCard, TagBadge, WeatherAlertStrip
│   │   ├── constants/      # Colors, tags, voice intents
│   │   ├── navigation/     # Bottom tab navigator + useVoiceNavigator hook
│   │   ├── screens/        # Feed, Mandi, Resources, AI Co-Pilot, Schemes, SOS, Profile
│   │   ├── services/       # API, Voice (STT/TTS), Location
│   │   └── store/          # Zustand global state
│   └── App.tsx
│
└── server/                 # Node.js / Express backend API
    ├── src/
    │   ├── db/             # In-memory mock DB (swap for Mongo/Postgres)
    │   ├── routes/         # feed, mandi, voice, ai, schemes, weather, sos, auth
    │   └── services/       # OpenAI service (Whisper + GPT-4o + TTS)
    └── index.js
```

---

## Quick Start

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY and OPENWEATHER_API_KEY

npm install
npm run dev
# Server runs at http://localhost:4000
```

### 2. Mobile App

```bash
cd app
npm install
npx expo start
# Scan QR code with Expo Go app on your phone
```

> **Important:** Update `BASE_URL` in `src/services/apiService.ts` to your machine's local IP:
> ```ts
> export const BASE_URL = 'http://192.168.x.x:4000/api';
> ```

---

## Voice Navigation — How It Works

```
User holds Mic button
        │
        ▼
Audio recorded (expo-av)
        │
        ▼
POST /api/voice/transcribe  →  Whisper STT  →  { text, language }
        │
        ▼
POST /api/voice/intent  →  GPT-4o  →  { action, screen, speakResponse }
        │
        ▼
navigate(screen)  →  App auto-navigates to correct screen
        │
        ▼
expo-speech speaks confirmation aloud
```

### Example Voice Commands

| What you say | Screen navigated to |
|---|---|
| "I want to sell my wheat" | Digital Mandi |
| "My crops have yellow spots" | AI Co-Pilot |
| "Check PM Kisan scheme" | Govt Schemes |
| "Rain forecast today?" | Feed (weather) |
| "I need a tractor" | Resources |
| "Emergency help!" | SOS |

Works in **any language** — Whisper auto-detects the language, GPT-4o parses intent regardless of language.

---

## Features

### 🎙️ Zero-Typing Voice UI
- Hold the floating mic button to record
- Release to auto-transcribe + navigate + speak response
- Every screen's AI responses can be read aloud

### 🌾 Digital Mandi
- Live harvest listings with inventory tracking
- Bid directly in the app; farmer accepts/rejects
- Inventory bar updates in real-time after accepted bids

### 🤝 Resource Pool
- Equipment rental (tractors, sprayers)
- Transport pooling (shared trucks to mandi)
- Cold storage sharing

### 🤖 AI Co-Pilot
- Camera → instant crop disease diagnosis
- Voice Q&A for any farming question
- Multi-language responses (same language as query)

### 🏛️ Scheme Eligibility
- Conversational voice interview
- Stateful GPT-4o session evaluates PM-KISAN, PMFBY, KCC, etc.
- Final result readable aloud

### 🚨 Emergency SOS
- Hold 3 seconds to activate
- Sends alert to emergency contacts + nearby community
- Location shared automatically

### 📡 Offline Resilience
- Local keyword-based intent matching when server unreachable
- Feed content cached via AsyncStorage
- Core UI functional without network

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key (Whisper + GPT-4o) |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key (optional) |
| `JWT_SECRET` | Random secret for JWT signing |
| `PORT` | Server port (default: 4000) |
| `USE_MOCK_DB` | `true` to use in-memory mock database |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/voice/transcribe` | Audio file → text (Whisper) |
| POST | `/api/voice/intent` | Text → navigation intent (GPT-4o) |
| POST | `/api/voice/tts` | Text → speech audio |
| GET | `/api/feed` | Geofenced community feed |
| POST | `/api/feed/post` | Create a post |
| GET | `/api/mandi` | Nearby harvest listings |
| POST | `/api/mandi/:id/bid` | Place bid |
| POST | `/api/ai/copilot` | AI chat + crop diagnosis |
| POST | `/api/schemes/session` | Start scheme interview |
| POST | `/api/schemes/session/:id/reply` | Continue scheme interview |
| GET | `/api/weather` | Local weather + auto-alerts |
| POST | `/api/sos/trigger` | Trigger emergency SOS |
| POST | `/api/auth/otp` | Request OTP |
| POST | `/api/auth/verify` | Verify OTP → JWT |

> **Dev tip:** Use OTP `123456` to bypass SMS verification during development.

---

## Production Checklist

- [ ] Replace mock DB with MongoDB or PostgreSQL
- [ ] Store audio/image files in S3 or Google Cloud Storage
- [ ] Set up WebSocket (Socket.io) for real-time bidding updates
- [ ] Integrate SMS provider (MSG91 / Twilio) for OTP + SOS alerts
- [ ] Set up FCM for push notifications (weather alerts, new bids)
- [ ] Add Redis for OTP storage and session caching
- [ ] Deploy server to Railway / Render / AWS EC2
- [ ] Publish app via Expo EAS Build

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 51) |
| State | Zustand |
| Navigation | React Navigation v6 (Bottom Tabs) |
| Voice STT | OpenAI Whisper via backend |
| Intent AI | OpenAI GPT-4o |
| Crop Vision | OpenAI GPT-4o Vision |
| TTS | expo-speech (device-native) |
| Backend | Node.js + Express |
| Auth | JWT + Phone OTP |
| Weather | OpenWeatherMap API |
