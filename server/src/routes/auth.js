/**
 * Auth routes — phone-based OTP authentication
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/mockDb');
const router = express.Router();

// In production, store OTPs in Redis with TTL
const OTP_STORE = new Map();

// POST /api/auth/otp — request OTP for phone number
router.post('/otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone is required.' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  OTP_STORE.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });

  // In production: send via MSG91 / Twilio SMS
  console.log(`[Auth] OTP for ${phone}: ${otp}`);

  res.json({ success: true, message: 'OTP sent to your phone.' });
});

// POST /api/auth/verify — verify OTP and return JWT
router.post('/verify', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'phone and otp are required.' });

  const stored = OTP_STORE.get(phone);

  // Dev convenience: accept "123456" as universal OTP
  const isValid =
    otp === '123456' ||
    (stored && stored.otp === otp && Date.now() < stored.expires);

  if (!isValid) return res.status(401).json({ error: 'Invalid or expired OTP.' });

  OTP_STORE.delete(phone);

  // Get or create user
  let user = db.findUserByPhone(phone);
  if (!user) {
    user = {
      id: uuidv4(),
      phone,
      name: 'New Farmer',
      village: '',
      trustScore: 0,
      language: 'en',
      emergencyContacts: [],
    };
    db.setUser(user);
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '30d',
  });

  res.json({ token, user });
});

module.exports = router;
