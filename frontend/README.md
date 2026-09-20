# DRINKit — Web Application

This directory is the entire deployable application: the storefront UI **and** the REST API (`/api/*` route handlers) that serve it. It runs standalone with no database or external service.

See the [root README](../README.md) for the full project documentation.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000 — API available on the same origin at /api
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npx tsc --noEmit` | Type-check |

## Configuration

Optional `.env.local` values (none required):

```env
JWT_SECRET=                      # recommended; signs session tokens
GROQ_API_KEY=                    # optional; enables live AI replies
GROQ_MODEL=openai/gpt-oss-120b   # optional; default shown
NEXT_PUBLIC_API_URL=/api         # optional; default shown
```

Demo deployments may also set `NEXT_PUBLIC_AUTO_LOGIN=on` plus `NEXT_PUBLIC_AUTO_LOGIN_EMAIL` / `NEXT_PUBLIC_AUTO_LOGIN_PASSWORD` to sign visitors in as the demo customer automatically.

## Architecture

- `app/` — App Router pages; `app/api/[...path]/route.ts` is the API entry point
- `lib/server/api.ts` — REST dispatcher (auth, catalog, cart, wishlist, orders, AI, admin)
- `lib/server/store.ts` — in-memory state, JWT sessions, scrypt password hashing, seed data
- `data/catalog.json` — bundled 120-product catalog; imagery in `public/images/`
