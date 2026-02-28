/**
 * Mandi routes — harvest listings and live bidding
 */
const express = require('express');
const db = require('../db/mockDb');
const router = express.Router();

// GET /api/mandi?lat=&lng=
router.get('/', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng are required.' });
  const listings = db.getMandiListings({ lat, lng });
  res.json({ listings });
});

// POST /api/mandi/:postId/bid
// Body: { amount: number, unit: string }
router.post('/:postId/bid', (req, res) => {
  const { amount, unit } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount is required.' });
  const bid = db.placeBid(req.params.postId, {
    bidderId: req.body.bidderId || 'buyer1',
    bidderName: req.body.bidderName || 'Buyer',
    amount: parseFloat(amount),
    unit: unit || 'kg',
    quantity: parseFloat(req.body.quantity) || 0,
  });
  if (!bid) return res.status(404).json({ error: 'Listing not found.' });
  res.status(201).json({ bid });
});

// POST /api/mandi/:postId/bid/:bidId/accept
router.post('/:postId/bid/:bidId/accept', (req, res) => {
  const result = db.acceptBid(req.params.postId, req.params.bidId);
  if (!result) return res.status(404).json({ error: 'Bid or listing not found.' });
  res.json({ success: true, bid: result });
});

module.exports = router;
