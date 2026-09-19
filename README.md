# DRINKit

Liquor delivery platform with an integrated AI sommelier. Web app (Next.js) + backend (NestJS), PostgreSQL + MongoDB, AI assistant powered by Groq (Llama 3.3 70B).

## Structure

```
backend/    NestJS API (auth, catalog, cart, orders, inventory, recommendations, AI assistant, payments, socket.io tracking)
frontend/   Next.js 16 App Router web app (Tailwind CSS, Zustand, dark liquor theme)
seed/       (inside backend) 67 products, cocktail recipes, knowledge docs, demo users
```

## Prerequisites

- Node.js 18+
- PostgreSQL running (default: `postgres://postgres:postgres@localhost:5432/drinkit`)
- MongoDB running (default: `mongodb://localhost:27017/drinkit`)

## Setup — Backend

```bash
cd backend
npm install
cp .env.example .env        # edit values below
npx prisma db push          # create Postgres tables
npm run seed                # seed Mongo (products/cocktails) + Postgres (users, addresses)
npm run start:dev           # API on http://localhost:4000/api — Swagger at http://localhost:4000/docs
```

Key env vars (backend/.env):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/drinkit?schema=public
MONGODB_URI=mongodb://localhost:27017/drinkit
JWT_SECRET=some-long-random-string
GROQ_API_KEY=                       # required for real AI chat
GROQ_MODEL=openai/gpt-oss-120b  # or llama-3.1-8b-instant (faster/cheaper)
```

### Getting a Groq API key

1. Go to https://console.groq.com and sign in.
2. Create an API key (Dashboard → API Keys → Create API Key).
3. Put it in `backend/.env` as `GROQ_API_KEY=...`.

Without a key the assistant still works using a built-in fallback recommendation engine.

### Demo accounts (after seeding)

| Account | Email | Password |
|---|---|---|
| Admin | admin@drinkit.dev | Admin@123 |
| Customer | demo@drinkit.dev | Demo@123 |

### API modules

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/profile` |
| Users | `GET /users/me`, addresses CRUD under `/users/me/addresses` |
| Catalog | `GET /catalog/products` (search/filter/sort/paginate), `GET /catalog/categories`, `GET /catalog/products/:id`, admin CRUD under `/catalog/admin/*` |
| Cart | `GET /cart`, `POST/PATCH /cart/items`, `DELETE /cart/items` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`, `PATCH /orders/admin/:id/status` |
| Inventory | `POST /inventory/check-availability` |
| Recommendations | `GET /recommendations/for-you`, `/recommendations/similar/:productId`, `/recommendations/popular` |
| AI Assistant | `POST /assistant/chat`, `GET/DELETE /assistant/chat/history` |
| Payments | `POST /payments/create-payment`, `POST /payments/verify` (mock) |
| Live tracking | socket.io namespace `/tracking` → event `order:status` |
| Admin | `GET /orders/admin/all`, `PATCH /orders/admin/:id/status`, product CRUD under `/catalog/admin/*` (admin role enforced) |

## Admin dashboard

Log into the web app with `admin@drinkit.dev / Admin@123` and open `/admin` — product list with stock bumping, new-product form, and order status management (updates push live to the customer's tracking page via socket.io).

## Setup — Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:3000
```

Optional env: `NEXT_PUBLIC_API_URL=http://localhost:4000/api`, `NEXT_PUBLIC_WS_URL=http://localhost:4000`.

## Notes

- AI chat is OpenAI-SDK compatible: `baseURL: https://api.groq.com/openai/v1`, `apiKey: $GROQ_API_KEY`, model `openai/gpt-oss-120b` (see `backend/src/modules/ai-assistant/ai-assistant.service.ts`).
- Payments are mocked for the MVP; Razorpay wiring point is `backend/src/modules/payments/payments.service.ts`.
- Never commit `.env` or key files.

## Product images

113 of 120 products use real product photos downloaded from Wikimedia Commons (CC0/CC BY/CC BY-SA) � see DRINKit-product-catalog/data/substitutions-plan.md and attribution/IMAGE-CREDITS.md for licensing. Remaining 7 product rows render branded placeholders until licensed assets are sourced. Images live in frontend/public/images (copyright/licensing respects Commons attribution rows in the manifest).

## Vercel-only deployment (JSON demo mode)

The frontend ships a built-in API at /api/* (Next.js route handlers) backed by rontend/data/catalog.json plus in-memory demo state � **no external databases required**.

1. Import this repo on Vercel, set **Root Directory** to rontend.
2. Environment variables:
   - `GROQ_API_KEY` (console.groq.com) � optional, fallback engine works without it
   - `GROQ_MODEL=openai/gpt-oss-120b`
