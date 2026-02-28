require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Global rate limiter
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { error: 'Too many requests. Please slow down.' },
  })
);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./src/routes/auth'));
app.use('/api/feed',    require('./src/routes/feed'));
app.use('/api/mandi',   require('./src/routes/mandi'));
app.use('/api/voice',   require('./src/routes/voice'));
app.use('/api/ai',      require('./src/routes/ai'));
app.use('/api/schemes', require('./src/routes/schemes'));
app.use('/api/weather', require('./src/routes/weather'));
app.use('/api/sos',     require('./src/routes/sos'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'gramvikash-api', ts: Date.now() }));

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🌱 Gramvikash API running on http://localhost:${PORT}`);
  console.log(`   OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Connected' : '⚠️  Not configured'}`);
  console.log(`   Mock DB: ${process.env.USE_MOCK_DB === 'true' ? '✅ Active' : '❌ Disabled'}\n`);
});
