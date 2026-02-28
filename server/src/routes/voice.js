/**
 * Voice routes — STT, TTS, Intent Parsing
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { transcribeAudio, synthesizeSpeech, parseVoiceIntent } = require('../services/openai');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../tmp/') });

// POST /api/voice/transcribe
// Accepts: multipart audio file
// Returns: { text, language }
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided.' });
  try {
    const result = await transcribeAudio(req.file.path);
    res.json(result);
  } catch (err) {
    console.error('[voice/transcribe]', err.message);
    res.status(500).json({ error: 'Transcription failed.', details: err.message });
  } finally {
    // Clean up temp file
    fs.unlink(req.file.path, () => {});
  }
});

// POST /api/voice/intent
// Body: { text: string, language: string }
// Returns: { action, screen, params, speakResponse }
router.post('/intent', async (req, res) => {
  const { text, language } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required.' });
  try {
    const intent = await parseVoiceIntent(text, language ?? 'en');
    res.json(intent);
  } catch (err) {
    console.error('[voice/intent]', err.message);
    res.status(500).json({ error: 'Intent parsing failed.', details: err.message });
  }
});

// POST /api/voice/tts
// Body: { text: string, language: string }
// Returns: audio/mpeg buffer
router.post('/tts', async (req, res) => {
  const { text, language } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required.' });
  try {
    const audioBuffer = await synthesizeSpeech(text, language ?? 'en');
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=3600',
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('[voice/tts]', err.message);
    res.status(500).json({ error: 'TTS failed.', details: err.message });
  }
});

module.exports = router;
