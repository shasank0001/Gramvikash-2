/**
 * Schemes routes — stateful government scheme eligibility interview
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { runSchemeSession } = require('../services/openai');
const db = require('../db/mockDb');
const router = express.Router();

// POST /api/schemes/session
// Starts a new scheme eligibility session
router.post('/session', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const initialHistory = [
      {
        role: 'user',
        content: 'Hello, I want to find out which government schemes I am eligible for as a farmer.',
      },
    ];
    const result = await runSchemeSession(sessionId, initialHistory);
    db.createSession(sessionId, { history: initialHistory, done: false });
    res.json({
      sessionId,
      question: result.question ?? result.result,
      done: result.done ?? false,
    });
  } catch (err) {
    console.error('[schemes/session]', err.message);
    res.status(500).json({ error: 'Could not start session.', details: err.message });
  }
});

// POST /api/schemes/session/:sessionId/reply
// Body: { answer: string }
router.post('/session/:sessionId/reply', async (req, res) => {
  const { sessionId } = req.params;
  const { answer } = req.body;
  if (!answer) return res.status(400).json({ error: 'answer is required.' });

  const session = db.getSession(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });

  const updatedHistory = [
    ...session.history,
    { role: 'assistant', content: session.lastQuestion ?? '' },
    { role: 'user', content: answer },
  ];

  try {
    const result = await runSchemeSession(sessionId, updatedHistory);
    db.updateSession(sessionId, {
      history: updatedHistory,
      lastQuestion: result.question,
      done: result.done,
    });
    res.json({
      question: result.question,
      result: result.result,
      done: result.done ?? false,
    });
  } catch (err) {
    console.error('[schemes/reply]', err.message);
    res.status(500).json({ error: 'Session failed.', details: err.message });
  }
});

module.exports = router;
