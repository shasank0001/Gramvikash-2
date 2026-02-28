/**
 * AI routes — Co-Pilot chat and crop diagnosis
 */
const express = require('express');
const { askCoPilot } = require('../services/openai');
const router = express.Router();

// POST /api/ai/copilot
// Body: { message, imageBase64?, history? }
router.post('/copilot', async (req, res) => {
  const { message, imageBase64, history } = req.body;
  if (!message && !imageBase64) {
    return res.status(400).json({ error: 'message or imageBase64 is required.' });
  }
  try {
    const result = await askCoPilot(message || '', imageBase64, history ?? []);
    res.json(result);
  } catch (err) {
    console.error('[ai/copilot]', err.message);
    res.status(500).json({ error: 'AI request failed.', details: err.message });
  }
});

// POST /api/ai/diagnose
// Body: { imageBase64, location: { lat, lng } }
router.post('/diagnose', async (req, res) => {
  const { imageBase64, location } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required.' });
  try {
    const result = await askCoPilot(
      `Please diagnose any crop diseases visible in this image. 
       The farmer is located at lat ${location?.lat}, lng ${location?.lng} in India.
       Consider local climate and common regional diseases.
       Provide: 1) Disease name 2) Cause 3) Immediate treatment 4) Prevention.`,
      imageBase64,
      []
    );
    res.json(result);
  } catch (err) {
    console.error('[ai/diagnose]', err.message);
    res.status(500).json({ error: 'Diagnosis failed.', details: err.message });
  }
});

module.exports = router;
