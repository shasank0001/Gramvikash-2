/**
 * In-memory mock database for development.
 * Replace with real DB (MongoDB/PostgreSQL) in production.
 */
const { v4: uuidv4 } = require('uuid');

// ── Seed data ─────────────────────────────────────────────────────────────
const POSTS = [
  {
    id: uuidv4(),
    authorId: 'user1',
    authorName: 'Ramesh Patil',
    authorTrust: 42,
    tag: 'sell_harvest',
    text: 'Fresh tomatoes available — 2 quintal. Premium quality from this season.',
    audioUrl: null,
    imageUrl: null,
    timestamp: Date.now() - 3600000,
    location: { lat: 19.7515, lng: 75.7139 },
    likes: 12,
    commentCount: 5,
    inventory: { total: 200, remaining: 150, unit: 'kg' },
    bids: [],
    aiAnalysis: null,
    isPinned: false,
  },
  {
    id: uuidv4(),
    authorId: 'user2',
    authorName: 'Sanjay Kumar',
    authorTrust: 38,
    tag: 'weather_alert',
    text: '⚠️ Heavy rain expected tonight. Please cover your harvest and secure equipment.',
    audioUrl: null,
    imageUrl: null,
    timestamp: Date.now() - 7200000,
    location: { lat: 19.7520, lng: 75.7150 },
    likes: 34,
    commentCount: 8,
    inventory: null,
    bids: [],
    aiAnalysis: null,
    isPinned: true,
  },
  {
    id: uuidv4(),
    authorId: 'user3',
    authorName: 'Meera Devi',
    authorTrust: 55,
    tag: 'ask_village',
    text: 'Has anyone used urea on sugarcane this season? My crop leaves are turning yellow.',
    audioUrl: null,
    imageUrl: null,
    timestamp: Date.now() - 10800000,
    location: { lat: 19.7500, lng: 75.7120 },
    likes: 7,
    commentCount: 11,
    inventory: null,
    bids: [],
    aiAnalysis: null,
    isPinned: false,
  },
];

const USERS = new Map();
const SESSIONS = new Map(); // For scheme interviews

module.exports = {
  // Posts
  getPosts: ({ lat, lng, radius = 15 }) => {
    const R = 6371;
    return POSTS.filter((p) => {
      const dLat = ((p.location.lat - lat) * Math.PI) / 180;
      const dLng = ((p.location.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) * Math.cos((p.location.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return dist <= radius;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });
  },

  createPost: (post) => {
    const newPost = { ...post, id: uuidv4(), timestamp: Date.now(), likes: 0, commentCount: 0, bids: [] };
    POSTS.unshift(newPost);
    return newPost;
  },

  getPost: (id) => POSTS.find((p) => p.id === id),

  likePost: (id) => {
    const p = POSTS.find((p) => p.id === id);
    if (p) p.likes += 1;
    return p;
  },

  // Mandi (harvest listings)
  getMandiListings: ({ lat, lng }) => {
    const R = 6371;
    return POSTS.filter((p) => {
      if (p.tag !== 'sell_harvest') return false;
      const dLat = ((p.location.lat - lat) * Math.PI) / 180;
      const dLng = ((p.location.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) * Math.cos((p.location.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= 20;
    });
  },

  placeBid: (postId, bid) => {
    const post = POSTS.find((p) => p.id === postId);
    if (!post) return null;
    const newBid = { ...bid, id: uuidv4(), timestamp: Date.now(), accepted: false };
    post.bids = post.bids ?? [];
    post.bids.push(newBid);
    return newBid;
  },

  acceptBid: (postId, bidId) => {
    const post = POSTS.find((p) => p.id === postId);
    if (!post || !post.bids) return null;
    const bid = post.bids.find((b) => b.id === bidId);
    if (!bid) return null;
    bid.accepted = true;
    if (post.inventory) post.inventory.remaining -= (bid.quantity ?? 0);
    return bid;
  },

  // Users
  getUser: (id) => USERS.get(id),
  setUser: (user) => USERS.set(user.id, user),
  findUserByPhone: (phone) => [...USERS.values()].find((u) => u.phone === phone),

  // Scheme sessions
  createSession: (sessionId, data) => SESSIONS.set(sessionId, data),
  getSession: (sessionId) => SESSIONS.get(sessionId),
  updateSession: (sessionId, data) => {
    const existing = SESSIONS.get(sessionId) ?? {};
    SESSIONS.set(sessionId, { ...existing, ...data });
  },
};
