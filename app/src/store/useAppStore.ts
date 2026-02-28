import { create } from 'zustand';

// ── Vast mock Mandi listings for demo ──────────────────────────────────────
const now = Date.now();
const m = (offset: number) => now - offset * 60 * 1000; // offset in minutes

export const MOCK_MANDI_LISTINGS: Post[] = [
  {
    id: 'm1', authorId: 'u1', authorName: 'Raju Patil', authorTrust: 92,
    tag: 'mandi', text: '🌾 Selling premium quality wheat – freshly harvested. Grade A, cleaned & packed in 50 kg bags. Ready for immediate pickup from Latur.',
    timestamp: m(10), location: { lat: 18.4088, lng: 76.5604 }, likes: 14, commentCount: 5,
    inventory: { total: 500, remaining: 320, unit: 'kg' },
    bids: [
      { id: 'b1', bidderId: 'u10', bidderName: 'Suresh Traders', amount: 28, unit: 'kg', timestamp: m(5), accepted: false },
      { id: 'b2', bidderId: 'u11', bidderName: 'Nagpur Grains', amount: 27, unit: 'kg', timestamp: m(8), accepted: false },
    ],
    aiAnalysis: 'Wheat protein content ~12.5% — suitable for atta mills',
  },
  {
    id: 'm2', authorId: 'u2', authorName: 'Savita Devi', authorTrust: 88,
    tag: 'mandi', text: '🍅 Fresh tomatoes from poly-house. Uniform size, no pesticide residue, harvested this morning. Selling 200 kg. Minimum purchase 10 kg.',
    timestamp: m(25), location: { lat: 18.5204, lng: 73.8567 }, likes: 22, commentCount: 8,
    inventory: { total: 200, remaining: 140, unit: 'kg' },
    bids: [
      { id: 'b3', bidderId: 'u12', bidderName: 'Pune Sabzi Mart', amount: 18, unit: 'kg', timestamp: m(15), accepted: false },
      { id: 'b4', bidderId: 'u13', bidderName: 'FreshCo', amount: 20, unit: 'kg', timestamp: m(12), accepted: true },
    ],
    aiAnalysis: 'High Brix tomatoes — recommended for export-grade packaging',
  },
  {
    id: 'm3', authorId: 'u3', authorName: 'Arjun Shinde', authorTrust: 75,
    tag: 'mandi', text: '🧅 Onion – medium grade, 3–5 cm size. Excellent shelf life. Stored in ventilated warehouse. Available in 25 kg mesh bags.',
    timestamp: m(40), location: { lat: 19.9975, lng: 74.7379 }, likes: 9, commentCount: 3,
    inventory: { total: 1000, remaining: 650, unit: 'kg' },
    bids: [
      { id: 'b5', bidderId: 'u14', bidderName: 'Nasik Onion Traders', amount: 12, unit: 'kg', timestamp: m(30), accepted: false },
    ],
    aiAnalysis: 'Dry matter 14% — good for long-distance transport',
  },
  {
    id: 'm4', authorId: 'u4', authorName: 'Devika Kulkarni', authorTrust: 95,
    tag: 'mandi', text: '🌻 Soybean – Variety JS-335. Moisture 9.8%, clean & sortex done. Direct from farm. Ready for crushing or seed use.',
    timestamp: m(55), location: { lat: 17.6599, lng: 75.9064 }, likes: 31, commentCount: 11,
    inventory: { total: 800, remaining: 800, unit: 'kg' },
    bids: [
      { id: 'b6', bidderId: 'u15', bidderName: 'Solapur Oil Mill', amount: 45, unit: 'kg', timestamp: m(45), accepted: false },
      { id: 'b7', bidderId: 'u16', bidderName: 'AgroPro Seeds', amount: 48, unit: 'kg', timestamp: m(50), accepted: false },
      { id: 'b8', bidderId: 'u17', bidderName: 'National Oil Corp', amount: 46, unit: 'kg', timestamp: m(52), accepted: false },
    ],
    aiAnalysis: 'Protein 40.2%, oil 20.1% — excellent for crushing',
  },
  {
    id: 'm5', authorId: 'u5', authorName: 'Sukhwinder Singh', authorTrust: 83,
    tag: 'mandi', text: '🌾 Basmati Rice (1121 variety) – aged 6 months. Grain length 8.2mm, aromatic. Export quality. 40 quintal available.',
    timestamp: m(80), location: { lat: 30.9010, lng: 75.8573 }, likes: 45, commentCount: 18,
    inventory: { total: 4000, remaining: 2800, unit: 'kg' },
    bids: [
      { id: 'b9', bidderId: 'u18', bidderName: 'Punjab Rice Exports', amount: 90, unit: 'kg', timestamp: m(70), accepted: false },
      { id: 'b10', bidderId: 'u19', bidderName: 'Basmati World', amount: 95, unit: 'kg', timestamp: m(75), accepted: false },
    ],
    aiAnalysis: 'Meets APEDA export norms — recommended for Dubai/UAE market',
  },
  {
    id: 'm6', authorId: 'u6', authorName: 'Priya Reddy', authorTrust: 70,
    tag: 'mandi', text: '🌶️ Dry red chilli (Teja variety, S-17). Sun-dried, bold, uniform. High pungency (60,000 SHU). Packaging: 30 kg gunny bags.',
    timestamp: m(100), location: { lat: 17.3850, lng: 78.4867 }, likes: 17, commentCount: 6,
    inventory: { total: 300, remaining: 210, unit: 'kg' },
    bids: [
      { id: 'b11', bidderId: 'u20', bidderName: 'Guntur Spices', amount: 140, unit: 'kg', timestamp: m(90), accepted: false },
    ],
    aiAnalysis: 'ASTA colour value >100 — qualifies for spice export',
  },
  {
    id: 'm7', authorId: 'u7', authorName: 'Mohan Das', authorTrust: 86,
    tag: 'mandi', text: '🌾 Cotton (Shankar-6 variety). Fully opened bolls, machine-picked. Staple length 29mm, ginning % 36. 10 quintals available.',
    timestamp: m(120), location: { lat: 20.9374, lng: 77.7796 }, likes: 28, commentCount: 9,
    inventory: { total: 1000, remaining: 700, unit: 'kg' },
    bids: [
      { id: 'b12', bidderId: 'u21', bidderName: 'Akola Ginning Mill', amount: 65, unit: 'kg', timestamp: m(110), accepted: false },
      { id: 'b13', bidderId: 'u22', bidderName: 'Maharashtra Cotton', amount: 67, unit: 'kg', timestamp: m(115), accepted: false },
    ],
    aiAnalysis: 'Moisture 8% — MSP-eligible grade (Fair Average Quality)',
  },
  {
    id: 'm8', authorId: 'u8', authorName: 'Lalita Bai', authorTrust: 79,
    tag: 'mandi', text: '🟡 Turmeric (Salem variety) – 7% curcumin. Polished fingers, deep orange colour. Dried to 10% moisture. 15 quintal lot.',
    timestamp: m(150), location: { lat: 11.6643, lng: 78.1460 }, likes: 36, commentCount: 14,
    inventory: { total: 1500, remaining: 1100, unit: 'kg' },
    bids: [
      { id: 'b14', bidderId: 'u23', bidderName: 'Erode Turmeric Exports', amount: 110, unit: 'kg', timestamp: m(140), accepted: false },
      { id: 'b15', bidderId: 'u24', bidderName: 'Spice Garden Pvt', amount: 115, unit: 'kg', timestamp: m(145), accepted: false },
    ],
    aiAnalysis: 'Curcumin 7.2% — pharmaceutical grade, fetch premium pricing',
  },
  {
    id: 'm9', authorId: 'u9', authorName: 'Ramesh Nair', authorTrust: 91,
    tag: 'mandi', text: '🥥 Coconut – Tall variety. Count 75/100. Thick husk, high copra yield. Farm: Thrissur, Kerala. Good for copra or fresh market.',
    timestamp: m(180), location: { lat: 10.5276, lng: 76.2144 }, likes: 19, commentCount: 7,
    inventory: { total: 2000, remaining: 1800, unit: 'pieces' },
    bids: [
      { id: 'b16', bidderId: 'u25', bidderName: 'Kerala Copra Board', amount: 22, unit: 'pieces', timestamp: m(170), accepted: false },
    ],
    aiAnalysis: 'Copra yield ~200g/nut — excellent for coconut oil extraction',
  },
  {
    id: 'm10', authorId: 'u10', authorName: 'Bhavesh Patel', authorTrust: 84,
    tag: 'mandi', text: '🧄 Garlic (Yamuna Safed variety). Clove count 25–30/bulb. Spicy aroma. Clean & graded. Ready for export or domestic wholesale.',
    timestamp: m(200), location: { lat: 22.3072, lng: 73.1812 }, likes: 41, commentCount: 15,
    inventory: { total: 600, remaining: 400, unit: 'kg' },
    bids: [
      { id: 'b17', bidderId: 'u26', bidderName: 'Mahuva Garlic Traders', amount: 55, unit: 'kg', timestamp: m(190), accepted: false },
      { id: 'b18', bidderId: 'u27', bidderName: 'Ahmedabad Spice Co', amount: 58, unit: 'kg', timestamp: m(195), accepted: false },
      { id: 'b19', bidderId: 'u28', bidderName: 'Agri Exports Ltd', amount: 57, unit: 'kg', timestamp: m(198), accepted: false },
    ],
    aiAnalysis: 'Allicin content high — ideal for pharma/food processing industries',
  },
  {
    id: 'm11', authorId: 'u11', authorName: 'Gurpreet Kaur', authorTrust: 88,
    tag: 'mandi', text: '🌽 Maize (Hybrid-3522). Yellow, uniform size. Moisture 13.5%, aflatoxin tested. 20 quintals. Suitable for feed mills & starch industry.',
    timestamp: m(240), location: { lat: 29.9457, lng: 76.8190 }, likes: 12, commentCount: 4,
    inventory: { total: 2000, remaining: 2000, unit: 'kg' },
    bids: [
      { id: 'b20', bidderName: 'Karnal Starch Factory', bidderId: 'u29', amount: 20, unit: 'kg', timestamp: m(230), accepted: false },
    ],
    aiAnalysis: 'Starch 72% — qualifies for bioethanol processing',
  },
  {
    id: 'm12', authorId: 'u12', authorName: 'Kiran Patil', authorTrust: 77,
    tag: 'mandi', text: '🟢 Green moong dal (whole). Lustrous, machine-cleaned. Zero weevil. Grown organically in Vidarbha. 500 kg available.',
    timestamp: m(280), location: { lat: 20.7002, lng: 77.0082 }, likes: 23, commentCount: 8,
    inventory: { total: 500, remaining: 350, unit: 'kg' },
    bids: [
      { id: 'b21', bidderId: 'u30', bidderName: 'Organic Dal House', amount: 88, unit: 'kg', timestamp: m(270), accepted: false },
      { id: 'b22', bidderId: 'u31', bidderName: 'Nagpur Dal Mill', amount: 85, unit: 'kg', timestamp: m(275), accepted: false },
    ],
    aiAnalysis: 'Organic certified — can command 20–25% premium price',
  },
  {
    id: 'm13', authorId: 'u13', authorName: 'Suresh Yadav', authorTrust: 73,
    tag: 'mandi', text: '🥔 Potato (Jyoti variety). Washed, graded 50–80g. No green, no cuts. Cold-storage available. 1 tonne available, reducing price today.',
    timestamp: m(320), location: { lat: 26.4499, lng: 80.3319 }, likes: 8, commentCount: 2,
    inventory: { total: 1000, remaining: 900, unit: 'kg' },
    bids: [],
    aiAnalysis: 'Good for chips/crisps industry — chip test result positive',
  },
  {
    id: 'm14', authorId: 'u14', authorName: 'Anjali Sharma', authorTrust: 96,
    tag: 'mandi', text: '🍬 Sugarcane (Co-86032 variety). 12.5 Brix, high sucrose. Ready to cut. 5 acres available for booking by sugar mills.',
    timestamp: m(360), location: { lat: 21.1702, lng: 72.8311 }, likes: 54, commentCount: 20,
    inventory: { total: 50000, remaining: 50000, unit: 'kg' },
    bids: [
      { id: 'b23', bidderId: 'u32', bidderName: 'Surat Sugar Mills', amount: 3, unit: 'kg', timestamp: m(350), accepted: false },
      { id: 'b24', bidderId: 'u33', bidderName: 'DSCL Sugar', amount: 3.2, unit: 'kg', timestamp: m(355), accepted: false },
    ],
    aiAnalysis: 'Sucrose 11.8% — above MSP threshold for FRP pricing',
  },
  {
    id: 'm15', authorId: 'u15', authorName: 'Vijay Kumar', authorTrust: 81,
    tag: 'mandi', text: '🌿 Coriander seeds (Rajasthan origin). Bold, 99% pure. Fragrant. 200 kg packed in food-grade bags. Good for grinding & exports.',
    timestamp: m(400), location: { lat: 25.2138, lng: 75.8648 }, likes: 16, commentCount: 5,
    inventory: { total: 200, remaining: 150, unit: 'kg' },
    bids: [
      { id: 'b25', bidderId: 'u34', bidderName: 'Kota Spice Exports', amount: 75, unit: 'kg', timestamp: m(390), accepted: false },
    ],
    aiAnalysis: 'Essential oil 0.8% — premium grade for food flavouring',
  },
];


