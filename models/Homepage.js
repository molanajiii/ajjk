const mongoose = require('mongoose');

const homepageSchema = new mongoose.Schema({
  headline:   { type: String, default: 'The Digital Heaven' },
  subheadline:{ type: String, default: 'WORLD WIDE SUBSCRIPTIONS, PREMIUM ACCOUNTS, GAMES HUB AND POPULAR STREAMING APPS.' },
  badge:      { type: String, default: '⚡ Live Marketplace' },
  tickerLines:[{ type: String }],
  showStats:  { type: Boolean, default: true },
  showSearch: { type: Boolean, default: true },
  banners:    [{ text: String, active: Boolean }],
}, { timestamps: true });

module.exports = mongoose.model('Homepage', homepageSchema);
