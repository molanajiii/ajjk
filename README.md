# PlayBeat Backend — Express + MongoDB

Full REST API for the PlayBeat Admin Panel.

---

## Stack
- **Runtime:** Node.js 18+
- **Framework:** Express 4
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT (Bearer token)
- **Hosting:** Render (free/starter tier)

---

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env
# → Edit .env and fill in MONGODB_URI + JWT_SECRET at minimum

# 3. Seed the database (creates admin user + sample data)
node scripts/seed.js

# 4. Start dev server
npm run dev
# Server runs at http://localhost:5000
```

---

## Deploy to Render

1. Push this folder to a GitHub repo (private is fine).
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect your GitHub repo.
4. Build command: `npm install`  
   Start command: `npm start`
5. Add **Environment Variables** in Render Dashboard:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Long random string (32+ chars) |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | Your chosen password |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `JAZZCASH_MERCHANT_ID` | Your JazzCash merchant ID |
| `JAZZCASH_PASSWORD` | JazzCash password |
| `JAZZCASH_HASH_KEY` | JazzCash hash key |
| `EASYPAISA_STORE_ID` | Easypaisa store ID |
| `EASYPAISA_HASH_KEY` | Easypaisa hash key |
| `ALFALAH_USERNAME` | Alfalah username |
| `ALFALAH_PASSWORD` | Alfalah password |
| `ALFALAH_HASH_KEY1` | Alfalah key 1 |
| `ALFALAH_HASH_KEY2` | Alfalah key 2 |
| `MEEZAN_USERNAME` | MezPay username |
| `MEEZAN_PASSWORD` | MezPay password |
| `ALLOWED_ORIGINS` | `https://playbeat.digital,https://admin.playbeat.digital` |

6. After deploy succeeds, run the seed script once via Render Shell:
   ```
   node scripts/seed.js
   ```

---

## MongoDB Atlas Setup

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas).
2. Create database user with read/write access.
3. Whitelist Render IP: **0.0.0.0/0** (allow all) in Network Access.
4. Copy the connection string → paste into `MONGODB_URI`.
5. Database name: `playbeat`

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login → returns JWT |
| GET  | `/api/auth/me` | ✅ | Current admin info |
| POST | `/api/auth/change-password` | ✅ | Change password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all (query: `?category=&active=&q=`) |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/products/:id/add-keys` | Bulk add stock keys |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List (query: `?status=&gateway=&q=&page=&limit=`) |
| POST | `/api/orders` | Create order (auto-delivers instant products) |
| PATCH | `/api/orders/:id/status` | Update status |
| DELETE | `/api/orders/:id` | Delete order |

### Customers
`GET /api/customers` · `PATCH /:id/ban` · `PATCH /:id/unban` · `DELETE /:id`

### Coupons
`GET /api/coupons` · `POST /api/coupons` · `PUT /:id` · `DELETE /:id`  
`POST /api/coupons/validate` — public endpoint for storefront

### Tickets
`GET /api/tickets` · `POST /api/tickets` (public) · `POST /:id/reply` · `PATCH /:id/status`

### Analytics
`GET /api/analytics/dashboard` · `/revenue?days=30` · `/gateway` · `/top-products`

### Homepage
`GET /api/homepage` (public) · `PUT /api/homepage` (admin)

### Staff
`GET /api/staff` · `POST /api/staff` · `DELETE /api/staff/:id`

### Payment Webhooks
`POST /api/payments/jazzcash/callback`  
`POST /api/payments/easypaisa/callback`  
`POST /api/payments/stripe/webhook`  
`PATCH /api/payments/confirm/:orderId` — manual confirm (admin)

### Health
`GET /health` → `{ status: 'ok', time: '...' }`

---

## Connecting the Admin HTML to this API

In `admin__1_.html`, the connection bar already shows `playbeat-backend.onrender.com`.  
Update the `API_BASE` constant (or add one at the top of the `<script>` block):

```js
const API_BASE = 'https://playbeat-backend.onrender.com';
// then use fetch(API_BASE + '/api/orders', ...) etc.
```

Store the JWT in `sessionStorage` after login and send it as:
```
Authorization: Bearer <token>
```

---

## Errors Found in admin HTML (audit notes)

1. **Hardcoded credentials in HTML** — `admin / playbeat2026` shown as a hint. Remove this from production.
2. **`ADMIN_PASS` stored in `localStorage`** — insecure; the backend now owns auth via JWT.
3. **`filterSupport()` function referenced but not defined** — add:
   ```js
   function filterSupport(val){
     document.querySelectorAll('.sp').forEach(r=>{
       r.style.display=(!val||r.dataset.s===val)?'':'none';
     });
   }
   ```
4. **`buildAnalytics()` called from select but not defined** — add stub or full chart-rebuild function.
5. **`editInvRow()` referenced but not defined** — needs implementation for editing inventory rows.
6. **No `nav('roles',…)` section exists in HTML** — sidebar item for "Roles & Auth" has no matching `<div id="roles">` section.
7. **No `nav('api',…)` section exists in HTML** — same issue for "API Config".
8. **`filterProd()` populates `prd-tb` from a hardcoded `PRODUCTS` array** — wire to `/api/products` instead.
9. **`saveSettings()` only shows a toast** — should POST to `/api/auth/change-password` and a settings endpoint.
10. **`addBanner()` uses `prompt()`** — replace with modal for production UX.