export interface UserLocation {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorTrust: number;
  tag: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
  timestamp: number;
  location: { lat: number; lng: number };
  likes: number;
  commentCount: number;
  inventory?: { total: number; remaining: number; unit: string };
  bids?: Bid[];
  aiAnalysis?: string;
  isPinned?: boolean;
}

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  unit: string;
  timestamp: number;
  accepted: boolean;
}

export interface WeatherAlert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  village: string;
  trustScore: number;
  language: string;
  emergencyContacts: string[];
}

export interface HomeChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  intent?: string;
  isLoading?: boolean;
}

export interface AppState {
  // User
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;

  // Location
  location: UserLocation | null;
  setLocation: (l: UserLocation) => void;

  // Feed
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  prependPost: (post: Post) => void;

  // Mandi
  mandiListings: Post[];
  setMandiListings: (posts: Post[]) => void;
  addMandiListing: (post: Post) => void;

  // Weather
  weatherAlerts: WeatherAlert[];
  setWeatherAlerts: (alerts: WeatherAlert[]) => void;

  // Voice
  isListening: boolean;
  setIsListening: (v: boolean) => void;
  voiceTranscript: string;
  setVoiceTranscript: (t: string) => void;
  lastVoiceIntent: string | null;
  setLastVoiceIntent: (i: string | null) => void;

