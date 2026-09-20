# DRINKit

Premium liquor storefront with an AI bartender — one Next.js application, deployed entirely on Vercel with no external database or services.

**Production:** https://drinkit-bitwisers.vercel.app

---

## Overview

DRINKit is a full-stack e-commerce experience for spirits, wine, and beer: a 120-product catalog, an AI bartender that recommends bottles against taste, occasion, and budget, plus cart, wishlist, checkout, order history, and an admin console.

Everything — UI and REST API — ships as a single Next.js app. The storefront reads from a bundled JSON catalog and an in-memory demo state layer, so the project deploys with zero infrastructure.

## Live demo

| Account | Email | Password | Role |
|---|---|---|---|
| Customer | `demo@drinkit.dev` | `Demo@123` | user |
| Admin | `admin@drinkit.dev` | `Admin@123` | admin |

With `NEXT_PUBLIC_AUTO_LOGIN=on`, visitors are signed in as the demo customer on page load (demo-only switch — leave unset in real deployments). Admin console: `/admin`.

## Features

- **Storefront** — editorial homepage, faceted shop (`/shop`) with search/sort/filters, product pages with flavor meters, food pairings, and similar-product rails
- **AI Bartender** (`/ai-bartender`) — conversational recommendations with budget enforcement, exact catalog pricing, and product cards you can add to cart
- **Discovery** — editorial `/discover`, side-by-side `/compare`, persistent `/wishlist`
- **Account** — register/login, address book, cart, checkout (address + place order), order history with cancellation
- **Admin** — product creation, stock adjustments, deactivation, and order status management
- **Experience** — light ("Ivory Reserve") and dark ("Whiskey Lounge") themes, responsive layouts, mobile navigation, toast feedback

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Route Handlers) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| State | Zustand (client), in-memory singleton (server) |
| Validation | Zod, React Hook Form |
| Auth | JWT (HS256, `jose`), scrypt password hashing |
| AI | Groq chat completions (OpenAI-compatible) + local fallback engine |
| Language | TypeScript 5 |

## Architecture

```
Browser
  │
  ├─ Next.js App Router pages (server + client components)
  │
  └─ /api/*  ──►  app/api/[...path]/route.ts        (single catch-all handler)
                     └─►  lib/server/api.ts          (REST dispatcher)
                            ├─►  lib/server/store.ts (in-memory state, auth, seed data)
                            ├─►  data/catalog.json   (bundled 120-product catalog)
                            └─►  Groq API            (optional; keyword fallback otherwise)
```

- The API is same-origin at `/api`, so no CORS configuration is needed.
- Catalog data is immutable per deployment; all mutable state lives in a per-instance memory singleton (`globalThis`).
- The frontend can be pointed at an alternative API host with `NEXT_PUBLIC_API_URL` (useful when running the optional legacy backend locally).

## Getting started

Requirements: **Node.js 20.9+** (Next.js 16) and npm. No database or external service is required.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — the REST API is served on the same origin at `/api`.

For local overrides, create `frontend/.env.local` (see the table below). None are required to boot.

## Environment variables

| Variable | Required | Scope | Description |
|---|---|---|---|
| `JWT_SECRET` | Recommended | Server | Signing key for session tokens. Falls back to a demo secret when unset — always set in production. |
| `GROQ_API_KEY` | Optional | Server | Enables live LLM replies. Without it, the built-in keyword engine answers. |
| `GROQ_MODEL` | Optional | Server | Groq model id. Default: `openai/gpt-oss-120b`. |
| `NEXT_PUBLIC_API_URL` | Optional | Client | API base URL. Default: `/api` (same origin). |
| `NEXT_PUBLIC_AUTO_LOGIN` | Optional | Client | `on` signs every visitor in as the demo customer (demo deployments only). |
| `NEXT_PUBLIC_AUTO_LOGIN_EMAIL` | Optional | Client | Email used by auto-login. |
| `NEXT_PUBLIC_AUTO_LOGIN_PASSWORD` | Optional | Client | Password used by auto-login. |

> `NEXT_PUBLIC_*` values are inlined into the client bundle at build time. Never place secrets behind that prefix. Auto-login credentials are intentionally public — they only grant the demo account.

Get a Groq key at https://console.groq.com (Dashboard → API Keys).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npx tsc --noEmit` | Type-check the workspace |
| `node scripts/build-catalog.mjs` | Maintainer-only: regenerate `data/catalog.json` from the local `product-catalog/` workspace (not shipped in the repo) |

## API reference

