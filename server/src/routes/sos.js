/**
 * SOS routes — emergency alert broadcasting
 */
const express = require('express');
const router = express.Router();

// POST /api/sos/trigger
// Body: { lat, lng, message, contacts: string[] }
router.post('/trigger', async (req, res) => {
  const { lat, lng, message, contacts } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required.' });

  try {
    // In production:
    // 1. Send SMS to contacts via Twilio / MSG91
    // 2. Push notification to nearby app users via FCM
    // 3. Log to emergency response system
    // 4. Optionally call local emergency services

    console.log(`🚨 [SOS TRIGGERED]`);
    console.log(`   Location: ${lat}, ${lng}`);
    console.log(`   Message: ${message}`);
    console.log(`   Contacts notified: ${(contacts ?? []).join(', ') || 'None configured'}`);

    // Simulate SMS sending (mock success)
    const notified = (contacts ?? []).map((c) => ({ contact: c, status: 'sent' }));

    res.json({
      success: true,
      message: 'SOS alert broadcasted successfully.',
      notified,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('[sos/trigger]', err.message);
    res.status(500).json({ error: 'SOS broadcast failed.', details: err.message });
  }
});

module.exports = router;