  // Network
  isOffline: boolean;
  setIsOffline: (v: boolean) => void;

  // AI Co-Pilot
  copilotMessages: { role: 'user' | 'assistant'; content: string; audioUrl?: string }[];
  addCopilotMessage: (msg: { role: 'user' | 'assistant'; content: string; audioUrl?: string }) => void;
  clearCopilot: () => void;

  // Home Chat
  homeChatMessages: HomeChatMessage[];
  addHomeChatMessage: (msg: HomeChatMessage) => void;
  updateHomeChatMessage: (id: string, updates: Partial<HomeChatMessage>) => void;
  clearHomeChat: () => void;

  // Scheme session
  schemeSessionId: string | null;
  setSchemeSessionId: (id: string | null) => void;
  schemeMessages: { role: 'user' | 'assistant'; content: string }[];
  addSchemeMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  clearScheme: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),

  location: null,
  setLocation: (l) => set({ location: l }),

  posts: [],
  setPosts: (posts) => set({ posts }),
  prependPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),

  mandiListings: MOCK_MANDI_LISTINGS,
  setMandiListings: (mandiListings) => set({ mandiListings }),
  addMandiListing: (post) => set((s) => ({ mandiListings: [post, ...s.mandiListings] })),

  weatherAlerts: [],
  setWeatherAlerts: (weatherAlerts) => set({ weatherAlerts }),

  isListening: false,
  setIsListening: (isListening) => set({ isListening }),
  voiceTranscript: '',
  setVoiceTranscript: (voiceTranscript) => set({ voiceTranscript }),
  lastVoiceIntent: null,
  setLastVoiceIntent: (lastVoiceIntent) => set({ lastVoiceIntent }),

  isOffline: false,
  setIsOffline: (isOffline) => set({ isOffline }),

  copilotMessages: [],
  addCopilotMessage: (msg) => set((s) => ({ copilotMessages: [...s.copilotMessages, msg] })),
  clearCopilot: () => set({ copilotMessages: [] }),

  homeChatMessages: [],
  addHomeChatMessage: (msg) => set((s) => ({ homeChatMessages: [...s.homeChatMessages, msg] })),
  updateHomeChatMessage: (id, updates) =>
    set((s) => ({
      homeChatMessages: s.homeChatMessages.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),
  clearHomeChat: () => set({ homeChatMessages: [] }),

  schemeSessionId: null,
  setSchemeSessionId: (schemeSessionId) => set({ schemeSessionId }),
  schemeMessages: [],
  addSchemeMessage: (msg) => set((s) => ({ schemeMessages: [...s.schemeMessages, msg] })),
  clearScheme: () => set({ schemeMessages: [], schemeSessionId: null }),
}));
