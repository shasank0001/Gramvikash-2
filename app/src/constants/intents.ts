/**
 * Voice Intent Definitions
 * Maps parsed voice commands to navigation targets and actions.
 * Language-agnostic: the backend normalizes intent regardless of language.
 */

export type IntentAction =
  | 'NAVIGATE'
  | 'CREATE_POST'
  | 'SELL_CROP'
  | 'PLACE_BID'
  | 'CALL_SOS'
  | 'CHECK_WEATHER'
  | 'DIAGNOSE_CROP'
  | 'CHECK_SCHEME'
  | 'READ_FEED'
  | 'OPEN_MANDI'
  | 'POOL_TRANSPORT'
  | 'RENT_EQUIPMENT'
  | 'UNKNOWN';

export type ScreenTarget =
  | 'Feed'
  | 'Mandi'
  | 'Resources'
  | 'AICoPilot'
  | 'Schemes'
  | 'SOS'
  | 'Profile';

export interface VoiceIntent {
  action: IntentAction;
  screen?: ScreenTarget;
  params?: Record<string, unknown>;
  speakResponse?: string;
}

/**
 * Keywords used for LOCAL (offline) fallback intent matching
 * when server is unreachable. Maps keyword patterns to intents.
 */
export const LOCAL_INTENT_KEYWORDS: {
  patterns: RegExp[];
  intent: VoiceIntent;
}[] = [
  {
    patterns: [/mandi|sell|harvest|auction|bid|crop sale/i],
    intent: { action: 'OPEN_MANDI', screen: 'Mandi', speakResponse: 'Opening the Digital Mandi.' },
  },
  {
    patterns: [/disease|sick|pest|fungus|blight|diagnos|crop problem/i],
    intent: { action: 'DIAGNOSE_CROP', screen: 'AICoPilot', speakResponse: 'Opening AI crop diagnosis.' },
  },
  {
    patterns: [/scheme|subsidy|government|pm kisan|loan|yojana/i],
    intent: { action: 'CHECK_SCHEME', screen: 'Schemes', speakResponse: 'Opening government schemes.' },
  },
  {
    patterns: [/weather|rain|forecast|temperature|storm/i],
    intent: { action: 'CHECK_WEATHER', screen: 'Feed', speakResponse: 'Checking local weather.' },
  },
  {
    patterns: [/transport|truck|lorry|carry goods|pool/i],
    intent: { action: 'POOL_TRANSPORT', screen: 'Resources', speakResponse: 'Opening transport pooling.' },
  },
  {
    patterns: [/tractor|equipment|rent|machine|borrow/i],
    intent: { action: 'RENT_EQUIPMENT', screen: 'Resources', speakResponse: 'Opening equipment sharing.' },
  },
  {
    patterns: [/sos|help|emergency|accident|hurt|danger/i],
    intent: { action: 'CALL_SOS', screen: 'SOS', speakResponse: 'Opening emergency SOS. Stay calm.' },
  },
  {
    patterns: [/feed|home|village|community|post|news/i],
    intent: { action: 'NAVIGATE', screen: 'Feed', speakResponse: 'Going to the community feed.' },
  },
];