Base URL: `/api`. Protected routes expect `Authorization: Bearer <token>`. Admin routes require the `admin` role.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/profile` |
| Users | `GET /users/me`, `GET/POST /users/me/addresses`, `DELETE /users/me/addresses/:id` |
| Catalog | `GET /catalog/products`, `GET /catalog/categories`, `GET /catalog/products/:id`, `GET /catalog/products/by-ids?ids=` |
| Catalog (admin) | `POST /catalog/admin/products`, `PATCH /catalog/admin/products/:id`, `PATCH /catalog/admin/products/:id/stock`, `DELETE /catalog/admin/products/:id` (soft) |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items`, `DELETE /cart/items` (clear) |
| Wishlist | `GET /wishlist`, `POST /wishlist/:productId`, `DELETE /wishlist/:productId`, `DELETE /wishlist` (clear) |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel` |
| Orders (admin) | `GET /orders/admin/all`, `PATCH /orders/admin/:id/status` |
| AI Bartender | `POST /assistant/chat`, `GET /assistant/chat/history`, `DELETE /assistant/chat/history` |
| Recommendations | `GET /recommendations/popular`, `GET /recommendations/similar/:productId`, `GET /recommendations/for-you` |
| Inventory | `POST /inventory/check-availability` |
| Payments | `POST /payments/create-payment`, `POST /payments/verify` (mock — not wired to the storefront UI) |

Order lifecycle: `pending → confirmed → packed → out_for_delivery → delivered` (cancellable while `pending`/`confirmed`). Totals: delivery fee ₹49, free over ₹999; 5% tax applied at order time.

## AI Bartender

Replies come from Groq's OpenAI-compatible chat completions API:

- Model `openai/gpt-oss-120b` (configurable), temperature `0.4`, `max_tokens` `1500`, `reasoning_effort` `low`
- A per-message catalog context is built from keyword matches, boosting the relevant products
- Hard guarantees enforced in code:
  - Stated budgets are parsed (`under 4000`, `below ₹2k`) and the context is pre-filtered to in-budget products
  - Prices must match the catalog exactly; recommendations are capped at three
  - Products named in the reply must match the returned recommendation ids (with a fallback that derives ids from the reply when the model omits them)
  - Empty or failed model responses fall back to the local engine, so users always get a usable answer
- Without `GROQ_API_KEY`, the local keyword engine handles everything — no external calls required

Chat history is stored per user in memory and cleared via the history endpoint.

## Catalog & imagery

- `frontend/data/catalog.json` — 120 products across 8 categories (whisky, rum, beer, vodka, gin, wine, tequila, RTD; 15 each) with pricing, ABV, flavor tags, tasting notes, pairings, and stock
- `frontend/public/images/` — 108 licensed product photographs sourced from Wikimedia Commons (CC0 / CC BY / CC BY-SA). Attribution records are maintained in the local (untracked) catalog workspace manifest
- The remaining 12 products render branded placeholder images
- Catalog regeneration is a maintainer workflow: `scripts/build-catalog.mjs` reads the local `frontend/product-catalog/` workspace, which is intentionally excluded from the repository

## Deployment (Vercel)

1. Import the repository in Vercel and set **Root Directory** to `frontend`
2. Add environment variables for Production (at minimum `JWT_SECRET`; optionally `GROQ_API_KEY`, auto-login trio)
3. Deploy — the Git integration ships every push to `main` to production, other branches become preview deployments

No databases, storage buckets, or third-party services are required. CLI deploys work too:

```bash
cd frontend
npx vercel --prod
```

## Data & persistence model

All mutable data — users, sessions, addresses, carts, wishlists, orders, chat history, and stock decrements — lives in a per-instance in-memory store:

- State is seeded on first request (demo users, addresses, catalog)
- It resets on cold starts and redeploys, and is not shared across serverless instances
- This is deliberate for a demo/staging deployment with zero infrastructure
- To go multi-instance persistent, replace `lib/server/store.ts` with a real datastore while keeping the API contract in `lib/server/api.ts` unchanged

## Security notes

- Passwords are hashed with scrypt; sessions are HS256 JWTs valid for 7 days
- Set a strong `JWT_SECRET` in production — the fallback demo secret is not private
- Auto-login is a demo-only feature; keep `NEXT_PUBLIC_AUTO_LOGIN` unset for real deployments
- Payment endpoints are mocked and process no card data

## Repository layout

```
frontend/                  Deployable application (Root Directory on Vercel)
├─ app/                    Routes: storefront, account, admin, /api/[...path]
├─ components/             Shared UI
├─ lib/
│  ├─ server/              api.ts (REST dispatcher), store.ts (state + auth)
│  ├─ types.ts             Shared types and API base URL
│  ├─ api.ts               Client-side API wrapper
│  ├─ search-params.ts     URL/search-param helpers
│  └─ collections.ts, occasions.ts   Editorial content
├─ data/catalog.json       Bundled product catalog (generated, committed)
├─ public/images/          Licensed product photography
└─ scripts/                build-catalog.mjs (maintainer tooling)
```

`backend/` (legacy NestJS service) and `frontend/product-catalog/` (catalog source workspace) exist only as local, untracked workspaces — neither is required to build, run, or deploy this project.

## Credits

Product photography sourced from Wikimedia Commons contributors under CC0, CC BY, and CC BY-SA licenses; per-image attribution lives in the local catalog workspace manifest (`product-catalog/attribution/`).
