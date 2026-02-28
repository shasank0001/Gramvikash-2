/**
 * OpenAI service — wraps Whisper (STT), GPT-4o (NLP, Vision, Schemes), and TTS.
 */
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

let openai;
function getClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables.');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// ── Speech-to-Text (Whisper) ───────────────────────────────────────────────

async function transcribeAudio(audioFilePath) {
  const client = getClient();
  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-1',
    response_format: 'verbose_json', // includes language detection
  });
  return {
    text: transcription.text,
    language: transcription.language ?? 'en',
  };
}

// ── Text-to-Speech ─────────────────────────────────────────────────────────

async function synthesizeSpeech(text, language = 'en') {
  const client = getClient();
  const mp3 = await client.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
    response_format: 'mp3',
  });
  return Buffer.from(await mp3.arrayBuffer());
}

// ── Voice Intent Parsing ───────────────────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `You are the voice navigator for Gramvikash, a rural farming app in India.
Given a user's voice query in ANY language, determine the intent and target screen.
Available screens: Feed, Mandi, Resources, AICoPilot, Schemes, SOS, Profile
Available actions: NAVIGATE, CREATE_POST, PLACE_BID, CALL_SOS, CHECK_WEATHER, DIAGNOSE_CROP, CHECK_SCHEME, READ_FEED, OPEN_MANDI, POOL_TRANSPORT, RENT_EQUIPMENT, UNKNOWN

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "action": "ACTION_NAME",
  "screen": "ScreenName",
  "params": {},
  "speakResponse": "Short spoken confirmation in the SAME language the user spoke"
}`;

async function parseVoiceIntent(text, language) {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: INTENT_SYSTEM_PROMPT },
      { role: 'user', content: `User said (language: ${language}): "${text}"` },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 200,
  });
  return JSON.parse(completion.choices[0].message.content);
}

// ── AI Agricultural Co-Pilot ───────────────────────────────────────────────

const COPILOT_SYSTEM_PROMPT = `You are an expert AI agricultural assistant for rural Indian farmers called "Gramvikash Co-Pilot".
You help with:
- Diagnosing crop diseases from photos
- Answering general farming questions
- Suggesting crops based on season and region
- Providing treatment recommendations
- Explaining farming best practices

Always respond in simple, clear language. If the user speaks Hindi or another Indian language, respond in that language.
When diagnosing a crop disease, provide: 1) Disease name, 2) Cause, 3) Treatment, 4) Prevention.
Keep responses concise and actionable.`;

async function askCoPilot(message, imageBase64, history = []) {
  const client = getClient();

  const messages = [
    { role: 'system', content: COPILOT_SYSTEM_PROMPT },
    ...history.slice(-8), // Keep last 8 messages for context
  ];

  // Build user message (with or without image)
  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: message || 'Please diagnose the crop disease in this image.' },
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' },
        },
      ],
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 600,
  });

  return { reply: completion.choices[0].message.content };
}

// ── Government Scheme Eligibility ──────────────────────────────────────────

const SCHEME_SYSTEM_PROMPT = `You are a government scheme eligibility advisor for Indian farmers.
Your job is to conduct a friendly, conversational interview to determine which government schemes a farmer qualifies for.

Key schemes to evaluate:
- PM-KISAN (₹6000/year for small/marginal farmers with <2 hectares)
- Pradhan Mantri Fasal Bima Yojana (crop insurance)
- Kisan Credit Card (low-interest agricultural loans)
- PM Kusum (solar pump subsidies)
- Soil Health Card scheme
- National Food Security Mission
- State-specific schemes

Ask ONE question at a time. Keep questions simple and conversational.
When you have enough information (usually 5-7 questions), provide a clear list of qualifying schemes with brief descriptions.

Respond in JSON format:
{
  "done": false,
  "question": "Next question to ask"
}
OR when done:
{
  "done": true,
  "result": "Summary of qualifying schemes with brief details"
}`;

async function runSchemeSession(sessionId, history) {
  const client = getClient();

  const messages = [
    { role: 'system', content: SCHEME_SYSTEM_PROMPT },
    ...history,
  ];

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
    max_tokens: 400,
  });

  return JSON.parse(completion.choices[0].message.content);
}

module.exports = { transcribeAudio, synthesizeSpeech, parseVoiceIntent, askCoPilot, runSchemeSession };
