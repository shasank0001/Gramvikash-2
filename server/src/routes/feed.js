/**
 * Feed routes — community posts with geofencing
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db/mockDb');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../tmp/') });

// GET /api/feed?lat=&lng=&radius=
router.get('/', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 10;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required.' });
  }

  const posts = db.getPosts({ lat, lng, radius });
  res.json({ posts, total: posts.length });
});

// POST /api/feed/post
router.post('/post', upload.fields([{ name: 'audio' }, { name: 'image' }]), (req, res) => {
  const { text, tag, lat, lng, authorName, authorId } = req.body;
  if (!text || !tag) return res.status(400).json({ error: 'text and tag are required.' });

  const post = db.createPost({
    authorId: authorId || 'anonymous',
    authorName: authorName || 'Farmer',
    authorTrust: 0,
    tag,
    text,
    audioUrl: null, // In production, upload to S3/GCS and store URL
    imageUrl: null,
    location: { lat: parseFloat(lat) || 0, lng: parseFloat(lng) || 0 },
    isPinned: false,
    inventory: req.body.inventoryTotal
      ? {
          total: parseInt(req.body.inventoryTotal),
          remaining: parseInt(req.body.inventoryTotal),
          unit: req.body.inventoryUnit || 'kg',
        }
      : null,
  });

  res.status(201).json({ post });
});

// POST /api/feed/post/:id/like
router.post('/post/:id/like', (req, res) => {
  const post = db.likePost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  res.json({ likes: post.likes });
});

module.exports = router;
