// scripts/seed.js  —  run once: node scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Admin    = require('../models/Admin');
const Product  = require('../models/Product');
const Coupon   = require('../models/Coupon');
const Homepage = require('../models/Homepage');

async function seed() {
  await connectDB();

  // ── Admin ──────────────────────────────────────────────
  const existing = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
  if (!existing) {
    await Admin.create({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'playbeat2026',
      role: 'super_admin',
      name: 'Admin',
    });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️  Admin already exists — skipping');
  }

  // ── Products ───────────────────────────────────────────
  const prodCount = await Product.countDocuments();
  if (prodCount === 0) {
    await Product.insertMany([
      { name: 'ChatGPT Plus 1M',  category: 'AI Tools',       price: 5500,  stock: 142, totalSold: 1248, delivery: 'Instant' },
      { name: 'Valorant Bundle',  category: 'Games',           price: 24800, stock: 88,  totalSold: 389,  delivery: 'Instant' },
      { name: 'PS Plus 12M',      category: 'Subscriptions',   price: 16400, stock: 9,   totalSold: 214,  delivery: 'Instant' },
      { name: 'Adobe CC All Apps',category: 'Software',        price: 15000, stock: 55,  totalSold: 612,  delivery: 'Manual'  },
      { name: 'Midjourney Basic', category: 'AI Tools',        price: 2800,  stock: 4,   totalSold: 930,  delivery: 'Instant' },
      { name: 'Xbox Game Pass 3M',category: 'Subscriptions',   price: 8900,  stock: 200, totalSold: 540,  delivery: 'Instant' },
      { name: 'Spotify Premium 1M',category:'Subscriptions',   price: 1200,  stock: 500, totalSold: 2108, delivery: 'Instant' },
      { name: 'Steam Wallet $20', category: 'Gift Cards',      price: 6200,  stock: 0,   totalSold: 310,  delivery: 'Instant' },
      { name: 'Canva Pro 1Y',     category: 'Software',        price: 4500,  stock: 78,  totalSold: 445,  delivery: 'Instant' },
    ]);
    console.log('✅ Sample products seeded');
  }

  // ── Coupons ────────────────────────────────────────────
  const cpnCount = await Coupon.countDocuments();
  if (cpnCount === 0) {
    await Coupon.insertMany([
      { code: 'SAVE20',    type: 'percent', value: 20,  usageLimit: 500,  usedCount: 142, expiresAt: new Date('2026-12-31') },
      { code: 'FLAT500',   type: 'fixed',   value: 500, usageLimit: 200,  usedCount: 88,  expiresAt: new Date('2026-06-30') },
      { code: 'WELCOME10', type: 'percent', value: 10,  usageLimit: null, usedCount: 310, expiresAt: null },
    ]);
    console.log('✅ Sample coupons seeded');
  }

  // ── Homepage ───────────────────────────────────────────
  const hpCount = await Homepage.countDocuments();
  if (hpCount === 0) {
    await Homepage.create({
      headline: 'The Digital Heaven',
      subheadline: 'WORLD WIDE SUBSCRIPTIONS, PREMIUM ACCOUNTS, GAMES HUB AND POPULAR STREAMING APPS.',
      badge: '⚡ Live Marketplace',
      tickerLines: [
        '🔥 Valorant Elderflame Bundle — $89',
        '⚡ ChatGPT Plus 1M — $20',
        '🎮 PS Plus 12M — $59',
        '💎 Adobe CC All Apps — $54',
        '🤖 Midjourney Basic — $10',
        '🆓 Free Gift Card on Orders $50+',
        '🔒 SSL Secured · Instant Delivery',
      ],
    });
    console.log('✅ Homepage defaults seeded');
  }

  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
