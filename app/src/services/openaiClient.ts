/**
 * openaiClient.ts
 * Direct-from-app OpenAI calls — Whisper STT, GPT-4o chat/vision, TTS.
 * Bypasses the Node server so everything works regardless of local network.
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

const BASE = 'https://api.openai.com/v1';

function assertOpenAIKey() {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'Missing EXPO_PUBLIC_OPENAI_API_KEY. Set it in your Expo environment before making OpenAI requests.',
    );
  }
}

// ── Whisper STT ────────────────────────────────────────────────────────────

/**
 * Transcribes an audio file URI (m4a/aac/wav/mp3) using OpenAI Whisper.
 * Detects language automatically.
 */
export async function whisperTranscribe(
  audioUri: string,
): Promise<{ text: string; language: string }> {
  assertOpenAIKey();
  const formData = new FormData();

  // React Native accepts { uri, type, name } as file in FormData
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');

  const resp = await fetch(`${BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Whisper ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  return {
    text: (data.text ?? '').trim(),
    language: data.language ?? 'en',
  };
}

// ── GPT-4o Chat / Vision ────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string; detail?: 'auto' | 'high' | 'low' };
}

export async function gptChat(
  messages: ChatMessage[],
  opts: { maxTokens?: number; json?: boolean } = {},
): Promise<string> {
  assertOpenAIKey();
  const body: Record<string, unknown> = {
    model: 'gpt-4o',
    messages,
    max_tokens: opts.maxTokens ?? 600,
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  const resp = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`GPT-4o ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  return data.choices[0].message.content as string;
}

// ── Intent Parsing ──────────────────────────────────────────────────────────

const INTENT_SYSTEM = `You are the voice navigator for Gramvikash, a rural Indian farming app.
Given a voice query in ANY language, return the screen and action intent.
Available screens: Feed, Mandi, Resources, AICoPilot, Schemes, SOS, Profile
Available actions: NAVIGATE, CREATE_POST, SELL_CROP, PLACE_BID, CALL_SOS, CHECK_WEATHER, DIAGNOSE_CROP, CHECK_SCHEME, READ_FEED, OPEN_MANDI, POOL_TRANSPORT, RENT_EQUIPMENT, UNKNOWN

SELL_CROP: Use when user says they want to sell/list a crop/produce.
Extract: crop (string), price (number in INR), quantity (number), unit (string, default "kg").
Example: "I'm selling 50 kg wheat at 28 rupees" → action:SELL_CROP, params:{crop:"wheat",price:28,quantity:50,unit:"kg"}
Example: "मैं 100 किलो प्याज 15 रुपये में बेचना चाहता हूं" → action:SELL_CROP, params:{crop:"onion",price:15,quantity:100,unit:"kg"}
If price/quantity not mentioned, use 0 as placeholder and ask in speakResponse.

Respond ONLY with valid JSON (no markdown):
{"action":"ACTION","screen":"ScreenName","params":{},"speakResponse":"Short spoken reply in the SAME language the user spoke"}`;

export async function parseIntent(
  text: string,
  language: string,
): Promise<{ action: string; screen?: string; params?: Record<string, unknown>; speakResponse: string }> {
  const raw = await gptChat(
    [
      { role: 'system', content: INTENT_SYSTEM },
      { role: 'user', content: `User said (language: ${language}): "${text}"` },
    ],
    { maxTokens: 200, json: true },
  );
  return JSON.parse(raw);
}

// ── AI Co-Pilot ──────────────────────────────────────────────────────────────

const COPILOT_SYSTEM = `You are Gramvikash Co-Pilot — an expert AI agricultural assistant for rural Indian farmers.
You help with:
- Crop disease diagnosis from photos (give disease name, cause, treatment, prevention)
- General farming questions
- Crop suggestions based on season and region
- Soil health, irrigation, pesticide advice
- Government scheme information

Respond in simple, clear language. If the user speaks Hindi or another Indian language, respond in that language.
Keep responses concise and actionable (max 4-5 sentences unless a detailed diagnosis is needed).`;

export async function askCoPilotDirect(
  message: string,
  imageBase64?: string,
  history: ChatMessage[] = [],
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: COPILOT_SYSTEM },
    ...history.slice(-10),
  ];

  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: message || 'Please diagnose the crop disease in this image.' },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: 'high',
          },
        },
      ],
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

  return gptChat(messages, { maxTokens: 700 });
}

// ── Government Scheme Advisor ───────────────────────────────────────────────

const SCHEME_SYSTEM = `You are a government scheme eligibility advisor for Indian farmers (Gramvikash Scheme Advisor).
Conduct a friendly, conversational interview to determine which government schemes a farmer qualifies for.

Key schemes to evaluate:
- PM-KISAN (₹6000/year for small/marginal farmers with <2 hectares)
- Pradhan Mantri Fasal Bima Yojana (crop insurance)
- Kisan Credit Card (low-interest agricultural loans up to ₹3 lakh)
- PM Kusum (solar pump subsidies up to 90%)
- Soil Health Card scheme
- National Food Security Mission
- e-NAM (electronic national agriculture market)
- State-specific schemes

Ask ONE question at a time. Keep questions simple and conversational. Translate to the farmer's language if needed.
When you have enough information (5-7 questions), list qualifying schemes clearly with amounts/benefits.

Respond ONLY with valid JSON:
{"done":false,"question":"next question here"}
OR when finished:
{"done":true,"result":"Full summary of qualifying schemes with specific benefits and how to apply"}`;

export async function runSchemeChat(
  history: ChatMessage[],
): Promise<{ done: boolean; question?: string; result?: string }> {
  const raw = await gptChat(
    [{ role: 'system', content: SCHEME_SYSTEM }, ...history],
    { maxTokens: 500, json: true },
  );
  return JSON.parse(raw);
}

// ── Weather Intelligence ───────────────────────────────────────────────────

export async function getWeatherAdvice(
  weatherDesc: string,
  temp: number,
  location: string,
): Promise<string> {
  return gptChat(
    [
      {
        role: 'user',
        content: `Current weather at ${location}: ${weatherDesc}, ${temp}°C.
Give a 1-sentence farming advice tip for this weather in simple English (e.g. irrigation, harvesting, spraying guidance).`,
      },
    ],
    { maxTokens: 80 },
  );
}
